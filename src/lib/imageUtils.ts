/**
 * Resizes an image to fit within a maximum file size (approximate).
 * Uses canvas to scale down the image and adjust quality.
 */
export async function resizeImage(file: File | Blob, maxSizeBytes: number = 600000): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // If it's not an image, we can't resize it this way
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Initial scale down if very large
        const maxDimension = 1200;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try to find the right quality to fit the size
        let quality = 0.9;
        const step = 0.1;

        const attemptResize = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }

              // Base64 overhead is ~33%, so we need the blob to be even smaller
              // than the maxSizeBytes if we were converting to base64, 
              // but here we just check the blob size.
              if (blob.size <= maxSizeBytes || q <= 0.2) {
                resolve(blob);
              } else {
                attemptResize(q - step);
              }
            },
            'image/jpeg',
            q
          );
        };

        attemptResize(quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
