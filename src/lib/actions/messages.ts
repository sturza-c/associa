'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface MessageAttachment {
  path: string
  name: string
  size: number
  type: string
  signedUrl?: string
}

export interface ConversationWithDetails {
  id: string
  title: string | null
  association_id: string
  created_by: string
  created_at: string
  updated_at: string
  participants: { user_id: string; full_name: string | null; email: string }[]
  last_message: string | null
  last_message_at: string | null
}

export interface MessageWithSender {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender: { full_name: string | null; email: string }
  attachments: MessageAttachment[]
}

export async function getConversations(associationId: string): Promise<ConversationWithDetails[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: participations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)

  if (!participations?.length) return []

  const conversationIds = participations.map(p => p.conversation_id)

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .eq('association_id', associationId)
    .in('id', conversationIds)
    .order('updated_at', { ascending: false })

  if (!conversations?.length) return []

  const result: ConversationWithDetails[] = []

  for (const conv of conversations) {
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id, user_profiles(full_name, email)')
      .eq('conversation_id', conv.id)

    const { data: lastMsg } = await supabase
      .from('messages')
      .select('content, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    result.push({
      ...conv,
      participants: (participants ?? []).map((p: any) => ({
        user_id: p.user_id,
        full_name: p.user_profiles?.full_name ?? null,
        email: p.user_profiles?.email ?? '',
      })),
      last_message: lastMsg?.content ?? null,
      last_message_at: lastMsg?.created_at ?? null,
    })
  }

  return result
}

export async function getMessages(conversationId: string): Promise<MessageWithSender[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('messages')
    .select('*, user_profiles!sender_id(full_name, email)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getMessages error:', error)
    return []
  }

  const admin = createAdminClient()

  const messages = await Promise.all((data ?? []).map(async (m: any) => {
    const rawAttachments: Omit<MessageAttachment, 'signedUrl'>[] = m.attachments ?? []

    const attachments: MessageAttachment[] = await Promise.all(
      rawAttachments.map(async (a) => {
        const { data: signed } = await admin.storage
          .from('chat')
          .createSignedUrl(a.path, 3600)
        return { ...a, signedUrl: signed?.signedUrl }
      })
    )

    return {
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      created_at: m.created_at,
      sender: {
        full_name: m.user_profiles?.full_name ?? null,
        email: m.user_profiles?.email ?? '',
      },
      attachments,
    }
  }))

  return messages
}

export async function getSignedChatUploadUrl(conversationId: string, fileName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const ext = fileName.split('.').pop() ?? 'bin'
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${conversationId}/${user.id}-${Date.now()}-${safeName}`

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from('chat')
    .createSignedUploadUrl(path)

  if (error || !data) return { error: 'Erreur lors de la génération du lien' }

  return { uploadUrl: data.signedUrl, path }
}

export async function sendMessage(
  conversationId: string,
  content: string,
  attachments: Omit<MessageAttachment, 'signedUrl'>[] = []
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  if (!content.trim() && attachments.length === 0) return { error: 'Message vide' }

  const admin = createAdminClient()

  const { error: msgError } = await admin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      attachments,
    })

  if (msgError) return { error: 'Erreur lors de l\'envoi' }

  await admin
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  revalidatePath('/dashboard/messages')
  return { success: true }
}

export async function deleteConversation(conversationId: string, associationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: conv } = await supabase
    .from('conversations')
    .select('created_by')
    .eq('id', conversationId)
    .single()

  if (!conv) return { error: 'Conversation introuvable' }

  const { data: membership } = await supabase
    .from('association_memberships')
    .select('role')
    .eq('association_id', associationId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  const isPresident = membership?.role === 'president'
  const isCreator = conv.created_by === user.id
  if (!isPresident && !isCreator) {
    return { error: 'Vous ne pouvez pas supprimer cette conversation' }
  }

  const admin = createAdminClient()

  const { data: msgs } = await admin
    .from('messages')
    .select('attachments')
    .eq('conversation_id', conversationId)

  const paths: string[] = []
  for (const m of msgs ?? []) {
    const atts = (m.attachments ?? []) as { path?: string }[]
    for (const a of atts) {
      if (a.path) paths.push(a.path)
    }
  }
  if (paths.length > 0) {
    await admin.storage.from('chat').remove(paths)
  }

  await admin.from('messages').delete().eq('conversation_id', conversationId)
  await admin.from('conversation_participants').delete().eq('conversation_id', conversationId)

  const { error } = await admin.from('conversations').delete().eq('id', conversationId)
  if (error) return { error: 'Erreur lors de la suppression' }

  revalidatePath('/dashboard/messages')
  return { success: true as const }
}

export async function createConversation(
  associationId: string,
  title: string,
  participantIds: string[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()

  const { data: conversation, error: convError } = await admin
    .from('conversations')
    .insert({ association_id: associationId, title: title.trim() || null, created_by: user.id })
    .select()
    .single()

  if (convError) return { error: 'Erreur lors de la création' }

  const allParticipants = [...new Set([user.id, ...participantIds])]
  const { error: partError } = await admin
    .from('conversation_participants')
    .insert(allParticipants.map(uid => ({ conversation_id: conversation.id, user_id: uid })))

  if (partError) return { error: 'Erreur lors de l\'ajout des participants' }

  revalidatePath('/dashboard/messages')
  return { data: conversation }
}
