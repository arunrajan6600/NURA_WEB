"use client";

import { ProjectMetadata, ProjectCredit, LegacyCredits } from "@/types/post";

const ROLE_LABELS: Record<string, string> = {
  developer: "developer",
  contributor: "contributor",
  advisor: "advisor",
  supervisor: "supervisor",
  mentor: "mentor",
  institution: "institution",
  organization: "organization",
  client: "client",
  sponsor: "sponsor",
  funding: "funding / grant",
  research_lab: "research lab",
  designer: "designer",
  tester: "tester",
  reviewer: "reviewer",
  other: "other credits",
};

interface ProjectCreditsProps {
  pm?: ProjectMetadata | null;
}

export function ProjectCredits({ pm }: ProjectCreditsProps) {
  if (!pm) return null;

  // Normalize credits: Support both new array schema and legacy flat object format
  const isNewFormat = pm.credits && Array.isArray(pm.credits);

  if (!pm.credits) return null;

  if (isNewFormat) {
    const creditsList = [...(pm.credits as ProjectCredit[])].sort((a, b) => a.order - b.order);

    if (creditsList.length === 0) return null;

    // Group credits by role to render multiple developers, supervisors together
    const grouped = creditsList.reduce((acc, credit) => {
      const role = credit.role || "other";
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(credit);
      return acc;
    }, {} as Record<string, ProjectCredit[]>);

    return (
      <div className="mt-16 border-t border-border pt-10 font-display text-xs uppercase space-y-4">
        <h3 className="text-sm font-semibold mb-4 text-foreground/90">[ credits ]</h3>
        
        {Object.entries(grouped).map(([role, list]) => {
          const displayRole = ROLE_LABELS[role] || role;
          
          return (
            <div key={role} className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-4 border-b border-border/10 pb-2 sm:pb-0">
              <span className="text-muted-foreground font-medium">{displayRole}:</span>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {list.map((credit, idx) => {
                  const hasDetails = credit.organization || credit.description;
                  
                  return (
                    <span key={credit.id} className="lowercase text-foreground/90">
                      {credit.url ? (
                        <a
                          href={credit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline underline-offset-4 transition-colors"
                        >
                          {credit.name}
                        </a>
                      ) : (
                        <span>{credit.name}</span>
                      )}
                      
                      {credit.organization && (
                        <span className="text-muted-foreground text-[10px] ml-1">
                          ({credit.organization})
                        </span>
                      )}

                      {credit.description && (
                        <span className="text-muted-foreground text-[10px] ml-1 italic">
                          - {credit.description}
                        </span>
                      )}
                      
                      {idx < list.length - 1 && <span className="text-muted-foreground ml-1 mr-1">,</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Legacy fallback rendering
  const legacy = pm.credits as LegacyCredits;
  const legacyFields = [
    { key: "performers", label: "performers" },
    { key: "cinematography", label: "cinematography" },
    { key: "music", label: "music" },
    { key: "sound", label: "sound design" },
    { key: "editing", label: "editing" },
    { key: "institutions", label: "institutions" },
  ];

  const hasLegacyCredits = legacyFields.some((f) => legacy[f.key as keyof LegacyCredits]);
  const hasLegacyAcks = !!legacy.acknowledgements;

  if (!hasLegacyCredits && !hasLegacyAcks) return null;

  return (
    <div className="mt-16 border-t border-border pt-10 font-display text-xs uppercase space-y-4">
      <h3 className="text-sm font-semibold mb-4 text-foreground/90">[ credits ]</h3>
      
      {legacyFields.map(
        (f) =>
          legacy[f.key as keyof LegacyCredits] && (
            <div key={f.key} className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-4">
              <span className="text-muted-foreground">{f.label}:</span>
              <span className="lowercase text-foreground/90">
                {legacy[f.key as keyof LegacyCredits]}
              </span>
            </div>
          )
      )}

      {legacy.acknowledgements && (
        <div className="border-t border-border/50 pt-4 mt-4">
          <p className="text-muted-foreground mb-2">acknowledgements:</p>
          <p className="text-foreground/80 normal-case leading-relaxed font-sans text-xs max-w-2xl">
            {legacy.acknowledgements}
          </p>
        </div>
      )}
    </div>
  );
}
