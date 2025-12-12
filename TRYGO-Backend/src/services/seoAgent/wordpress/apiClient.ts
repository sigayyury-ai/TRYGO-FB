import { config } from "../../../constants/config/env";

/**
 * WordPress REST API Client
 * Handles publishing content to WordPress sites
 */

export interface WordPressPost {
  title: string;
  content: string;
  status?: "draft" | "publish" | "pending" | "private" | "future";
  featured_media?: number;
  categories?: number[];
  tags?: number[]; // WordPress expects tag IDs, not strings
  excerpt?: string;
  slug?: string;
  meta?: Record<string, any>;
  date?: string; // ISO 8601 date string for scheduled posts
  date_gmt?: string; // GMT date for scheduled posts
  author?: number;
  format?: "standard" | "aside" | "chat" | "gallery" | "link" | "image" | "quote" | "status" | "video" | "audio";
  comment_status?: "open" | "closed";
  ping_status?: "open" | "closed";
  sticky?: boolean;
  type?: string; // Post type (default: "post", can be "blog", "page", or custom)
}

export interface WordPressConnection {
  baseUrl: string;
  username: string;
  appPassword: string;
}

class WordPressClient {
  private connection: WordPressConnection | null = null;

  /**
   * Initialize WordPress connection from environment or provided credentials
   */
  initialize(connection?: WordPressConnection): void {
    if (connection) {
      this.connection = connection;
    } else if (config.SEO_AGENT.wordpressBaseUrl && config.SEO_AGENT.wordpressUsername && config.SEO_AGENT.wordpressAppPassword) {
      this.connection = {
        baseUrl: config.SEO_AGENT.wordpressBaseUrl.replace(/\/$/, ""),
        username: config.SEO_AGENT.wordpressUsername,
        appPassword: config.SEO_AGENT.wordpressAppPassword
      };
    }
  }

  /**
   * Get authentication header for WordPress REST API
   */
  private getAuthHeader(): string {
    if (!this.connection) {
      throw new Error("WordPress connection not initialized");
    }
    const credentials = `${this.connection.username}:${this.connection.appPassword}`;
    return `Basic ${Buffer.from(credentials).toString("base64")}`;
  }

