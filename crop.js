import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processImage() {
  const size = 706; // 1024 / 1.45
  const half = Math.floor(size / 2);
  const left = Math.floor((1024 - size) / 2);
  const top = Math.floor((1024 - size) / 2) - 4;

  const circleSvg = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${half}" cy="${half}" r="${half}" /></svg>`,
  );

  try {
    console.log("Processing logo...");
    await sharp(path.join(__dirname, "public/logo.jpg"))
      .extract({ left, top, width: size, height: size })
      .composite([
        {
          input: circleSvg,
          blend: "dest-in",
        },
      ])
      .png()
      .toFile(path.join(__dirname, "public/logo.png"));

    console.log("Created public/logo.png successfully!");
  } catch (err) {
    console.error("Error:", err);
  }
}

processImage();
