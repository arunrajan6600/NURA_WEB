import { Github, Instagram, Mail } from "lucide-react";
import Link from "next/link";

const links = [
  {
    href: "https://github.com/arunrajan6600",
    label: "GitHub",
    icon: Github,
  },
  {
    href: "https://instagram.com/moodupani",
    label: "Instagram",
    icon: Instagram,
  },
  {
    href: "mailto:arunr6600@yahoo.com",
    label: "Email",
    icon: Mail,
  },
];

export function Footer() {
  return (
    <footer className="relative z-10 mt-20 border-t border-border/80 bg-background/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 font-mono text-xs uppercase text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>(c) {new Date().getFullYear()} arun nura</p>
        <div className="flex flex-wrap gap-3">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 text-foreground/70 hover:text-primary"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
