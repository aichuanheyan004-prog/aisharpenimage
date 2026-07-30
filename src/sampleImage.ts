export function createSampleFile(): File {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");

  const gradient = ctx.createLinearGradient(0, 0, 960, 640);
  gradient.addColorStop(0, "#f7f3ed");
  gradient.addColorStop(0.45, "#d7e6e6");
  gradient.addColorStop(1, "#f4c8ad");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 960, 640);

  ctx.fillStyle = "#24313d";
  ctx.font = "700 72px Arial";
  ctx.fillText("Studio print", 90, 155);
  ctx.font = "32px Arial";
  ctx.fillText("fine edges, fabric texture, product label", 92, 210);

  for (let i = 0; i < 9; i += 1) {
    ctx.fillStyle = i % 2 ? "#ffffff" : "#111827";
    ctx.fillRect(92 + i * 78, 285, 48, 210);
  }

  ctx.strokeStyle = "#1f6f78";
  ctx.lineWidth = 6;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.arc(650, 365, 32 + i * 18, 0.1, 4.7);
    ctx.stroke();
  }

  ctx.filter = "blur(2px)";
  const blurred = document.createElement("canvas");
  blurred.width = 960;
  blurred.height = 640;
  const blurredCtx = blurred.getContext("2d");
  if (!blurredCtx) throw new Error("Canvas is unavailable.");
  blurredCtx.drawImage(canvas, 0, 0);
  ctx.clearRect(0, 0, 960, 640);
  ctx.drawImage(blurred, 0, 0);
  ctx.filter = "none";

  const dataUrl = canvas.toDataURL("image/png");
  const bytes = atob(dataUrl.split(",")[1]);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) array[i] = bytes.charCodeAt(i);
  return new File([array], "sample-soft-product-photo.png", { type: "image/png" });
}

