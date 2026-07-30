import path from "node:path";
import { stat } from "node:fs/promises";
import sharp from "sharp";

const args = process.argv.slice(2);
const referenceFlag = args.indexOf("--reference");
const referencePath = referenceFlag >= 0 ? args[referenceFlag + 1] : "tmp/quality/quality-reference-1200x800.png";
const candidates = args
  .filter((value, index) => referenceFlag < 0 || (index !== referenceFlag && index !== referenceFlag + 1))
  .map((value) => {
    const separator = value.indexOf("=");
    if (separator < 1) throw new Error(`Use name=path for candidate: ${value}`);
    return { name: value.slice(0, separator), file: value.slice(separator + 1) };
  });

if (candidates.length === 0) {
  throw new Error("Provide at least one candidate as name=path.");
}

async function readRgb(file) {
  const image = sharp(file).rotate().removeAlpha().toColourspace("srgb");
  const metadata = await image.metadata();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, source: metadata };
}

function luma(data, pixel) {
  const offset = pixel * 3;
  return 0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2];
}

function score(reference, candidate) {
  if (reference.width !== candidate.width || reference.height !== candidate.height) {
    throw new Error(`Dimension mismatch: expected ${reference.width}x${reference.height}, got ${candidate.width}x${candidate.height}`);
  }

  let absoluteError = 0;
  let squaredError = 0;
  let refMean = 0;
  let candidateMean = 0;
  const pixels = reference.width * reference.height;

  for (let pixel = 0; pixel < pixels; pixel += 1) {
    const refY = luma(reference.data, pixel);
    const candidateY = luma(candidate.data, pixel);
    const delta = refY - candidateY;
    absoluteError += Math.abs(delta);
    squaredError += delta * delta;
    refMean += refY;
    candidateMean += candidateY;
  }

  refMean /= pixels;
  candidateMean /= pixels;
  let refVariance = 0;
  let candidateVariance = 0;
  let covariance = 0;
  let edgeAbsoluteError = 0;
  let candidateEdgeEnergy = 0;
  let edgePixels = 0;

  const gradient = (image, x, y) => {
    const index = (xx, yy) => yy * image.width + xx;
    const gx = -luma(image.data, index(x - 1, y - 1)) + luma(image.data, index(x + 1, y - 1))
      - 2 * luma(image.data, index(x - 1, y)) + 2 * luma(image.data, index(x + 1, y))
      - luma(image.data, index(x - 1, y + 1)) + luma(image.data, index(x + 1, y + 1));
    const gy = -luma(image.data, index(x - 1, y - 1)) - 2 * luma(image.data, index(x, y - 1)) - luma(image.data, index(x + 1, y - 1))
      + luma(image.data, index(x - 1, y + 1)) + 2 * luma(image.data, index(x, y + 1)) + luma(image.data, index(x + 1, y + 1));
    return Math.hypot(gx, gy);
  };

  for (let y = 1; y < reference.height - 1; y += 1) {
    for (let x = 1; x < reference.width - 1; x += 1) {
      const pixel = y * reference.width + x;
      const refY = luma(reference.data, pixel);
      const candidateY = luma(candidate.data, pixel);
      refVariance += (refY - refMean) ** 2;
      candidateVariance += (candidateY - candidateMean) ** 2;
      covariance += (refY - refMean) * (candidateY - candidateMean);
      const refGradient = gradient(reference, x, y);
      const candidateGradient = gradient(candidate, x, y);
      if (refGradient > 24) {
        edgeAbsoluteError += Math.abs(refGradient - candidateGradient);
        candidateEdgeEnergy += candidateGradient;
        edgePixels += 1;
      }
    }
  }

  const variancePixels = (reference.width - 2) * (reference.height - 2) - 1;
  refVariance /= variancePixels;
  candidateVariance /= variancePixels;
  covariance /= variancePixels;
  const c1 = (0.01 * 255) ** 2;
  const c2 = (0.03 * 255) ** 2;
  const ssim = ((2 * refMean * candidateMean + c1) * (2 * covariance + c2))
    / ((refMean ** 2 + candidateMean ** 2 + c1) * (refVariance + candidateVariance + c2));
  const mse = squaredError / pixels;

  return {
    mae: absoluteError / pixels,
    psnr: mse === 0 ? null : 10 * Math.log10((255 * 255) / mse),
    ssim,
    edgeMae: edgeAbsoluteError / edgePixels,
    edgeEnergy: candidateEdgeEnergy / edgePixels
  };
}

const reference = await readRgb(referencePath);
const results = [];
for (const candidate of candidates) {
  const image = await readRgb(candidate.file);
  const fileInfo = await stat(candidate.file);
  results.push({
    name: candidate.name,
    file: path.resolve(candidate.file),
    bytes: fileInfo.size,
    width: image.width,
    height: image.height,
    ...score(reference, image)
  });
}

console.log(JSON.stringify({ reference: path.resolve(referencePath), results }, null, 2));
