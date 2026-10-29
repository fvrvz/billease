/**
 * Client-side Image Compression Utility
 * - Maintains exact original aspect ratio (zero cropping, zero stretching, zero blurring).
 * - Scales down to maximum bounding box dimensions with high-quality smoothing.
 * - Returns optimized base64 Data URL.
 */

export async function compressStoreLogo(
  file: File,
  maxDimension = 320,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (PNG, JPG, WebP, SVG).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Unable to decode image. Please check the file.'));
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          reject(new Error('Image has invalid dimensions.'));
          return;
        }

        // Proportional scale factor: never stretch, never crop
        const scale = Math.min(maxDimension / width, maxDimension / height, 1);
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available.'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Convert to WebP or PNG/JPEG
        let dataUrl: string;
        try {
          if (file.type === 'image/png') {
            dataUrl = canvas.toDataURL('image/png');
          } else {
            dataUrl = canvas.toDataURL('image/webp', quality);
            if (!dataUrl.startsWith('data:image/webp')) {
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
