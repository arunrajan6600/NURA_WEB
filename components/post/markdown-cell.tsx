"use client";

import React from "react";
import Markdown from "markdown-to-jsx";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertTriangleIcon, CheckCircle } from "lucide-react";

interface MarkdownCellProps {
  content: string;
}

// Custom Code component for syntax highlighting
import { CodeBlock as UICodeBlock } from "@/components/ui/code-block";

// For proper typing of the props
interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

// Code block component that uses our dedicated UI component for proper formatting
const CodeBlock = ({ className, children, ...props }: CodeBlockProps) => {
  // Check if this is a code block with a language specified
  const match = /language-(\w+)/.exec(className || "");

  if (match && typeof children === "string") {
    // This is a fenced code block with a language
    const language = match[1] || "javascript";
    const codeContent = String(children).trim();

    // Use our client-side code block component with pre-highlighted code
    return <UICodeBlock code={codeContent} language={language} />;
  }

  // For inline code
  return (
    <code
      className={cn(
        "bg-secondary/50 text-primary rounded px-1 py-0.5 font-mono text-sm",
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
};

// Custom table components for better styling
const Table = ({
  children,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) => {
  return (
    <div className="my-6 w-full overflow-auto rounded-md border border-border">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  );
};

const TableHead = (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className="bg-muted/70 border-b border-border" {...props} />
);

const TableRow = (props: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className="m-0 border-t border-border p-0 even:bg-muted/30 hover:bg-muted/50 transition-colors"
    {...props}
  />
);

const TableCell = (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className="px-4 py-2 text-left align-middle [&:not(:last-child)]:border-r border-border"
    {...props}
  />
);

const TableHeaderCell = (
  props: React.ThHTMLAttributes<HTMLTableCellElement>
) => (
  <th
    className="px-4 py-2 text-left font-semibold [&:not(:last-child)]:border-r border-border"
    {...props}
  />
);

// Custom list components for better styling
const UnorderedList = (props: React.HTMLAttributes<HTMLUListElement>) => (
  <ul
    className="list-disc pl-6 my-6 space-y-2 marker:text-primary"
    {...props}
  />
);

const OrderedList = (props: React.OlHTMLAttributes<HTMLOListElement>) => (
  <ol
    className="list-decimal pl-6 my-6 space-y-2 marker:text-primary marker:font-medium"
    {...props}
  />
);

const ListItem = (props: React.LiHTMLAttributes<HTMLLIElement>) => (
  <li className="my-1.5">
    <div className="flex flex-col">{props.children}</div>
  </li>
);

// Custom link component to use Next.js Link for internal links
function CustomLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isInternal = href?.startsWith("/") || href?.startsWith("#");
  const commonClasses =
    "underline underline-offset-4 text-primary hover:text-primary/80 transition-colors font-medium";

  if (isInternal && href?.startsWith("/")) {
    return (
      <Link href={href} className={commonClasses}>
        {children}
      </Link>
    );
  }

  if (href?.startsWith("#")) {
    // Handle anchor links
    return (
      <a href={href} className={commonClasses} {...props}>
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${commonClasses} inline-flex items-center`}
      {...props}
    >
      {children}
    </a>
  );
}

// Custom image component
function CustomImage({ alt, src }: { alt?: string; src?: string }) {
  if (!src) return null;

  return (
    <div className="relative my-8 overflow-hidden rounded-lg">
      {/* Note: For better performance, consider replacing this with next/image when possible */}
      <img
        src={src as string}
        alt={alt || ""}
        className="w-full h-auto rounded-md shadow-sm border border-border/50"
        loading="lazy"
      />
      {alt && (
        <p className="text-center text-xs text-muted-foreground mt-2 italic">
          {alt}
        </p>
      )}
    </div>
  );
}

// Custom callout components
function InfoCallout({ children }: { children: React.ReactNode }) {
  return (
    <Alert variant="info" className="my-6">
      <InfoIcon className="h-4 w-4" />
      <AlertDescription>
        <div className="prose-p:my-1 prose-p:leading-normal">{children}</div>
      </AlertDescription>
    </Alert>
  );
}

function WarningCallout({ children }: { children: React.ReactNode }) {
  return (
    <Alert variant="warning" className="my-6">
      <AlertTriangleIcon className="h-4 w-4" />
      <AlertDescription>
        <div className="prose-p:my-1 prose-p:leading-normal">{children}</div>
      </AlertDescription>
    </Alert>
  );
}

function SuccessCallout({ children }: { children: React.ReactNode }) {
  return (
    <Alert variant="success" className="my-6">
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="prose-p:my-1 prose-p:leading-normal">{children}</div>
      </AlertDescription>
    </Alert>
  );
}

export function MarkdownCell({ content }: MarkdownCellProps) {
  // Process callout syntax in the content
  const processedContent = content
    .replace(/:::info\n([\s\S]*?)\n:::/g, "<InfoCallout>$1</InfoCallout>")
    .replace(
      /:::warning\n([\s\S]*?)\n:::/g,
      "<WarningCallout>$1</WarningCallout>"
    )
    .replace(
      /:::success\n([\s\S]*?)\n:::/g,
      "<SuccessCallout>$1</SuccessCallout>"
    );

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-20">
      <Markdown
        options={{
          overrides: {
            // Code components
            code: CodeBlock,
            // Pass through pre component with minimal attributes
            pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) =>
              children,

            // Link and media components
            a: CustomLink,
            img: CustomImage,

            // Table components
            table: Table,
            thead: TableHead,
            tbody: ({
              children,
              ...props
            }: React.HTMLAttributes<HTMLTableSectionElement>) => (
              <tbody {...props}>{children}</tbody>
            ),
            tr: TableRow,
            td: TableCell,
            th: TableHeaderCell,

            // List components
            ul: UnorderedList,
            ol: OrderedList,
            li: ListItem,

            // Callout components
            InfoCallout,
            WarningCallout,
            SuccessCallout,

            // Better paragraph spacing
            p: ({
              children,
              ...props
            }: React.HTMLAttributes<HTMLParagraphElement>) => (
              <p className="my-4 leading-7" {...props}>
                {children}
              </p>
            ),

            // Better heading spacing
            h1: ({
              children,
              ...props
            }: React.HTMLAttributes<HTMLHeadingElement>) => (
              <h1 className="mt-8 mb-4 text-3xl font-extrabold" {...props}>
                {children}
              </h1>
            ),
            h2: ({
              children,
              ...props
            }: React.HTMLAttributes<HTMLHeadingElement>) => (
              <h2 className="mt-8 mb-3 text-2xl font-bold" {...props}>
                {children}
              </h2>
            ),
            h3: ({
              children,
              ...props
            }: React.HTMLAttributes<HTMLHeadingElement>) => (
              <h3 className="mt-6 mb-2 text-xl font-bold" {...props}>
                {children}
              </h3>
            ),
            h4: ({
              children,
              ...props
            }: React.HTMLAttributes<HTMLHeadingElement>) => (
              <h4 className="mt-5 mb-2 text-lg font-semibold" {...props}>
                {children}
              </h4>
            ),
          },
        }}
      >
        {processedContent}
      </Markdown>
    </div>
  );
}
