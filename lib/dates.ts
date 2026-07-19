import { format } from "date-fns";

/**
 * Checks if a post has been modified/updated after its creation.
 * Returns true if the difference between updatedAt and createdAt is greater than 1 second.
 */
export function hasBeenUpdated(createdAt: string | Date, updatedAt: string | Date): boolean {
  const createdTime = new Date(createdAt).getTime();
  const updatedTime = new Date(updatedAt).getTime();
  return updatedTime - createdTime > 1000;
}

/**
 * Formats a date for use in collection cards (compact format).
 * Example: 19 Jul 2026
 */
export function formatCardDate(date: string | Date): string {
  try {
    return format(new Date(date), "d MMM yyyy");
  } catch (e) {
    return "";
  }
}

/**
 * Formats a date for use in the post detail page (long format).
 * Example: 19 July 2026
 */
export function formatDetailDate(date: string | Date): string {
  try {
    return format(new Date(date), "d MMMM yyyy");
  } catch (e) {
    return "";
  }
}
