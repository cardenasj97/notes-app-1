export function AuthCard({
  children,
  eyebrow,
  title,
  description,
}: Readonly<{
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}>) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-2xl shadow-slate-950/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(129,140,248,0.16),_transparent_35%)]" />
      <div className="relative space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-xl text-sm leading-6 text-slate-300">{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
