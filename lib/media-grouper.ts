import { Cell, ImageContent, VideoContent, FileContent } from "@/types/post";

export interface GroupedImageCell {
  id: string;
  type: "image-gallery";
  images: Array<{
    id: string;
    url: string;
    alt: string;
  }>;
}

export interface GroupedVideoCell {
  id: string;
  type: "video-collection";
  videos: Array<{
    id: string;
    url: string;
    title: string;
    provider?: "youtube" | "vimeo" | "direct";
  }>;
}

export type GroupedCell =
  | { id: string; type: "markdown"; content: string; order?: number }
  | { id: string; type: "file"; content: FileContent; order?: number }
  | GroupedImageCell
  | GroupedVideoCell;

// Helper to parse content if it is a JSON string
export function parseCellContent<T>(content: unknown): T {
  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {
      return content as unknown as T;
    }
  }
  return content as T;
}

export function groupCells(cells: Cell[]): GroupedCell[] {
  if (!cells || cells.length === 0) return [];

  const grouped: GroupedCell[] = [];
  let currentImageGroup: GroupedImageCell | null = null;
  let currentVideoGroup: GroupedVideoCell | null = null;

  for (const cell of cells) {
    if (cell.type === "image") {
      if (currentVideoGroup) {
        grouped.push(currentVideoGroup);
        currentVideoGroup = null;
      }

      const imgContent = parseCellContent<ImageContent>(cell.content);
      const imgItem = {
        id: cell.id,
        url: imgContent.url || "",
        alt: imgContent.alt || "",
      };

      if (currentImageGroup) {
        currentImageGroup.images.push(imgItem);
      } else {
        currentImageGroup = {
          id: `gallery-${cell.id}`,
          type: "image-gallery",
          images: [imgItem],
        };
      }
    } else if (cell.type === "video") {
      if (currentImageGroup) {
        grouped.push(currentImageGroup);
        currentImageGroup = null;
      }

      const vidContent = parseCellContent<VideoContent>(cell.content);
      const vidItem = {
        id: cell.id,
        url: vidContent.url || "",
        title: vidContent.title || "",
        provider: vidContent.provider,
      };

      if (currentVideoGroup) {
        currentVideoGroup.videos.push(vidItem);
      } else {
        currentVideoGroup = {
          id: `video-col-${cell.id}`,
          type: "video-collection",
          videos: [vidItem],
        };
      }
    } else {
      if (currentImageGroup) {
        grouped.push(currentImageGroup);
        currentImageGroup = null;
      }
      if (currentVideoGroup) {
        grouped.push(currentVideoGroup);
        currentVideoGroup = null;
      }

      if (cell.type === "markdown") {
        grouped.push({
          id: cell.id,
          type: "markdown",
          content: cell.content as string,
          order: cell.order,
        });
      } else if (cell.type === "file") {
        grouped.push({
          id: cell.id,
          type: "file",
          content: parseCellContent<FileContent>(cell.content),
          order: cell.order,
        });
      }
    }
  }

  if (currentImageGroup) {
    grouped.push(currentImageGroup);
  }
  if (currentVideoGroup) {
    grouped.push(currentVideoGroup);
  }

  return grouped;
}

export function getMediaCounts(cells: Cell[]) {
  let imagesCount = 0;
  let videosCount = 0;

  if (cells && Array.isArray(cells)) {
    for (const cell of cells) {
      if (cell.type === "image") {
        imagesCount++;
      } else if (cell.type === "video") {
        videosCount++;
      }
    }
  }

  return {
    imagesCount,
    videosCount,
    totalMediaCount: imagesCount + videosCount,
  };
}
