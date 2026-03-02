/**
 * Compress an image file using Canvas API.
 * Returns a JPEG File with reduced dimensions and quality.
 */
export function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.7
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) {
            const compressedName = file.name.replace(/\.\w+$/, '.jpg');
            resolve(new File([blob], compressedName, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Compress an image file and return as Blob (for diário uploads).
 */
export async function compressImageToBlob(
  file: File,
  maxWidth = 1200,
  quality = 0.7
): Promise<Blob> {
  const compressed = await compressImage(file, maxWidth, quality);
  return compressed;
}
