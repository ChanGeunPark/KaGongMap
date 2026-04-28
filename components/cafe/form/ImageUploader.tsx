"use client";

import { useRef, useState } from "react";
import { TbPhoto, TbX } from "react-icons/tb";
import { cls } from "@/lib/utils";

const MAX_IMAGES = 5;

interface ImageUploaderProps {
  value: File[];
  onChange: (files: File[]) => void;
}

export default function ImageUploader({ value: images, onChange }: ImageUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (incoming: File[]) => {
    const next = [...images, ...incoming].slice(0, MAX_IMAGES);
    onChange(next);
  };

  const removeFile = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, MAX_IMAGES - images.length);
    addFiles(files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, MAX_IMAGES - images.length);
    addFiles(files);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-small text-fg-3">
        카페 분위기를 보여주는 사진을 최대 {MAX_IMAGES}장 업로드해주세요.
        <br />
        <span className="text-sm text-gray-400">
          최초 등록 카페는 이미지 1장 이상 업로드 해주세요.
        </span>
      </p>

      {images.length < MAX_IMAGES && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileRef.current?.click()}
          className={cls(
            "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer py-10 transition-all duration-160",
            dragging
              ? "border-kg-amber bg-kg-amber-light/40"
              : "border-border-medium hover:border-kg-amber hover:bg-gray-50/60",
          )}
        >
          <div className="flex items-center justify-center size-11 rounded-xl bg-gray-100">
            <TbPhoto size={21} strokeWidth={1.5} className="text-fg-4" />
          </div>
          <div className="flex flex-col items-center gap-0.5 text-center">
            <span className="text-small font-semibold text-fg-2">사진 추가</span>
            <span className="font-mono text-[11px] text-fg-4">
              {images.length}/{MAX_IMAGES} · 드래그하거나 클릭
            </span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((file, i) => {
            const url = URL.createObjectURL(file);
            return (
              <div
                key={i}
                className="relative rounded-lg overflow-hidden aspect-square bg-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1.5 right-1.5 size-7 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <TbX size={15} strokeWidth={2.5} />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 font-mono text-[9px] font-bold bg-black/60 text-white rounded px-1.5 py-0.5 uppercase tracking-wide">
                    대표
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
