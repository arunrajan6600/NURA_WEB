export function Footer() {
  return (
    <footer className="relative z-10 mt-20 border-t border-border/80 bg-background/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 font-display text-xs uppercase text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>(c) {new Date().getFullYear()} arun nura</p>
      </div>
    </footer>
  );
}
