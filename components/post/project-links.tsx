"use client";

import { ProjectMetadata, ProjectLink, ProjectLinkType } from "@/types/post";
import {
  FileText,
  Github,
  Play,
  BookOpen,
  Globe,
  Database,
  Presentation,
  Video,
  Bookmark,
  Link,
} from "lucide-react";

const LINK_TYPE_ICONS: Record<ProjectLinkType, any> = {
  publication: FileText,
  repository: Github,
  demo: Play,
  documentation: BookOpen,
  website: Globe,
  dataset: Database,
  presentation: Presentation,
  video: Video,
  doi: Bookmark,
  other: Link,
};

const LINK_TYPE_LABELS: Record<ProjectLinkType, string> = {
  publication: "publication",
  repository: "repository",
  demo: "live demo",
  documentation: "documentation",
  website: "website",
  dataset: "dataset",
  presentation: "presentation",
  video: "video",
  doi: "doi",
  other: "link",
};

interface ProjectLinksProps {
  pm?: ProjectMetadata | null;
}

export function ProjectLinks({ pm }: ProjectLinksProps) {
  if (!pm) return null;

  // Normalize links: Support both new dynamic links array and legacy fields
  const getNormalizedLinks = (): ProjectLink[] => {
    if (pm.links && pm.links.length > 0) {
      return [...pm.links].sort((a, b) => a.order - b.order);
    }

    const legacyLinks: ProjectLink[] = [];
    let order = 0;

    if (pm.publication) {
      legacyLinks.push({
        id: "legacy-pub",
        type: "publication",
        title: "Publication",
        url: pm.publication,
        order: order++,
      });
    }
    if (pm.repoLink) {
      legacyLinks.push({
        id: "legacy-repo",
        type: "repository",
        title: "GitHub Repository",
        url: pm.repoLink,
        order: order++,
      });
    }
    if (pm.demoLink) {
      legacyLinks.push({
        id: "legacy-demo",
        type: "demo",
        title: "Live Demo",
        url: pm.demoLink,
        order: order++,
      });
    }
    if (pm.docLink) {
      legacyLinks.push({
        id: "legacy-doc",
        type: "documentation",
        title: "Documentation",
        url: pm.docLink,
        order: order++,
      });
    }

    return legacyLinks;
  };

  const links = getNormalizedLinks();

  if (links.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 border-t border-border/60 pt-6 mt-6">
      <h3 className="font-display text-xs uppercase tracking-wider text-muted-foreground font-bold">
        [ project resources ]
      </h3>
      
      <div className="flex flex-wrap gap-3">
        {links.map((link) => {
          const Icon = LINK_TYPE_ICONS[link.type] || Link;
          const displayLabel = link.title || LINK_TYPE_LABELS[link.type] || "Resource";
          
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-border bg-background/50 hover:bg-primary/5 hover:border-primary/50 hover:text-primary px-3.5 py-1.5 font-display text-[10px] uppercase rounded-sm transition-all duration-200 shadow-2xs group"
              title={link.description || displayLabel}
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
              <span>{displayLabel}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
