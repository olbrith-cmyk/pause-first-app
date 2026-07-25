import type { Attachment } from "../firestore";

export default function AttachmentGallery({
  attachments,
  onRemove,
  removeLabel
}: {
  attachments?: Attachment[];
  onRemove?: (attachment: Attachment) => void;
  removeLabel?: string;
}) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="attachmentGrid">
      {attachments.map((a) => (
        <div key={a.id} className="attachmentItem">
          {a.type === "photo" && <img src={a.url} alt="" className="attachmentThumb" />}
          {a.type === "video" && (
            <video src={a.url} controls className="attachmentThumb" />
          )}
          {a.type === "audio" && <audio src={a.url} controls className="attachmentAudio" />}

          {onRemove && (
            <button
              type="button"
              className="attachmentRemoveBtn"
              onClick={() => onRemove(a)}
              aria-label={removeLabel ?? "Remove"}
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
