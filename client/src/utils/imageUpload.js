import { uploadApi } from "../services/api";

// Shared shape for deferred image state used by FileUpload:
//   existing — URLs already saved on the product/review (edit mode)
//   newFiles — [{ id, file, previewUrl }] picked locally, not yet uploaded
//   removed  — URLs that were in `existing` but the user removed this session
export const emptyImageState = () => ({ existing: [], newFiles: [], removed: [] });
export const toImageState = (urls = []) => ({ existing: [...urls], newFiles: [], removed: [] });
export const imageCount = (state) => state.existing.length + state.newFiles.length;

/**
 * Uploads any pending local files to Cloudinary and returns the final URL
 * list to save on the product/review. Nothing touches Cloudinary until
 * this runs — i.e. not until the form is actually submitted. If a file
 * partway through the batch fails, whatever already uploaded in this
 * batch is deleted again before the error propagates, so a failed submit
 * never leaves orphaned images behind either.
 */
export const finalizeImages = async (state) => {
  const uploaded = [];
  try {
    for (const { file } of state.newFiles) {
      const { url } = await uploadApi.file(file);
      uploaded.push(url);
    }
  } catch (err) {
    await Promise.allSettled(uploaded.map((url) => uploadApi.remove(url)));
    throw err;
  }
  return { urls: [...state.existing, ...uploaded], newlyUploaded: uploaded };
};

/** Call if the save that was supposed to reference `newlyUploaded` fails —
 * those images were never confirmed to any product/review, so nothing
 * blocks deleting them again. */
export const rollbackUploads = (newlyUploaded) => {
  if (!newlyUploaded?.length) return Promise.resolve();
  return Promise.allSettled(newlyUploaded.map((url) => uploadApi.remove(url)));
};

/** Call only after the product/review save has succeeded — purges images
 * the user removed during this edit, now that nothing references them. */
export const cleanupRemovedImages = (state) => {
  if (!state.removed.length) return Promise.resolve();
  return Promise.allSettled(state.removed.map((url) => uploadApi.remove(url)));
};

export const revokeImageState = (state) => {
  state.newFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
};
