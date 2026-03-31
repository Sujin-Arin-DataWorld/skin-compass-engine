/**
 * Compresses a base64 image (specifically optimized for localStorage constraints)
 * by resizing the maximum width and adjusting JPEG quality.
 * @param base64Str Raw base64 string (with or without data:image/jpeg;base64, prefix)
 * @param maxWidth Target maximum width (px)
 * @param quality JPEG quality (0.0 to 1.0)
 * @returns Compressed base64 string (without the data URL prefix)
 */
export async function compressImageBase64(base64Str: string, maxWidth = 800, quality = 0.6): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const isDataURL = base64Str.startsWith('data:');
    img.src = isDataURL ? base64Str : `data:image/jpeg;base64,${base64Str}`;
    
    img.onload = () => {
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = Math.round((maxWidth / width) * height);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback: unable to get context
        return resolve(isDataURL ? base64Str.split(',')[1] : base64Str);
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed.split(',')[1]); // return raw base64
    };

    img.onerror = () => {
      console.warn('[ImageCompression] Failed to load image for compression');
      resolve(isDataURL ? base64Str.split(',')[1] : base64Str);
    };
  });
}
