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

const UPLOAD_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
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

  const timeoutMessage =
    "Upload timed out. This usually means Firebase Storage isn't set up for this project yet, or there's a network issue.";

  try {
    const storageRef = ref(storage, path);
    await withTimeout(uploadBytes(storageRef, file), UPLOAD_TIMEOUT_MS, timeoutMessage);
    const url = await withTimeout(getDownloadURL(storageRef), UPLOAD_TIMEOUT_MS, timeoutMessage);

    return {
      id,
      type,
      url,
      caption: "",
      createdAt: new Date().toISOString()
    };
  } catch (e: any) {
    console.error("Attachment upload failed", e?.code ?? "", e?.message ?? e);
    throw e;
  }
}

export async function deleteAttachment(attachment: Attachment): Promise<void> {
  try {
    await deleteObject(ref(storage, attachment.url));
  } catch (e) {
    // Non-fatal - if it's already gone, just let the caller drop it from the list.
    console.error("Failed to delete attachment from storage", e);
  }
}

const PET_PHOTO_MAX_BYTES = 8 * 1024 * 1024;
export const PET_PHOTO_MAX_MB = PET_PHOTO_MAX_BYTES / (1024 * 1024);

export function isSupportedPetPhoto(file: File): boolean {
  return file.type.startsWith("image/");
}

export function isPetPhotoTooLarge(file: File): boolean {
  return file.size > PET_PHOTO_MAX_BYTES;
}

export async function uploadPetPhoto(params: {
  userId: string;
  scopeId: string;
  file: File;
}): Promise<string> {
  const { userId, scopeId, file } = params;

  if (!isSupportedPetPhoto(file)) throw new Error("Unsupported file type.");
  if (isPetPhotoTooLarge(file)) throw new Error(`File is larger than ${PET_PHOTO_MAX_MB}MB.`);

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const safeName = file.name.replace(/[^\w.\-]/g, "_");
  const path = `pet-photos/${userId}/${scopeId}/${id}-${safeName}`;

  const timeoutMessage =
    "Upload timed out. This usually means Firebase Storage isn't set up for this project yet, or there's a network issue.";

  const storageRef = ref(storage, path);
  await withTimeout(uploadBytes(storageRef, file), UPLOAD_TIMEOUT_MS, timeoutMessage);
  return withTimeout(getDownloadURL(storageRef), UPLOAD_TIMEOUT_MS, timeoutMessage);
}

export async function deletePetPhoto(url: string): Promise<void> {
  try {
    await deleteObject(ref(storage, url));
  } catch (e) {
    console.error("Failed to delete pet photo from storage", e);
  }
}
