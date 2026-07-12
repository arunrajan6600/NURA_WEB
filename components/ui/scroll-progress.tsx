"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const handleScroll = useCallback(() => {
    // 1. Calculate scroll progress
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight > 0) {
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    } else {
      setScrollProgress(0);
    }

    // 2. Determine Back to Top visibility threshold
    if (window.scrollY > 400) {
      setShowBackToTop(true);
    } else {
      setShowBackToTop(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once at mount
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[2px] bg-primary z-50 transition-all duration-100 ease-out pointer-events-none"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress indicator"
      />

      {/* Floating Back to Top Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-40 h-9 w-9 rounded-full shadow-md bg-background/90 backdrop-blur border border-border/80 transition-all duration-300 ease-in-out ${
          showBackToTop 
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
            : "opacity-0 translate-y-4 scale-75 pointer-events-none"
        }`}
        aria-label="Scroll back to top"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </>
  );
}
export default ScrollProgress;
