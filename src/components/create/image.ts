// Shrinks photos in the browser before upload: phone photos are often 5-10MB,
// and a card only needs ~1600px. This also strips EXIF data (including GPS location).
const MAX_SIDE = 1600;

export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("We couldn't read that photo. Try a JPG or PNG.");
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process that photo."))), "image/jpeg", 0.85),
  );
}

export async function uploadPhoto(file: File): Promise<string> {
  const blob = await compressImage(file);
  const form = new FormData();
  form.append("photo", blob, "photo.jpg");
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Upload failed. Please try again.");
  return json.url as string;
}
