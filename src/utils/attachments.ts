import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";
import type { Attachment, AttachmentType } from "../firestore";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const ATTACHMENT_MAX_MB = MAX_FILE_BYTES / (1024 * 1024);

function attachmentTypeFromMime(mime: string): AttachmentType | null {
  if (mime.startsWith("image/")) return "photo";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return null;
}

export function isSupportedAttachment(file: File): boolean {
  return attachmentTypeFromMime(file.type) !== null;
}

export function isAttachmentTooLarge(file: File): boolean {
  return file.size > MAX_FILE_BYTES;
}

export async function uploadAttachment(params: {
  userId: string;
  scopeId: string;
  file: File;
}): Promise<Attachment> {
  const { userId, scopeId, file } = params;

  const type = attachmentTypeFromMime(file.type);
  if (!type) throw new Error("Unsupported file type.");
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`File is larger than ${ATTACHMENT_MAX_MB}MB.`);
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const safeName = file.name.replace(/[^\w.\-]/g, "_");
  const path = `attachments/${userId}/${scopeId}/${id}-${safeName}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return {
    id,
    type,
    url,
    caption: "",
    createdAt: new Date().toISOString()
  };
}

export async function deleteAttachment(attachment: Attachment): Promise<void> {
  try {
    await deleteObject(ref(storage, attachment.url));
  } catch (e) {
    // Non-fatal - if it's already gone, just let the caller drop it from the list.
    console.error("Failed to delete attachment from storage", e);
  }
}
