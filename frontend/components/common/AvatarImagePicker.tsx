"use client";

import Image from "next/image";
import { useId, useState, type ChangeEvent } from "react";
import { useAppLanguage } from "@/components/layout/AppShell";

const maxImageSize = 1024 * 1024;
const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];

interface AvatarImagePickerProps {
  value: string;
  onChange: (image: string) => void;
}

export default function AvatarImagePicker({
  value,
  onChange,
}: AvatarImagePickerProps) {
  const { translate } = useAppLanguage();
  const inputId = useId();
  const [error, setError] = useState("");

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    setError("");

    if (!file) return;
    if (!acceptedImageTypes.includes(file.type)) {
      setError("Choisis une image JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > maxImageSize) {
      setError("L’image doit faire 1 Mo maximum.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Impossible de lire cette image.");
        return;
      }
      onChange(reader.result);
    };
    reader.onerror = () => setError("Impossible de lire cette image.");
    reader.readAsDataURL(file);
  }

  return (
    <div className="avatar-picker">
      <div className="avatar-picker-preview">
        {value ? (
          <Image
            src={value}
            alt={translate("Aperçu de la photo de profil")}
            width={80}
            height={80}
            unoptimized
          />
        ) : (
          <span aria-hidden="true">◉</span>
        )}
      </div>
      <div className="avatar-picker-content">
        <label className="avatar-picker-title" htmlFor={inputId}>
          {translate("Photo de profil")}
        </label>
        <span className="help-text" id={`${inputId}-help`}>
          {translate("JPEG, PNG ou WebP · 1 Mo maximum")}
        </span>
        <div className="avatar-picker-actions">
          <label
            className="btn btn-outline avatar-picker-button"
            htmlFor={inputId}
          >
            {translate("Choisir une image")}
          </label>
          <input
            className="avatar-file-input"
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-describedby={`${inputId}-help`}
            onChange={chooseImage}
          />
          {value && (
            <button
              className="small-btn"
              type="button"
              onClick={() => {
                onChange("");
                setError("");
              }}
            >
              {translate("Supprimer")}
            </button>
          )}
        </div>
        {error && (
          <span className="help-text avatar-picker-error" role="alert">
            {translate(error)}
          </span>
        )}
      </div>
    </div>
  );
}
