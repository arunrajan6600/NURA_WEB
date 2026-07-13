import { Cell, VideoContent, FileContent, ImageContent } from "@/types/post";
import { GroupedCell } from "@/lib/media-grouper";
import { MarkdownCell } from "./markdown-cell";
import { ImageCell } from "./image-cell";
import { VideoCell } from "./video-cell";
import { FileCell } from "./file-cell";
import { ImageGallery } from "./image-gallery";
import { VideoCollection } from "./video-collection";

interface PostCellProps {
  cell: Cell | GroupedCell;
}

// Helper function to parse content if it's a JSON string
function parseContent<T>(content: unknown): T {
  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {
      // If parsing fails, return the content as is (for markdown)
      return content as T;
    }
  }
  return content as T;
}

export function PostCell({ cell }: PostCellProps) {
  switch (cell.type) {
    case "markdown":
      return <MarkdownCell content={cell.content as string} />;

    case "image": {
      const imageContent = parseContent<ImageContent>(
        (cell as Cell).content as string | ImageContent
      );
      return <ImageCell content={imageContent} />;
    }

    case "video": {
      const videoContent = parseContent<VideoContent>(
        (cell as Cell).content as string | VideoContent
      );
      return <VideoCell content={videoContent} />;
    }

    case "file": {
      const fileContent = parseContent<FileContent>(
        (cell as Cell).content as string | FileContent
      );
      return <FileCell {...fileContent} />;
    }

    case "image-gallery": {
      const galleryCell = cell as Extract<GroupedCell, { type: "image-gallery" }>;
      return <ImageGallery images={galleryCell.images} />;
    }

    case "video-collection": {
      const collectionCell = cell as Extract<GroupedCell, { type: "video-collection" }>;
      return <VideoCollection videos={collectionCell.videos} />;
    }

    default:
      return null;
  }
}
