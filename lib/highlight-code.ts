// Server-side code highlighting utility
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";

/**
 * Pre-processes and highlights code for server-side rendering to avoid hydration mismatches
 * @param code The raw code to highlight
 * @param language The language of the code
 * @returns HTML string with the highlighted code
 */
export function highlightCode(code: string, languageName: string): string {
  // Normalize the language name
  const normalizedLanguage = languageName.toLowerCase();

  // Use the specified language or fallback to plain text
  const language = languages[normalizedLanguage] || languages.javascript;

  try {
    // Return the highlighted HTML
    return highlight(code, language, normalizedLanguage);
  } catch (e) {
    console.error(`Error highlighting code in language ${languageName}:`, e);
    // Return the code as plain text if highlighting fails
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
