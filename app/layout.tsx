import type { Metadata } from "next";
import { Lato, Roboto_Mono } from "next/font/google";
import "./globals.css";
import "./code-styles.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "sonner";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arun Nura | Multi-disciplinary Art Practitioner",
  description: "Portfolio of Arun Nura, a multi-disciplinary art practitioner",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${lato.variable} ${robotoMono.variable} min-h-screen bg-background font-mono antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <div className="relative min-h-screen flex flex-col z-10">
              <Header />
              <main className="relative z-10 flex-1 w-full">
                <div className="container max-w-5xl mx-auto px-4 py-6 sm:px-6 md:py-10 lg:px-8">
                  {children}
                </div>
              </main>
              <Footer />
            </div>
            <Toaster richColors closeButton position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
