import Image from "next/image";
import Link from "next/link";
import { MainNav } from "@/components/layout/main-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchTrigger } from "@/components/layout/search-trigger";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 font-display text-xs uppercase transition-opacity hover:opacity-75"
        >
          <Image
            src="/logo.svg"
            alt="Arun Nura"
            width={54}
            height={23}
            className="h-auto w-[54px] dark:invert"
            priority
          />
          <span className="hidden sm:inline tracking-widest">nura</span>
        </Link>

        <div className="flex items-center gap-2">
          <SearchTrigger />

          <div className="hidden md:block">
            <MainNav />
          </div>

          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
