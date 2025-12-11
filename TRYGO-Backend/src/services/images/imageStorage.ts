import fs from "fs/promises";
import path from "path";
import { config } from "../../constants/config/env";

export interface SaveImageOptions {
  contentItemId: string;
  variant: "hero" | "inline";
  imageData: Buffer;
  format?: string;
}

export interface SavedImageInfo {
  filePath: string;
  publicUrl: string;
  filename: string;
}

/**
 * Get storage directory for a specific content item
 */
function getContentItemStorageDir(contentItemId: string): string {
  return path.join(config.IMAGE_CONFIG.storageRoot, "draft-images", contentItemId);
}

/**
 * Generate filename with timestamp
 */
function generateFilename(variant: "hero" | "inline", format: string = "png"): string {
  const timestamp = Date.now();
  return `${variant}-${timestamp}.${format}`;
}

/**
 * Ensure storage directory exists
 */
async function ensureStorageDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Save image to storage and return public URL
 */
export async function saveImage(options: SaveImageOptions): Promise<SavedImageInfo> {
  const { contentItemId, variant, imageData, format = "png" } = options;

  const storageDir = getContentItemStorageDir(contentItemId);
  await ensureStorageDir(storageDir);

  const filename = generateFilename(variant, format);
  const filePath = path.join(storageDir, filename);

  await fs.writeFile(filePath, imageData);

  const publicUrl = `${config.IMAGE_CONFIG.publicUrl}/media/draft-images/${contentItemId}/${filename}`;

  return {
    filePath,
    publicUrl,
    filename
  };
}

/**
 * Delete image file from storage
 */
export async function deleteImage(contentItemId: string, filename: string): Promise<void> {
  const filePath = path.join(getContentItemStorageDir(contentItemId), filename);
  
  try {
    await fs.unlink(filePath);
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    // File doesn't exist - that's okay for deletion
  }
}

/**
 * Check if image file exists
 */
export async function imageExists(contentItemId: string, filename: string): Promise<boolean> {
  const filePath = path.join(getContentItemStorageDir(contentItemId), filename);
  
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
