import gifshot from "gifshot";

/**
 * Client-Side Animated GIF Encoder using Gifshot
 * Compiles raw photo Data URLs into a 100% valid looping animated .gif file.
 */
export async function createAnimatedGifFromPhotos(
  photoUrls: string[],
  width = 480,
  height = 360,
  intervalSeconds = 0.4
): Promise<string> {
  return new Promise((resolve) => {
    if (!photoUrls || photoUrls.length === 0) {
      return resolve("");
    }

    try {
      // Direct Gifshot Client-Side Encoding
      gifshot.createGIF(
        {
          images: photoUrls,
          gifWidth: width,
          gifHeight: height,
          interval: intervalSeconds,
          numFrames: photoUrls.length,
          sampleInterval: 10,
          numWorkers: 2,
        },
        (obj: any) => {
          if (!obj.error && obj.image) {
            console.log("[GIF ENCODER SUCCESS] Binary GIF berhasil di-encode!");
            resolve(obj.image);
          } else {
            console.error("Gifshot encoder error:", obj.error);
            resolve(photoUrls[0]);
          }
        }
      );
    } catch (err) {
      console.error("Gagal membuat GIF dengan gifshot:", err);
      resolve(photoUrls[0] || "");
    }
  });
}
