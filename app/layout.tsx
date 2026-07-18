import type { Metadata } from "next";
import { Lato, Roboto_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./code-styles.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ScrollProgress } from "@/components/ui/scroll-progress";
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

// Main Heading & Label typography
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arun Nura | Multi-disciplinary Art Practitioner",
  description: "Portfolio of Arun Nura, a multi-disciplinary art practitioner specializing in visual practices, experimental films, performance art and AI-code art.",
  metadataBase: new URL("https://arunrajan6600.github.io/nuraweb"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Arun Nura | Multi-disciplinary Art Practitioner",
    description: "Portfolio of Arun Nura, a multi-disciplinary art practitioner specializing in visual practices, experimental films, performance art and AI-code art.",
    url: "https://arunrajan6600.github.io/nuraweb",
    siteName: "Arun Nura Portfolio",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://arunrajan6600.github.io/arunnura/images/manKEY.png",
        width: 1200,
        height: 630,
        alt: "Arun Nura - Multi-disciplinary Art Practitioner",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arun Nura | Multi-disciplinary Art Practitioner",
    description: "Portfolio of Arun Nura, a multi-disciplinary art practitioner specializing in visual practices, experimental films, performance art and AI-code art.",
    images: ["https://arunrajan6600.github.io/arunnura/images/manKEY.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${lato.variable} ${robotoMono.variable} ${jetbrainsMono.variable} min-h-screen bg-background font-mono antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <div className="relative min-h-screen flex flex-col z-10">
              <ScrollProgress />
              <a href="#main-content" className="skip-to-content">
                skip to content
              </a>
              <Header />
              <main id="main-content" className="relative z-10 flex-1 w-full">
                <div className="container max-w-5xl mx-auto px-4 py-6 sm:px-6 md:py-10 lg:px-8">
                  <Breadcrumbs />
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
