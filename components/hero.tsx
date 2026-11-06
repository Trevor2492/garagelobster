export function Hero() {
  return (
    <section className="flex flex-col items-center text-center gap-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Garage Lobster
      </p>
      <h1 className="text-4xl lg:text-6xl font-bold tracking-tight max-w-3xl">
        Every car you love, fully documented.
      </h1>
      <p className="text-lg lg:text-xl text-muted-foreground max-w-xl">
        Log maintenance, track your mods, and plan the next parts haul, all in
        one garage that remembers everything.
      </p>
    </section>
  );
}
