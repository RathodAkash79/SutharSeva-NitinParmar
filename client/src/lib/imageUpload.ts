export interface CompressOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  mimeType: "image/webp" | "image/jpeg";
}

const defaultOptions: CompressOptions = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.72,
  mimeType: "image/webp",
};

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    img.src = url;
  });

export async function compressImageFile(
  file: File,
  options: Partial<CompressOptions> = {}
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const config = { ...defaultOptions, ...options };
  const img = await loadImage(file);
  const scale = Math.min(
    1,
    config.maxWidth / img.width,
    config.maxHeight / img.height
  );

  const targetWidth = Math.max(1, Math.round(img.width * scale));
  const targetHeight = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob(
      (result) => resolve(result || file),
      config.mimeType,
      config.quality
    )
  );

  const extension = config.mimeType === "image/webp" ? "webp" : "jpg";
  const name = file.name.replace(/\.[^/.]+$/, `.${extension}`);
  return new File([blob], name, { type: config.mimeType });
}
