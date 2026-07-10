import { Cell, VideoContent, FileContent, ImageContent } from "@/types/post";
import { MarkdownCell } from "./markdown-cell";
import { ImageCell } from "./image-cell";
import { VideoCell } from "./video-cell";
import { FileCell } from "./file-cell";

interface PostCellProps {
  cell: Cell;
}

// Helper function to parse content if it's a JSON string
function parseContent<T>(content: string | T): T {
  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {
      // If parsing fails, return the content as is (for markdown)
      return content as T;
    }
  }
  return content;
}

export function PostCell({ cell }: PostCellProps) {
  switch (cell.type) {
    case "markdown":
      return <MarkdownCell content={cell.content as string} />;
    case "image":
      const imageContent = parseContent<ImageContent>(
        cell.content as string | ImageContent
      );
      return <ImageCell content={imageContent} />;
    case "video":
      const videoContent = parseContent<VideoContent>(
        cell.content as string | VideoContent
      );
      return <VideoCell content={videoContent} />;
    case "file":
      const fileContent = parseContent<FileContent>(
        cell.content as string | FileContent
      );
      return <FileCell {...fileContent} />;
    default:
      return null;
  }
}
