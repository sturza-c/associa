'use client'

import useSWR from 'swr'
import { NotesShell } from './notes-shell'
import type { Note, NoteFolder } from '@/types/database'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  associationId: string
  initialData: { notes: Note[]; folders: NoteFolder[] }
  callerUserId: string
}

export function NotesView({ associationId, initialData, callerUserId }: Props) {
  const { data, mutate } = useSWR(
    `/api/notes?associationId=${associationId}`,
    fetcher,
    { fallbackData: initialData },
  )

  return (
    <NotesShell
      notes={data.notes}
      folders={data.folders}
      associationId={associationId}
      callerUserId={callerUserId}
      onRefresh={() => mutate()}
    />
  )
}
