import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Arun Nura",
  description: "Biography, CV, contact info, and artistic statement of Arun Nura, a Kerala-based multidisciplinary art practitioner.",
  alternates: {
    canonical: "/info/",
  },
};

export const dynamic = "force-dynamic";

async function getResumeUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
  try {
    const res = await fetch(`${baseUrl}/resume`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.url) {
        return json.data.url;
      }
    }
  } catch (err) {
    console.error("Failed to fetch resume:", err);
  }
  return "https://drive.google.com/file/d/15wvnriDqfn0tJTHynQ5Hs7UaNQc0eu3Z/view?usp=drive_link";
}

export default async function AboutPage() {
  const resumeUrl = await getResumeUrl();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://arunrajan6600.github.io/nuraweb";
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Arun Nura",
    "url": siteUrl,
    "jobTitle": "Multidisciplinary Art Practitioner",
    "knowsAbout": [
      "Visual Practices",
      "Experimental Films",
      "Theatre Performances",
      "Anthropological Studies",
      "Performance Arts",
      "AI-Code Art"
    ],
    "sameAs": [
      "https://www.instagram.com/arun.nura/"
    ],
    "alumniOf": {
      "@type": "EducationalOrganization",
      "name": "Mechanical Engineering Graduate"
    }
  };

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <section className="site-section">
        <div className="section-heading">
          <p>about</p>
          <h1 className="text-3xl font-medium uppercase md:text-4xl">
            About
          </h1>
          <span className="text-xs uppercase text-muted-foreground">
            bio / cv / contact
          </span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="space-y-10">
            <section className="border-l border-border pl-5">
              <p className="mb-3 font-mono text-xs uppercase text-muted-foreground">
                Short Bio
              </p>
              <p className="max-w-2xl text-base leading-8 text-foreground/85">
                arun nura is a kerala-based multidisciplinary art practitioner
                specialising in visual practices, experimental films and theatre
                performances. he graduated as a mechanical engineer, and his
                areas of interest widened into anthropological studies, films,
                performance arts and ai-code art.
              </p>
              <p className="mt-5 font-mono text-xs uppercase text-muted-foreground">
                Sporadic Cinema / Pseudo-futurism / Process-ing
              </p>
            </section>

            <section className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
              <div>
                <p className="mb-3 font-mono text-xs uppercase text-muted-foreground">
                  CV
                </p>
                <Link
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link"
                >
                  download pdf
                </Link>
              </div>

              <div>
                <p className="mb-3 font-mono text-xs uppercase text-muted-foreground">
                  Contact
                </p>
                <div className="grid gap-2">
                  <a className="text-link" href="mailto:arunr6600@yahoo.com">
                    email
                  </a>
                  <Link
                    className="text-link"
                    href="https://www.instagram.com/arun.nura/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    instagram
                  </Link>
                </div>
              </div>
            </section>
          </div>

          <div
            className="group relative min-h-[420px] overflow-hidden border border-border bg-card/70"
            tabIndex={0}
            aria-label="Interactive portrait of Arun Nura"
          >
            <Image
              src="https://arunrajan6600.github.io/arunnura/images/monKEY.png"
              alt="Monkey portrait"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover grayscale contrast-125 transition-opacity duration-500 group-hover:opacity-0 group-focus:opacity-0"
            />
            <Image
              src="https://arunrajan6600.github.io/arunnura/images/manKEY.png"
              alt="Portrait of Arun Nura"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover opacity-0 grayscale contrast-125 transition-opacity duration-500 group-hover:opacity-100 group-focus:opacity-100"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.28))]" />
          </div>
        </div>
      </section>
    </div>
  );
}
