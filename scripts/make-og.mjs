import sharp from "sharp";

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f6f7f4"/>
  <rect x="70" y="64" width="1060" height="502" rx="18" fill="#ffffff" stroke="#dce3df"/>
  <text x="112" y="132" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#b84e34">PRIVATE BROWSER TOOL</text>
  <text x="112" y="206" font-family="Arial, sans-serif" font-size="68" font-weight="800" fill="#17212b">AI Sharpen Image</text>
  <text x="112" y="258" font-family="Arial, sans-serif" font-size="30" fill="#46535f">Sharpen soft images locally. Compare, adjust, download.</text>
  <rect x="112" y="315" width="520" height="190" rx="14" fill="#eef1ee" stroke="#cfd8d3"/>
  <rect x="148" y="350" width="92" height="120" fill="#111827"/>
  <rect x="248" y="350" width="92" height="120" fill="#ffffff"/>
  <rect x="348" y="350" width="92" height="120" fill="#111827"/>
  <rect x="448" y="350" width="92" height="120" fill="#ffffff"/>
  <line x1="632" y1="315" x2="632" y2="505" stroke="#e87942" stroke-width="5"/>
  <rect x="632" y="315" width="456" height="190" rx="14" fill="#ecf7f4" stroke="#9fcac4"/>
  <rect x="674" y="350" width="92" height="120" fill="#050b11"/>
  <rect x="774" y="350" width="92" height="120" fill="#ffffff"/>
  <rect x="874" y="350" width="92" height="120" fill="#050b11"/>
  <rect x="974" y="350" width="60" height="120" fill="#ffffff"/>
  <path d="M692 468 C770 388 820 458 890 372 C944 306 990 382 1034 338" fill="none" stroke="#205b61" stroke-width="8" stroke-linecap="round"/>
  <rect x="112" y="532" width="252" height="48" rx="24" fill="#205b61"/>
  <text x="143" y="564" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff">No upload for MVP</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("public/og-image.png");
console.log("Created public/og-image.png");
