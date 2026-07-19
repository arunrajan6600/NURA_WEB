import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles | Arun Nura",
  description: "Essays, critical writings, and short articles by Arun Nura.",
  alternates: {
    canonical: "/posts/articles/",
  },
};

// /posts/articles now redirects permanently to /posts/papers
// (article type was merged into paper)
export default function ArticlesPage() {
  redirect("/posts/papers");
}
