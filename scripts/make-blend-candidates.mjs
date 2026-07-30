import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [inputPath = "tmp/quality/quality-input-600x400.jpg", aiPath = "tmp/quality/baseline-x4-to-x2.webp"] = process.argv.slice(2);
const outputDir = path.resolve("tmp/quality");
await mkdir(outputDir, { recursive: true });

const aiMetadata = await sharp(aiPath).metadata();
if (!aiMetadata.width || !aiMetadata.height) throw new Error("The AI candidate has no usable dimensions.");
const faithfulBase = await sharp(inputPath)
  .rotate()
  .resize(aiMetadata.width, aiMetadata.height, { kernel: sharp.kernel.lanczos3 })
  .toBuffer();

for (const aiStrength of [0.65, 0.75, 0.85]) {
  const outputPath = path.join(outputDir, `blend-${Math.round(aiStrength * 100)}.webp`);
  const aiOverlay = await sharp(aiPath).ensureAlpha(aiStrength).png().toBuffer();
  await sharp(faithfulBase)
    .composite([{ input: aiOverlay, blend: "over" }])
    .webp({ quality: 88, effort: 5, smartSubsample: true })
    .toFile(outputPath);
  console.log(outputPath);
}
