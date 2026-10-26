import { readLocalPhoto } from "@/lib/storage";

// Serves photos from local .data storage. With Supabase configured, photos are
// served straight from Supabase Storage and this route is unused.
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const photo = await readLocalPhoto(name);
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(photo.bytes), {
    headers: {
      "Content-Type": photo.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
