import { useRef, useState } from "react";
import type { Lang } from "../i18n";
import type { Attachment } from "../firestore";
import {
  ATTACHMENT_MAX_MB,
  deleteAttachment,
  isAttachmentTooLarge,
  isSupportedAttachment,
  uploadAttachment
} from "../utils/attachments";
import AttachmentGallery from "./AttachmentGallery";

export default function AttachmentManager({
  lang,
  userId,
  scopeId,
  attachments,
  onChange
}: {
  lang: Lang;
  userId: string;
  scopeId: string;
  attachments: Attachment[];
  onChange: (next: Attachment[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);
    try {
      const uploaded: Attachment[] = [];
      for (const file of Array.from(files)) {
        if (!isSupportedAttachment(file)) {
          setError(
            lang === "da"
              ? `Filtypen understøttes ikke: ${file.name}`
              : `Unsupported file type: ${file.name}`
          );
          continue;
        }
        if (isAttachmentTooLarge(file)) {
          setError(
            lang === "da"
              ? `${file.name} er for stor (maks ${ATTACHMENT_MAX_MB}MB).`
              : `${file.name} is too large (max ${ATTACHMENT_MAX_MB}MB).`
          );
          continue;
        }
        uploaded.push(await uploadAttachment({ userId, scopeId, file }));
      }
      if (uploaded.length) onChange([...attachments, ...uploaded]);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async (attachment: Attachment) => {
    onChange(attachments.filter((a) => a.id !== attachment.id));
    await deleteAttachment(attachment);
  };

  return (
    <div className="attachmentManager">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

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
          : lang === "da"
          ? "+ Tilføj foto, video eller lyd"
          : "+ Add photo, video, or audio"}
      </button>

      <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
        {lang === "da"
          ? `Maks. filstørrelse: ${ATTACHMENT_MAX_MB}MB pr. fil.`
          : `Max file size: ${ATTACHMENT_MAX_MB}MB per file.`}
      </div>

      {error && (
        <div className="alert alertError" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}

      <AttachmentGallery
        attachments={attachments}
        onRemove={handleRemove}
        removeLabel={lang === "da" ? "Fjern" : "Remove"}
      />
    </div>
  );
}
