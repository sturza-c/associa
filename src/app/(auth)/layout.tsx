export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#06070d]">

      {/* ── Scanlines ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* ── Grain layer 1 — ultra-coarse ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-20 grain-flicker"
        style={{
          opacity: 0.10,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.35' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '300px 300px',
        }}
      />
      {/* ── Grain layer 2 — coarse, animated ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-20 grain-drift"
        style={{
          opacity: 0.22,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '180px 180px',
        }}
      />
      {/* ── Grain layer 3 — fine ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-20"
        style={{
          opacity: 0.12,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='70' height='70' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '70px 70px',
        }}
      />

      {/* ── Dot grid ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* ── Ambient glows ── */}
      {/* Top-left: violet/indigo */}
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-full"
        style={{
          top: '-20%',
          left: '-12%',
          width: '65vw',
          height: '65vw',
          background: 'radial-gradient(circle, oklch(0.42 0.20 290 / 28%) 0%, transparent 65%)',
          filter: 'blur(50px)',
          animation: 'drift-a 18s ease-in-out infinite',
        }}
      />
      {/* Bottom-right: indigo/blue */}
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-full"
        style={{
          bottom: '-15%',
          right: '-12%',
          width: '55vw',
          height: '55vw',
          background: 'radial-gradient(circle, oklch(0.35 0.16 240 / 26%) 0%, transparent 65%)',
          filter: 'blur(70px)',
          animation: 'drift-b 22s ease-in-out infinite',
        }}
      />
      {/* Center accent: teal hint */}
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-full"
        style={{
          top: '55%',
          left: '25%',
          width: '40vw',
          height: '40vw',
          background: 'radial-gradient(circle, oklch(0.32 0.12 195 / 14%) 0%, transparent 70%)',
          filter: 'blur(90px)',
          animation: 'drift-c 28s ease-in-out infinite',
        }}
      />
      {/* Top-right: warm rose hint */}
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-full"
        style={{
          top: '-5%',
          right: '5%',
          width: '30vw',
          height: '30vw',
          background: 'radial-gradient(circle, oklch(0.38 0.14 340 / 10%) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'drift-d 34s ease-in-out infinite',
        }}
      />

      {/* ── Light streaks ── */}
      {/* Horizontal */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 right-0"
        style={{
          top: '37%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, oklch(1 0 0 / 3%) 20%, oklch(0.72 0.12 290 / 10%) 50%, oklch(1 0 0 / 3%) 80%, transparent 100%)',
        }}
      />
      {/* Diagonal slash */}
      <div
        aria-hidden
        className="pointer-events-none fixed"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(125deg, transparent 35%, oklch(0.65 0.10 280 / 4%) 50%, transparent 65%)',
        }}
      />

      {/* ── Vignette ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background: 'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 35%, #06070d 100%)',
        }}
      />
      {/* Edge burn — corners darkening */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          boxShadow: 'inset 0 0 120px 60px rgba(0,0,0,0.55)',
        }}
      />

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes drift-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(3%, 5%) scale(1.06); }
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
        @keyframes drift-d {
          0%, 100% { transform: translate(0, 0) scale(1); }
          45% { transform: translate(-3%, 4%) scale(1.05); }
        }
        @keyframes grain-drift {
          0%   { transform: translate(0, 0); }
          10%  { transform: translate(-2%, -3%); }
          20%  { transform: translate(3%, -1%); }
          30%  { transform: translate(-1%, 4%); }
          40%  { transform: translate(4%, 2%); }
          50%  { transform: translate(-3%, -2%); }
          60%  { transform: translate(1%, 3%); }
          70%  { transform: translate(-4%, 1%); }
          80%  { transform: translate(2%, -4%); }
          90%  { transform: translate(-2%, 2%); }
          100% { transform: translate(0, 0); }
        }
        @keyframes grain-flicker {
          0%,100% { opacity: 0.10; }
          25% { opacity: 0.13; }
          50% { opacity: 0.08; }
          75% { opacity: 0.12; }
        }
        .grain-drift  { animation: grain-drift  8s steps(1, end) infinite; }
        .grain-flicker { animation: grain-flicker 6s ease-in-out infinite; }
      `}</style>

      {/* ── Content ── */}
      <div className="relative z-30 w-full max-w-md">
        <div className="text-center mb-10">
          <p
            className="text-[10px] text-white/25 uppercase tracking-[0.38em] font-semibold mb-6"
          >
            Suisse · Associations
          </p>

          {/* Brand mark */}
          <div className="relative inline-block mb-1">
            <h1
              className="text-[80px] leading-none text-white/92"
              style={{
                fontFamily: 'var(--font-title)',
                fontStyle: 'italic',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                textShadow: '0 0 80px oklch(0.5 0.2 290 / 30%), 0 2px 40px rgba(0,0,0,0.6)',
              }}
            >
              Associa
            </h1>
            {/* Underline accent */}
            <div
              className="mx-auto mt-3"
              style={{
                height: '1px',
                width: '48px',
                background: 'linear-gradient(90deg, transparent, oklch(0.7 0.16 290 / 80%), transparent)',
              }}
            />
          </div>

          <p className="text-white/28 mt-6 text-sm tracking-wide">
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
