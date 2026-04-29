export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-violet-500/10 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-blue-500/10 blur-[140px]"
      />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-semibold mb-3">
            Associations · Suisse
          </p>
          <h1 className="font-heading text-5xl italic text-foreground leading-none">
            Associa
          </h1>
          <p className="text-muted-foreground mt-4 text-sm">
            Gérez votre association <span className="font-heading italic">simplement</span>.
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
