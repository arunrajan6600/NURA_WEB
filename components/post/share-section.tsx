"use client";

import { useState } from "react";
import { Check, Copy, Share2, Twitter, Linkedin } from "lucide-react";

interface ShareSectionProps {
  title: string;
  url: string;
}

export function ShareSection({ title, url }: ShareSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: show the URL in a prompt if clipboard API fails
      window.prompt("Copy this link:", url);
    }
  };

  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      label: "Twitter / X",
      icon: <Twitter className="h-3.5 w-3.5" />,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encoded}`,
    },
    {
      label: "LinkedIn",
      icon: <Linkedin className="h-3.5 w-3.5" />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    },
  ];

  return (
    <div className="mt-12 border-t border-border pt-8">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase text-muted-foreground mb-4">
        <Share2 className="h-3 w-3" />
        Share this post
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {shareLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-border/70 px-3 py-1.5 font-mono text-[10px] uppercase text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
            aria-label={`Share on ${link.label}`}
          >
            {link.icon}
            {link.label}
          </a>
        ))}

        {/* Copy link */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 border border-border/70 px-3 py-1.5 font-mono text-[10px] uppercase text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
          aria-label="Copy post link to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-primary" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy Link
            </>
          )}
        </button>
      </div>
    </div>
  );
}
