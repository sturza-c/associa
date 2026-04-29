export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#07080f]">

      {/* ── Grain layers ── */}
      {/* Coarse grain */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          opacity: 0.13,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />
      {/* Fine grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          opacity: 0.07,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '80px 80px',
        }}
      />

      {/* ── Dot grid ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── Vignette ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, #07080f 100%)',
        }}
      />

      {/* ── Ambient glows ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-full"
        style={{
          top: '-15%',
          left: '-10%',
          width: '55vw',
          height: '55vw',
          background: 'radial-gradient(circle, oklch(0.38 0.18 290 / 22%) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'drift-a 18s ease-in-out infinite',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-full"
        style={{
          bottom: '-10%',
          right: '-10%',
          width: '45vw',
          height: '45vw',
          background: 'radial-gradient(circle, oklch(0.30 0.14 240 / 18%) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'drift-b 22s ease-in-out infinite',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-full"
        style={{
          top: '60%',
          left: '30%',
          width: '30vw',
          height: '30vw',
          background: 'radial-gradient(circle, oklch(0.28 0.10 200 / 12%) 0%, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'drift-c 28s ease-in-out infinite',
        }}
      />

      {/* ── Horizontal light streak ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 right-0"
        style={{
          top: '38%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, oklch(1 0 0 / 4%) 30%, oklch(0.7 0.1 290 / 8%) 50%, oklch(1 0 0 / 4%) 70%, transparent 100%)',
        }}
      />

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes drift-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(3%, 5%) scale(1.05); }
          66% { transform: translate(-2%, 3%) scale(0.97); }
        }
        @keyframes drift-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-4%, -3%) scale(1.08); }
          70% { transform: translate(2%, -5%) scale(0.95); }
        }
        @keyframes drift-c {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(5%, -6%) scale(1.1); }
        }
      `}</style>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <p
            className="text-[10px] text-white/30 uppercase tracking-[0.35em] font-semibold mb-5"
            style={{ letterSpacing: '0.35em' }}
          >
            Suisse · Associations
          </p>

          {/* Brand mark */}
          <div className="relative inline-block mb-1">
            <h1
              className="text-[72px] leading-none tracking-[-0.01em] text-white/90"
              style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300 }}
            >
              Associa
            </h1>
            {/* Underline accent */}
            <div
              className="mx-auto mt-2"
              style={{
                height: '1px',
                width: '40px',
                background: 'linear-gradient(90deg, transparent, oklch(0.7 0.15 290 / 70%), transparent)',
              }}
            />
          </div>

          <p className="text-white/30 mt-5 text-sm tracking-wide">
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
