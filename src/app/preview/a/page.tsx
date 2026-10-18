'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PublicPageDemo } from '../extras'

// Demo of an association's public page (/a/[slug]) — no Supabase.
export default function PublicPagePreview() {
  return (
    <Suspense>
      <Demo />
    </Suspense>
  )
}

function Demo() {
  const form = useSearchParams().get('form')
  return (
    <div className="dark">
      <PublicPageDemo formOpenFor={form ? Number(form) : null} />
    </div>
  )
}
