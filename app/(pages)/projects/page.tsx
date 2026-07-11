import { Metadata } from "next";
import { ProjectsList } from "@/components/post/projects-list";

export const metadata: Metadata = {
  title: "Works | Arun Nura",
  description: "Portfolio of artistic works by Arun Nura, including video, image, AI, and interactive installations.",
  alternates: {
    canonical: "/works/",
  },
};

export default function ProjectsPage() {
  return <ProjectsList />;
}
