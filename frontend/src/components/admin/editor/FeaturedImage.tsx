"use client";

import { useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const ASPECT = 16 / 9;

export interface FeaturedValue {
  url: string | null; // existing/preview url
  blob: Blob | null; // pending cropped upload
  alt: string;
  remove: boolean; // mark existing image for removal
}

export function FeaturedImage({
  value,
  onChange,
}: {
  value: FeaturedValue;
  onChange: (v: FeaturedValue) => void;
}) {
  const [editingSrc, setEditingSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [pixelCrop, setPixelCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const preview = value.blob ? URL.createObjectURL(value.blob) : value.remove ? null : value.url;

  function pickFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setEditingSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  function toPixelCrop(c: Crop, width: number, height: number): PixelCrop {
    return {
      unit: "px",
      x: (c.x / 100) * width,
      y: (c.y / 100) * height,
      width: (c.width / 100) * width,
      height: (c.height / 100) * height,
    };
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const c = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, ASPECT, width, height),
      width,
      height,
    );
    setCrop(c);
    // Seed a pixel crop immediately so "اقتصاص" works even if the user
    // never drags the selection (otherwise applyCrop would bail out).
    setPixelCrop(toPixelCrop(c, width, height));
  }

  async function applyCrop() {
    const image = imgRef.current;
    if (!image) return;
    const pc =
      pixelCrop ?? (crop ? toPixelCrop(crop, image.width, image.height) : undefined);
    if (!pc || !pc.width || !pc.height) return;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(pc.width * scaleX);
    canvas.height = Math.round(pc.height * scaleY);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      image,
      pc.x * scaleX,
      pc.y * scaleY,
      pc.width * scaleX,
      pc.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.9));
    if (blob) onChange({ ...value, blob, remove: false });
    setEditingSrc(null);
  }

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="aspect-video w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange({ url: null, blob: null, alt: "", remove: true })}
            className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-red-600 text-white"
            title="إزالة"
          >
            ×
          </button>
        </div>
      ) : (
        <label className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-8 text-center text-sm text-slate-500 hover:border-brand-400">
          <span>اختر صورة بارزة</span>
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
          />
        </label>
      )}

      {preview && (
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">نص بديل (Alt) للصورة</span>
          <input
            value={value.alt}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            className="input"
            placeholder="وصف الصورة لمحركات البحث"
          />
        </label>
      )}

      {preview && (
        <label className="btn-outline w-full cursor-pointer py-1.5 text-xs">
          استبدال / اقتصاص
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
          />
        </label>
      )}

      {editingSrc && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" dir="ltr">
          <div className="card max-h-[90vh] w-full max-w-lg space-y-4 overflow-auto p-5">
            <ReactCrop
              crop={crop}
              onChange={(_, percent) => setCrop(percent)}
              onComplete={(c) => setPixelCrop(c)}
              aspect={ASPECT}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imgRef} src={editingSrc} alt="" onLoad={onImageLoad} />
            </ReactCrop>
            <div className="flex justify-end gap-2" dir="rtl">
              <button onClick={() => setEditingSrc(null)} className="btn-ghost px-4 py-2 text-sm">
                إلغاء
              </button>
              <button onClick={applyCrop} className="btn-primary px-4 py-2 text-sm">
                اقتصاص
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
