import Image from "next/image";
import Link from "next/link";
import { MainNav } from "@/components/layout/main-nav";
import { MobileNav } from "@/components/layout/mobile-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 font-mono text-xs uppercase"
        >
          <Image
            src="/logo.svg"
            alt="Arun Nura"
            width={54}
            height={23}
            className="h-auto w-[54px] dark:invert"
            priority
          />
          <span className="hidden sm:inline">nura</span>
        </Link>

        <div className="hidden md:block">
          <MainNav />
        </div>

        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
