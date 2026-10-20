import { adminApi, type MediaAsset } from "@/lib/admin-api";

/** Upload a single image to the media library; returns the stored asset. */
export async function uploadImage(file: File): Promise<MediaAsset> {
  const fd = new FormData();
  fd.append("file", file);
  return adminApi.upload<MediaAsset>("/api/media/", fd);
}
