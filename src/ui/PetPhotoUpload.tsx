import { useRef, useState } from "react";
import type { Lang } from "../i18n";
import {
  PET_PHOTO_MAX_MB,
  deletePetPhoto,
  isPetPhotoTooLarge,
  isSupportedPetPhoto,
  uploadPetPhoto
} from "../utils/attachments";
import PetAvatar from "./PetAvatar";

export default function PetPhotoUpload({
  lang,
  userId,
  scopeId,
  photoUrl,
  onChange
}: {
  lang: Lang;
  userId: string;
  scopeId: string;
  photoUrl?: string;
  onChange: (next: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setError(null);

    if (!isSupportedPetPhoto(file)) {
      setError(lang === "da" ? `Filtypen understøttes ikke: ${file.name}` : `Unsupported file type: ${file.name}`);
      return;
    }
    if (isPetPhotoTooLarge(file)) {
      setError(
        lang === "da"
          ? `${file.name} er for stor (maks ${PET_PHOTO_MAX_MB}MB).`
          : `${file.name} is too large (max ${PET_PHOTO_MAX_MB}MB).`
      );
      return;
    }

    setUploading(true);
    try {
      const previousUrl = photoUrl;
      const url = await uploadPetPhoto({ userId, scopeId, file });
      onChange(url);
      if (previousUrl) await deletePetPhoto(previousUrl);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!photoUrl) return;
    onChange(undefined);
    await deletePetPhoto(photoUrl);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
      <PetAvatar photoUrl={photoUrl} size={72} />

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files)}
        />

        <div className="row rowWrap" style={{ gap: 8 }}>
          <button
            type="button"
            className="btn btnSecondary"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading
              ? lang === "da"
                ? "Uploader…"
                : "Uploading…"
              : photoUrl
                ? lang === "da"
                  ? "Skift foto"
                  : "Change photo"
                : lang === "da"
                  ? "+ Tilføj foto"
                  : "+ Add photo"}
          </button>

          {photoUrl && (
            <button type="button" className="btn btnLink" onClick={handleRemove} disabled={uploading}>
              {lang === "da" ? "Fjern" : "Remove"}
            </button>
          )}
        </div>

        <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
          {lang === "da"
            ? `Maks. filstørrelse: ${PET_PHOTO_MAX_MB}MB.`
            : `Max file size: ${PET_PHOTO_MAX_MB}MB.`}
        </div>

        {error && (
          <div className="alert alertError" style={{ marginTop: 8 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
