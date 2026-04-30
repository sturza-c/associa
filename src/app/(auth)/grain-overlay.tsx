'use client'

import { useEffect, useRef } from 'react'

/**
 * Generates a film-grain texture via canvas (drawn once, instantly).
 * No SVG feTurbulence → no CPU render lag, no tile seams, no compositing artifacts.
 */
export function GrainOverlay() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Draw a 192×192 noise tile — small enough to stay <20 KB when converted
    // to PNG, large enough that the 2× upscale looks like real film grain.
    const SIZE = 192
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')!
    const img = ctx.createImageData(SIZE, SIZE)
    const d = img.data

    // Pure monochrome noise
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0
      d[i] = d[i + 1] = d[i + 2] = v
      d[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)

    // 1:1 mapping → each canvas pixel = 1 CSS pixel = finest possible grain
    const url = canvas.toDataURL('image/png')
    el.style.backgroundImage = `url(${url})`
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-20"
      style={{
        opacity: 0.11,
        backgroundRepeat: 'repeat',
        backgroundSize: '192px 192px', // 1:1 — each noise pixel = 1 CSS pixel
      }}
    />
  )
}
