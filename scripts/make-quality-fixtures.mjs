import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outputDir = path.resolve("tmp/quality");
await mkdir(outputDir, { recursive: true });

const width = 1200;
const height = 800;
const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f7f5ef"/>
      <stop offset="0.52" stop-color="#dbe9e7"/>
      <stop offset="1" stop-color="#edc9b0"/>
    </linearGradient>
    <pattern id="fabric" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M0 2H12M0 8H12M2 0V12M8 0V12" stroke="#1f6f78" stroke-opacity=".42" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="800" fill="url(#paper)"/>
  <rect x="70" y="65" width="1060" height="670" rx="12" fill="#fff" fill-opacity=".68" stroke="#17212b" stroke-width="2"/>
  <text x="110" y="165" font-family="Arial, sans-serif" font-size="74" font-weight="700" fill="#17212b">QUALITY TEST 2X</text>
  <text x="114" y="220" font-family="Arial, sans-serif" font-size="28" fill="#34495a">Fine type / diagonal lines / texture / gradients / compression</text>
  <g transform="translate(110 285)">
    <rect width="430" height="315" fill="url(#fabric)" stroke="#17212b" stroke-width="2"/>
    <circle cx="215" cy="157" r="118" fill="#f4f0e8" stroke="#17212b" stroke-width="5"/>
    <circle cx="215" cy="157" r="84" fill="none" stroke="#c64b2f" stroke-width="3"/>
    <circle cx="215" cy="157" r="49" fill="none" stroke="#1f6f78" stroke-width="2"/>
    <path d="M96 269L333 45M80 240L310 22M123 292L356 70" stroke="#17212b" stroke-width="2"/>
    <text x="145" y="165" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#17212b">LABEL 042</text>
  </g>
  <g transform="translate(610 285)">
    <rect width="480" height="315" fill="#f8faf9" stroke="#17212b" stroke-width="2"/>
    <g stroke="#17212b">
      <path d="M28 34L452 282M28 66L452 314M28 2L452 250" stroke-width="1"/>
      <path d="M28 282L452 34M28 314L452 66M28 250L452 2" stroke-width="2"/>
    </g>
    <g transform="translate(34 112)">
      <rect width="50" height="142" fill="#111827"/>
      <rect x="50" width="50" height="142" fill="#fff"/>
      <rect x="100" width="50" height="142" fill="#111827"/>
      <rect x="150" width="50" height="142" fill="#fff"/>
      <rect x="200" width="50" height="142" fill="#111827"/>
      <rect x="250" width="50" height="142" fill="#fff"/>
      <rect x="300" width="50" height="142" fill="#111827"/>
      <rect x="350" width="50" height="142" fill="#fff"/>
    </g>
    <text x="34" y="72" font-family="Arial, sans-serif" font-size="18" fill="#17212b">Small text: cotton, paper, metal, glass</text>
  </g>
  <g transform="translate(110 645)">
    <rect width="980" height="44" fill="#17212b"/>
    <text x="18" y="30" font-family="Arial, sans-serif" font-size="20" fill="#fff">Check halos along white/black edges and color shifts in teal/orange areas.</text>
  </g>
</svg>`;

const referencePath = path.join(outputDir, "quality-reference-1200x800.png");
const inputPath = path.join(outputDir, "quality-input-600x400.jpg");

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(referencePath);
await sharp(referencePath)
  .resize(600, 400, { kernel: sharp.kernel.lanczos3 })
  .blur(0.45)
  .jpeg({ quality: 66, chromaSubsampling: "4:2:0", mozjpeg: true })
  .toFile(inputPath);

console.log(JSON.stringify({ referencePath, inputPath }, null, 2));