  /**
   * Test WordPress connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.connection) {
      return { success: false, error: "WordPress connection not initialized" };
    }

    try {
      const response = await fetch(`${this.connection.baseUrl}/wp-json/wp/v2/users/me`, {
        method: "GET",
        headers: {
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error("[WordPress] Connection test failed:", response.status, errorText);
        return { 
          success: false, 
          error: `WordPress API returned ${response.status}: ${errorText.substring(0, 200)}` 
        };
      }
    } catch (error: any) {
      console.error("[WordPress] Connection test failed:", error);
      return { 
        success: false, 
        error: error.message || "Failed to connect to WordPress. Please check the URL and network connection." 
      };
    }
  }

  /**
   * Publish a post to WordPress
   * Supports custom post types
   */
  async publishPost(post: WordPressPost): Promise<{ id: number; link: string }> {
    if (!this.connection) {
      throw new Error("WordPress connection not initialized");
    }

    const postType = post.type || "post";
    const endpoint = postType === "post" 
      ? `${this.connection.baseUrl}/wp-json/wp/v2/posts`
      : `${this.connection.baseUrl}/wp-json/wp/v2/${postType}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: this.getAuthHeader(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: post.title,
        content: post.content,
        status: post.status || "publish",
        excerpt: post.excerpt,
        slug: post.slug,
        featured_media: post.featured_media,
        categories: post.categories || [],
        tags: post.tags || [], // WordPress expects array of tag IDs
        date: post.date,
        date_gmt: post.date_gmt,
        author: post.author,
        format: post.format || "standard",
        comment_status: post.comment_status || "open",
        ping_status: post.ping_status || "open",
        sticky: post.sticky || false,
        meta: post.meta,
        type: postType !== "post" ? postType : undefined // Only include if custom type
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WordPress] ❌ Ошибка публикации: ${response.status}`, errorText);
      throw new Error(`WordPress API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // CRITICAL: Verify we got explicit confirmation from WordPress
    if (!data.id || !data.link) {
      console.error(`[WordPress] ❌ WordPress не вернул подтверждение публикации!`, data);
      throw new Error("WordPress did not confirm publication. Missing post ID or link in response.");
    }
    
    console.log(`[WordPress] ✅ WordPress подтвердил публикацию:`, {
      postId: data.id,
      link: data.link,
      status: data.status
    });
    
    return {
      id: data.id,
      link: data.link
    };
  }

  /**
   * Update an existing WordPress post
   */
  async updatePost(postId: number, post: Partial<WordPressPost>): Promise<{ id: number; link: string }> {
    if (!this.connection) {
      throw new Error("WordPress connection not initialized");
    }

    const response = await fetch(`${this.connection.baseUrl}/wp-json/wp/v2/posts/${postId}`, {
      method: "POST",
      headers: {
        Authorization: this.getAuthHeader(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(post)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WordPress API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      link: data.link
    };
  }

  /**
   * Get WordPress categories
   * Supports custom post types by detecting available taxonomies
   */
  async getCategories(postType: string = "post"): Promise<Array<{ id: number; name: string; slug: string; count: number }>> {
    if (!this.connection) {
      throw new Error("WordPress connection not initialized");
    }

    try {
      // For custom post types, we need to determine which taxonomy to use
      // First, try to get post type info to see available taxonomies
      let taxonomy = "categories"; // Default taxonomy
      let allAvailableTaxonomies: string[] = ["category"]; // Always include standard category
      
      if (postType !== "post") {
        try {
          // Try to get post type information
          const postTypeResponse = await fetch(
            `${this.connection.baseUrl}/wp-json/wp/v2/types/${postType}`,
            {
              method: "GET",
              headers: {
                Authorization: this.getAuthHeader(),
                "Content-Type": "application/json"
              }
            }
          );
          
          if (postTypeResponse.ok) {
            const postTypeData = await postTypeResponse.json();
            // Get all available taxonomies (including ACF custom taxonomies)
            const taxonomies = postTypeData.taxonomies || [];
            allAvailableTaxonomies = [...new Set([...allAvailableTaxonomies, ...taxonomies])];
            
            // Check if this post type has a custom category taxonomy
            // Common patterns: {post_type}_category, category, categories
            if (taxonomies.includes("category")) {
              taxonomy = "categories";
            } else if (taxonomies.includes(`${postType}_category`)) {
              taxonomy = `${postType}_category`;
            } else if (taxonomies.length > 0) {
              // Use the first available taxonomy that looks like a category
              const categoryTax = taxonomies.find((t: string) => 
                t.includes("category") || t.includes("cat")
              );
              if (categoryTax) {
                taxonomy = categoryTax;
              } else {
                taxonomy = taxonomies[0];
              }
            }
          }
        } catch (e) {
          // If we can't get post type info, fall back to standard categories
          console.warn(`[WordPress] Could not get post type info for ${postType}, using default categories`);
        }
      }

      // Fetch all categories with pagination
      let allCategories: any[] = [];
      let page = 1;
      const perPage = 100;
      let hasMore = true;

      while (hasMore) {
        const endpoint = taxonomy === "categories" 
          ? `${this.connection.baseUrl}/wp-json/wp/v2/categories?per_page=${perPage}&page=${page}&hide_empty=false&orderby=id&order=asc`
          : `${this.connection.baseUrl}/wp-json/wp/v2/${taxonomy}?per_page=${perPage}&page=${page}&hide_empty=false&orderby=id&order=asc`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: this.getAuthHeader(),
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          // If custom taxonomy fails, try standard categories
          if (taxonomy !== "categories" && response.status === 404) {
            console.warn(`[WordPress] Taxonomy ${taxonomy} not found, falling back to standard categories`);
            taxonomy = "categories";
            continue;
          }
          const errorText = await response.text();
          throw new Error(`WordPress API error: ${response.status} ${errorText}`);
        }

        const categories = await response.json();
        allCategories = allCategories.concat(categories);

        // Check if there are more pages
        const totalPages = parseInt(response.headers.get("x-wp-totalpages") || "1", 10);
        hasMore = page < totalPages;
        page++;
      }

      // Ensure "Uncategorized" category (ID=1) is included for standard posts
      if (postType === "post" && taxonomy === "categories") {
        const hasUncategorized = allCategories.some((cat: any) => cat.id === 1);
        if (!hasUncategorized) {
          try {
            const uncategorizedResponse = await fetch(
              `${this.connection.baseUrl}/wp-json/wp/v2/categories/1`,
              {
                method: "GET",
                headers: {
                  Authorization: this.getAuthHeader(),
                  "Content-Type": "application/json"
                }
              }
            );
            if (uncategorizedResponse.ok) {
              const uncategorized = await uncategorizedResponse.json();
              allCategories.push(uncategorized);
            }
          } catch (e) {
            // If we can't fetch it, create a default entry
            allCategories.push({
              id: 1,
              name: "Uncategorized",
              slug: "uncategorized",
              count: 0
            });
          }
        }
      }

      // Sort by ID
      allCategories.sort((a: any, b: any) => a.id - b.id);

      return allCategories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: cat.count || 0
      }));
    } catch (error: any) {
      console.error("[WordPress] Failed to fetch categories:", error);
      throw error;
    }
  }

  /**
   * Get available WordPress post types
   */
  async getPostTypes(): Promise<Array<{ name: string; label: string; public: boolean }>> {
    if (!this.connection) {
      throw new Error("WordPress connection not initialized");
    }

    try {
      const response = await fetch(`${this.connection.baseUrl}/wp-json/wp/v2/types`, {
        method: "GET",
        headers: {
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WordPress API error: ${response.status} ${errorText}`);
      }

      const types = await response.json();
      // Return all post types that have REST API endpoint (including custom ACF post types)
      // Filter out system types that shouldn't be used for content publishing
      const systemTypes = ['attachment', 'nav_menu_item', 'wp_block', 'wp_template', 'wp_template_part', 'wp_global_styles', 'wp_navigation', 'wp_font_family', 'wp_font_face'];
      
      return Object.entries(types)
        .filter(([name, type]: [string, any]) => {
          // Include if it has REST API endpoint and is not a system type
          return type.rest_base && !systemTypes.includes(name);
        })
        .map(([name, type]: [string, any]) => ({
          name,
          label: type.name || name,
          public: type.public || false
        }));
    } catch (error: any) {
      console.error("[WordPress] Failed to fetch post types:", error);
      throw error;
    }
  }

  /**
   * Get WordPress tags
   */
  async getTags(postType: string = "post"): Promise<Array<{ id: number; name: string; slug: string; count: number }>> {
    if (!this.connection) {
      throw new Error("WordPress connection not initialized");
    }

    try {
      // For custom post types, determine which tag taxonomy to use
      let taxonomy = "tags"; // Default taxonomy
      
      if (postType !== "post") {
        try {
          const postTypeResponse = await fetch(
            `${this.connection.baseUrl}/wp-json/wp/v2/types/${postType}`,
            {
              method: "GET",
              headers: {
                Authorization: this.getAuthHeader(),
                "Content-Type": "application/json"
              }
            }
          );
          
          if (postTypeResponse.ok) {
            const postTypeData = await postTypeResponse.json();
            const taxonomies = postTypeData.taxonomies || [];
            if (taxonomies.includes("post_tag")) {
              taxonomy = "tags";
            } else if (taxonomies.includes(`${postType}_tag`)) {
              taxonomy = `${postType}_tag`;
            } else if (taxonomies.length > 0) {
              // Use the first available taxonomy that looks like tags
              const tagTax = taxonomies.find((t: string) => 
                t.includes("tag") && !t.includes("category")
              );
              if (tagTax) {
                taxonomy = tagTax;
              }
            }
          }
        } catch (e) {
          console.warn(`[WordPress] Could not get post type info for ${postType}, using default tags`);
        }
      }

      // Fetch all tags with pagination
      let allTags: any[] = [];
      let page = 1;
      const perPage = 100;
      let hasMore = true;

      while (hasMore) {
        const endpoint = taxonomy === "tags" || taxonomy === "post_tag"
          ? `${this.connection.baseUrl}/wp-json/wp/v2/tags?per_page=${perPage}&page=${page}&hide_empty=false&orderby=id&order=asc`
          : `${this.connection.baseUrl}/wp-json/wp/v2/${taxonomy}?per_page=${perPage}&page=${page}&hide_empty=false&orderby=id&order=asc`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: this.getAuthHeader(),
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          // If custom taxonomy fails, try standard tags
          if (taxonomy !== "tags" && taxonomy !== "post_tag" && response.status === 404) {
            console.warn(`[WordPress] Taxonomy ${taxonomy} not found, falling back to standard tags`);
            taxonomy = "tags";
            continue;
          }
          const errorText = await response.text();
          throw new Error(`WordPress API error: ${response.status} ${errorText}`);
        }

        const tags = await response.json();
        allTags = allTags.concat(tags);

        // Check if there are more pages
        const totalPages = parseInt(response.headers.get("x-wp-totalpages") || "1", 10);
        hasMore = page < totalPages;
        page++;
      }

      // Sort by ID
      allTags.sort((a: any, b: any) => a.id - b.id);

      return allTags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        count: tag.count || 0
      }));
    } catch (error: any) {
      console.error("[WordPress] Failed to fetch tags:", error);
      throw error;
    }
  }

  /**
   * Upload media to WordPress
   * Note: Requires FormData polyfill for Node.js (e.g., form-data package)
   */
  async uploadMedia(file: Buffer, filename: string, mimeType: string): Promise<number> {
    if (!this.connection) {
      throw new Error("WordPress connection not initialized");
    }

    // For Node.js, we need to use form-data package
    // This is a placeholder - implement when form-data is available
    throw new Error("Media upload not yet implemented - requires form-data package");
  }
}

export const wordpressClient = new WordPressClient();

// Auto-initialize if credentials are available
if (config.SEO_AGENT.wordpressBaseUrl && config.SEO_AGENT.wordpressUsername && config.SEO_AGENT.wordpressAppPassword) {
  wordpressClient.initialize();
}

