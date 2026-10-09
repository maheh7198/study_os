import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const source = await readFile("src/assets/logo.png");
const sourceUrl = `data:image/png;base64,${source.toString("base64")}`;
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.setContent(`<img id="source" src="${sourceUrl}" alt="">`);
  const crop = await page.evaluate(async () => {
    const image = document.querySelector("#source");
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width; let top = canvas.height; let right = -1; let bottom = -1;
    // The original icon is the leftmost mark; exclude the wordmark to its right.
    for (let y = 0; y < canvas.height; y += 1) for (let x = 0; x < Math.min(330, canvas.width); x += 1) {
      if (pixels[(y * canvas.width + x) * 4 + 3] > 0) {
        left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
    if (right < left || bottom < top) throw new Error("Could not find the logo icon pixels.");
    return { left, top, width: right - left + 1, height: bottom - top + 1 };
  });

  const images = new Map();
  for (const size of [16, 32, 48, 64, 512]) {
    const dataUrl = await page.evaluate(async ({ cropBounds, size: canvasSize }) => {
      const image = document.querySelector("#source");
      const canvas = document.createElement("canvas");
      canvas.width = canvasSize; canvas.height = canvasSize;
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvasSize, canvasSize);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      const padding = canvasSize === 512 ? 32 : Math.max(1, Math.round(canvasSize * 0.0625));
      const scale = Math.min((canvasSize - padding * 2) / cropBounds.width, (canvasSize - padding * 2) / cropBounds.height);
      const width = cropBounds.width * scale; const height = cropBounds.height * scale;
      const x = (canvasSize - width) / 2; const y = (canvasSize - height) / 2;
      context.drawImage(image, cropBounds.left, cropBounds.top, cropBounds.width, cropBounds.height, x, y, width, height);
      return canvas.toDataURL("image/png");
    }, { cropBounds: crop, size });
    images.set(size, Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64"));
  }

  const pngUrl = `data:image/png;base64,${images.get(512).toString("base64")}`;
  const cornerAlpha = await page.evaluate(async (url) => {
    const image = new Image(); image.src = url; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d"); context.drawImage(image, 0, 0);
    return [[0, 0], [511, 0], [0, 511], [511, 511]].map(([x, y]) => context.getImageData(x, y, 1, 1).data[3]);
  }, pngUrl);
  if (cornerAlpha.some((alpha) => alpha !== 0)) throw new Error("The favicon PNG background is not fully transparent at its corners.");

  await writeFile("public/favicon.png", images.get(512));
  const entries = [16, 32, 48, 64].map((size) => images.get(size));
  const directorySize = 6 + entries.length * 16;
  const header = Buffer.alloc(directorySize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = directorySize;
  entries.forEach((png, index) => {
    const entryOffset = 6 + index * 16;
    header[entryOffset] = [16, 32, 48, 64][index];
    header[entryOffset + 1] = [16, 32, 48, 64][index];
    header[entryOffset + 2] = 0;
    header[entryOffset + 3] = 0;
    header.writeUInt16LE(1, entryOffset + 4);
    header.writeUInt16LE(32, entryOffset + 6);
    header.writeUInt32LE(png.length, entryOffset + 8);
    header.writeUInt32LE(offset, entryOffset + 12);
    offset += png.length;
  });
  await writeFile("public/favicon.ico", Buffer.concat([header, ...entries]));
  console.log(`Icon crop: ${crop.width}x${crop.height} at (${crop.left}, ${crop.top}); transparent canvas corners verified`);
  console.log("Wrote transparent public/favicon.png (512x512) and public/favicon.ico (16, 32, 48, 64px). Source image was not modified.");
} finally {
  await browser.close();
}
