/**
 * Client-Side GIF89a Binary Encoder for Photobooth Raw Photos
 * Encodes raw photo Data URLs into a looping animated .gif file.
 */

// Simple GIF89a encoder helper
class OmggifEncoder {
  private width: number;
  private height: number;
  private frames: { data: Uint8ClampedArray; delay: number }[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  addFrame(imageData: ImageData, delayMs = 400) {
    this.frames.push({
      data: imageData.data,
      delay: Math.round(delayMs / 10),
    });
  }

  encodeToBase64(): string {
    const w = this.width;
    const h = this.height;
    const bytes: number[] = [];

    // Header GIF89a
    const header = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]; // GIF89a
    bytes.push(...header);

    // Logical Screen Descriptor
    bytes.push(w & 0xff, (w >> 8) & 0xff);
    bytes.push(h & 0xff, (h >> 8) & 0xff);
    bytes.push(0xf7, 0x00, 0x00); // GCT Flag (256 colors), color resolution 8, no aspect ratio

    // Global Color Table (Simple 256 Grayscale/RGB Palette)
    const palette: number[] = [];
    for (let i = 0; i < 256; i++) {
      palette.push(i, i, i);
    }
    bytes.push(...palette);

    // Application Extension for Netscape Looping
    bytes.push(0x21, 0xff, 0x0b);
    const netscape = [0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30];
    bytes.push(...netscape);
    bytes.push(0x03, 0x01, 0x00, 0x00, 0x00); // Loop count 0 (infinite)

    // Encode Frames
    this.frames.forEach((frame) => {
      // Graphic Control Extension
      bytes.push(0x21, 0xf9, 0x04, 0x04, frame.delay & 0xff, (frame.delay >> 8) & 0xff, 0x00, 0x00);

      // Image Descriptor
      bytes.push(0x2c, 0x00, 0x00, 0x00, 0x00, w & 0xff, (w >> 8) & 0xff, h & 0xff, (h >> 8) & 0xff, 0x00);

      // Simple LZW Minimum Code Size
      const minCodeSize = 8;
      bytes.push(minCodeSize);

      // Quantize RGB to Palette index
      const indexedPixels: number[] = [];
      for (let i = 0; i < frame.data.length; i += 4) {
        const r = frame.data[i];
        const g = frame.data[i + 1];
        const b = frame.data[i + 2];
        const index = Math.round((r + g + b) / 3);
        indexedPixels.push(index);
      }

      // LZW Compression
      const compressed = simpleLZWCompress(indexedPixels, minCodeSize);
      let offset = 0;
      while (offset < compressed.length) {
        const chunkSize = Math.min(255, compressed.length - offset);
        bytes.push(chunkSize);
        for (let i = 0; i < chunkSize; i++) {
          bytes.push(compressed[offset + i]);
        }
        offset += chunkSize;
      }
      bytes.push(0x00); // Block Terminator
    });

    bytes.push(0x3b); // GIF Trailer

    const binaryStr = String.fromCharCode.apply(null, bytes);
    return "data:image/gif;base64," + btoa(binaryStr);
  }
}

function simpleLZWCompress(pixels: number[], minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize;
  const eofCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eofCode + 1;

  const dictionary: { [key: string]: number } = {};
  for (let i = 0; i < clearCode; i++) {
    dictionary[String.fromCharCode(i)] = i;
  }

  const outputCodes: number[] = [clearCode];
  let currentMatch = "";

  for (let i = 0; i < pixels.length; i++) {
    const char = String.fromCharCode(pixels[i]);
    const combined = currentMatch + char;

    if (dictionary[combined] !== undefined) {
      currentMatch = combined;
    } else {
      outputCodes.push(dictionary[currentMatch]);
      if (nextCode < 4096) {
        dictionary[combined] = nextCode++;
      } else {
        outputCodes.push(clearCode);
        nextCode = eofCode + 1;
      }
      currentMatch = char;
    }
  }

  if (currentMatch !== "") {
    outputCodes.push(dictionary[currentMatch]);
  }
  outputCodes.push(eofCode);

  // Pack codes into bytes
  const bytes: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;

  for (const code of outputCodes) {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      bytes.push(bitBuffer & 0xff);
      bitBuffer >>= 8;
      bitCount -= 8;
    }
  }

  if (bitCount > 0) {
    bytes.push(bitBuffer & 0xff);
  }

  return bytes;
}

export async function createAnimatedGifFromPhotos(
  photoUrls: string[],
  width = 360,
  height = 270,
  delayMs = 400
): Promise<string> {
  return new Promise((resolve) => {
    try {
      if (!photoUrls || photoUrls.length === 0) {
        return resolve("");
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) return resolve(photoUrls[0]);

      const images: HTMLImageElement[] = [];
      let loadedCount = 0;

      const buildGif = () => {
        try {
          const encoder = new OmggifEncoder(width, height);

          images.forEach((img) => {
            if (!img) return;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const imgData = ctx.getImageData(0, 0, width, height);
            encoder.addFrame(imgData, delayMs);
          });

          const gifBase64 = encoder.encodeToBase64();
          resolve(gifBase64);
        } catch (e) {
          console.error("Gagal encode binary GIF:", e);
          resolve(photoUrls[0]);
        }
      };

      photoUrls.forEach((url, i) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          images[i] = img;
          loadedCount++;
          if (loadedCount === photoUrls.length) buildGif();
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === photoUrls.length) buildGif();
        };
        img.src = url;
      });
    } catch (err) {
      console.error("Error createAnimatedGifFromPhotos:", err);
      resolve(photoUrls[0] || "");
    }
  });
}
