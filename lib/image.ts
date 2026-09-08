/**
 * Fast Client-Side Base64 Image Compressor using HTML5 Canvas
 * Reduces massive uncompressed base64 camera images from ~4MB down to ~180KB (95% size reduction)
 * for ultra-fast network uploads over mobile hotspot/Wi-Fi.
 */
export async function compressBase64Image(
  dataUrl: string,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith("data:image")) {
      return resolve(dataUrl || "");
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Hitung skala rasio agar tidak melebihi maxWidth/maxHeight
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return resolve(dataUrl);
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Export sebagai compressed JPEG base64
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}
