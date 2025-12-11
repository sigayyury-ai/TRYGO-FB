import type { SeoContentItemDoc } from "../../../db/models/SeoContentItem";
import type { SeoSprintSettingsDocument } from "../../../db/models/SeoSprintSettings";
import type { WordPressPost } from "./apiClient";

/**
 * Map our ContentItem to WordPress Post format
 */
export async function mapContentItemToWordPressPost(
  contentItem: SeoContentItemDoc,
  settings: SeoSprintSettingsDocument | null,
  scheduledDate?: Date
): Promise<WordPressPost> {
  // Map our format to WordPress format
  const formatMap: Record<string, WordPressPost["format"]> = {
    blog: "standard",
    commercial: "standard",
    faq: "standard"
  };

  // Map our category to WordPress category (if default category is set)
  const defaultCategoryId = (settings as any)?.wordpressDefaultCategoryId || null;
  const defaultTagIds = (settings as any)?.wordpressDefaultTagIds || [];

  // Generate slug from title
  const slug = contentItem.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Prepare date for scheduled posts
  let date: string | undefined;
  let date_gmt: string | undefined;
  if (scheduledDate) {
    date = scheduledDate.toISOString();
    date_gmt = scheduledDate.toISOString();
  }

  // Get post type from settings (default: "post", but can be "blog" or custom)
  const postType = (settings as any)?.wordpressPostType || "post";
  
  const wpPost: WordPressPost = {
    title: contentItem.title,
    content: contentItem.content || "",
    status: scheduledDate && scheduledDate > new Date() ? "future" : "publish",
    excerpt: contentItem.outline || undefined,
    slug,
    format: formatMap[contentItem.format] || "standard",
    comment_status: "open",
    ping_status: "open",
    sticky: false,
    type: postType, // Use post type from settings (e.g., "blog" instead of "post")
  };

  // Add scheduled date if provided
  if (date && date_gmt) {
    wpPost.date = date;
    wpPost.date_gmt = date_gmt;
  }

  // Add default category if set
  if (defaultCategoryId) {
    wpPost.categories = [defaultCategoryId];
  }

  // Add default tags if set
  if (defaultTagIds.length > 0) {
    wpPost.tags = defaultTagIds;
  }

  // Upload featured image if available
  // Note: This requires connection settings, which should be passed separately
  // For now, we'll skip image upload in mapper and handle it in the resolver
  // TODO: Refactor to pass connection or handle upload in resolver

  return wpPost;
}

/**
 * Map WordPress post response back to our format (for reference)
 */
export function mapWordPressPostToContentItem(wpPost: any): Partial<SeoContentItemDoc> {
  return {
    title: typeof wpPost.title === "string" ? wpPost.title : wpPost.title?.raw || "",
    content: typeof wpPost.content === "string" ? wpPost.content : wpPost.content?.raw || "",
    outline: typeof wpPost.excerpt === "string" ? wpPost.excerpt : wpPost.excerpt?.raw || "",
    // imageUrl would be fetched from featured_media endpoint
    // category would be mapped from categories
    // format would be mapped from format
  };
}





