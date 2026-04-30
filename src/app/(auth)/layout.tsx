import { GrainOverlay } from './grain-overlay'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#01020a]">

      {/* ── Ambient glows ── */}
      {/* All have will-change: transform → pre-promoted to GPU, no tile flash on load */}

      {/* Top-left: violet/indigo — dominant */}
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-full"
        style={{
          top: '-25%',
          left: '-15%',
          width: '70vw',
          height: '70vw',
          background: 'radial-gradient(circle, oklch(0.48 0.24 285 / 52%) 0%, transparent 60%)',
          filter: 'blur(40px)',
          willChange: 'transform',
          animation: 'drift-a 18s ease-in-out infinite',
        }}
      />
      {/* Bottom-right: deep blue */}
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-full"
        style={{
          bottom: '-20%',
          right: '-15%',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, oklch(0.40 0.20 240 / 46%) 0%, transparent 60%)',
          filter: 'blur(50px)',
          willChange: 'transform',
          animation: 'drift-b 22s ease-in-out infinite',
        }}
      />
      {/* Center: teal bloom */}
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-full"
        style={{
          top: '50%',
          left: '20%',
          width: '45vw',
          height: '45vw',
          background: 'radial-gradient(circle, oklch(0.38 0.16 200 / 28%) 0%, transparent 65%)',
          filter: 'blur(70px)',
          willChange: 'transform',
          animation: 'drift-c 28s ease-in-out infinite',
        }}
      />
      {/* Top-right: rose accent */}
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-full"
        style={{
          top: '-8%',
          right: '2%',
          width: '35vw',
          height: '35vw',
          background: 'radial-gradient(circle, oklch(0.42 0.18 340 / 20%) 0%, transparent 65%)',
          filter: 'blur(60px)',
          willChange: 'transform',
          animation: 'drift-d 32s ease-in-out infinite',
        }}
      />

      {/* ── Dot grid ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* ── Film grain (canvas-generated, no SVG, no tile seams) ── */}
      <GrainOverlay />

      {/* ── Light streaks ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 right-0"
        style={{
          top: '38%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, oklch(1 0 0 / 2%) 15%, oklch(0.72 0.14 285 / 14%) 50%, oklch(1 0 0 / 2%) 85%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'linear-gradient(128deg, transparent 32%, oklch(0.60 0.12 280 / 5%) 50%, transparent 68%)',
        }}
      />

      {/* ── Vignette + edge burn ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 70% at 50% 45%, transparent 30%, #01020a 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ boxShadow: 'inset 0 0 140px 70px rgba(0,0,0,0.65)' }}
      />

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes drift-a {
          0%,100% { transform: translate(0,0) scale(1); }
          33%  { transform: translate(3%,5%) scale(1.06); }
          66%  { transform: translate(-2%,3%) scale(0.97); }
        }
        @keyframes drift-b {
          0%,100% { transform: translate(0,0) scale(1); }
          40% { transform: translate(-4%,-3%) scale(1.08); }
          70% { transform: translate(2%,-5%) scale(0.95); }
        }
        @keyframes drift-c {
          0%,100% { transform: translate(0,0); }
          50% { transform: translate(5%,-6%) scale(1.1); }
        }
        @keyframes drift-d {
          0%,100% { transform: translate(0,0) scale(1); }
          45% { transform: translate(-3%,4%) scale(1.05); }
        }
      `}</style>

      {/* ── Content ── */}
      <div className="relative z-30 w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.38em] font-semibold mb-6">
            Suisse · Associations
          </p>

          <div className="relative inline-block mb-1">
            <h1
              className="text-[80px] leading-none text-white/95"
              style={{
                fontFamily: 'var(--font-title)',
                fontStyle: 'italic',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                textShadow: '0 0 80px oklch(0.58 0.24 285 / 60%), 0 0 160px oklch(0.45 0.20 285 / 30%), 0 2px 40px rgba(0,0,0,0.8)',
              }}
            >
              Associa
            </h1>
            <div
              className="mx-auto mt-3"
              style={{
                height: '1px',
                width: '48px',
                background: 'linear-gradient(90deg, transparent, oklch(0.72 0.18 285 / 90%), transparent)',
              }}
            />
          </div>

          <p className="text-white/25 mt-6 text-sm tracking-wide">
            Gérez votre association{' '}
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
              simplement
            </span>
            .
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}
