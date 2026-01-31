import * as ImageManipulator from "expo-image-manipulator";

/**
 * Compress and resize an image to reduce file size
 * @param uri - The URI of the image to compress
 * @param maxWidth - Maximum width in pixels (default: 1920)
 * @param maxHeight - Maximum height in pixels (default: 1920)
 * @param quality - Compression quality 0-1 (default: 0.7)
 * @returns The compressed image URI
 */
export async function compressImage(
  uri: string,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.6
): Promise<string> {
  try {
    console.log("🖼️ Starting image compression for:", uri);
    
    // First, get the image info to check dimensions
    const imageInfo = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 1,
    });

    console.log("📐 Original image dimensions:", imageInfo.width, "x", imageInfo.height);

    // Calculate new dimensions while maintaining aspect ratio
    let width = imageInfo.width;
    let height = imageInfo.height;
    let needsResize = false;

    // Only resize if image is larger than max dimensions
    if (width > maxWidth || height > maxHeight) {
      needsResize = true;
      const aspectRatio = width / height;
      if (width > height) {
        width = Math.min(width, maxWidth);
        height = Math.round(width / aspectRatio);
      } else {
        height = Math.min(height, maxHeight);
        width = Math.round(height * aspectRatio);
      }
      console.log("📐 Resizing to:", width, "x", height);
    }

    // Always compress, even if we don't resize
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      needsResize ? [{resize: {width, height}}] : [],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG, // Use JPEG for better compression
      }
    );

    console.log("✅ Image compressed successfully:", manipulatedImage.uri);
    return manipulatedImage.uri;
  } catch (error) {
    console.error("❌ Error compressing image:", error);
    // Return original URI if compression fails
    return uri;
  }
}

/**
 * Compress multiple images
 */
export async function compressImages(uris: string[]): Promise<string[]> {
  return Promise.all(uris.map((uri) => compressImage(uri)));
}
