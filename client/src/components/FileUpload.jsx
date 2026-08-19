import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Clock } from "lucide-react";
import { isValidImageFile } from "../utils/validation";
import { imageCount } from "../utils/imageUpload";

/**
 * Local-only file staging — nothing is uploaded here. New picks get an
 * object-URL preview and sit in `newFiles` until the parent form actually
 * submits (see utils/imageUpload.finalizeImages); removing anything, new
 * or previously-saved, never touches the server.
 */
export default function FileUpload({ value, onChange, max = 5, disabled = false }) {
  const { existing, newFiles } = value;
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const count = imageCount(value);

  const addFiles = (fileList) => {
    if (disabled) return;
    setError("");
    const room = max - count;
    if (room <= 0) {
      setError(`You can only add up to ${max} images.`);
      return;
    }
    const picked = Array.from(fileList).slice(0, room);
    const staged = [];
    for (const file of picked) {
      const { valid, error: fileError } = isValidImageFile(file);
      if (!valid) { setError(fileError); continue; }
      staged.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, previewUrl: URL.createObjectURL(file) });
    }
    if (staged.length) {
      onChange({ ...value, newFiles: [...newFiles, ...staged] });
    }
  };

  const removeExisting = (url) => {
    if (disabled) return;
    onChange({ ...value, existing: existing.filter((u) => u !== url), removed: [...value.removed, url] });
  };

  const removeNew = (id) => {
    if (disabled) return;
    const target = newFiles.find((f) => f.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange({ ...value, newFiles: newFiles.filter((f) => f.id !== id) });
  };

  return (
    <div className="file-upload">
      {(existing.length > 0 || newFiles.length > 0) && (
        <div className="file-preview-grid">
          {existing.map((url) => (
            <div key={url} className="file-preview">
              <img src={url} alt="Product" />
              <button type="button" className="file-remove" onClick={() => removeExisting(url)} aria-label="Remove image" disabled={disabled}>
                <X size={14} />
              </button>
            </div>
          ))}
          {newFiles.map((f) => (
            <div key={f.id} className="file-preview">
              <img src={f.previewUrl} alt="Selected" />
              <span className="file-pending-badge" title="Uploads when you submit">
                <Clock size={11} />
              </span>
              <button type="button" className="file-remove" onClick={() => removeNew(f.id)} aria-label="Remove image" disabled={disabled}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {count < max && (
        <div
          className={`file-dropzone ${dragOver ? "drag-over" : ""} ${disabled ? "disabled" : ""}`}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          onClick={() => !disabled && inputRef.current?.click()}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            disabled={disabled}
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          />
          <Upload size={24} />
          <span>Drag and drop, or click to choose one or more images</span>
          <span className="text-secondary text-sm">PNG, JPG or WEBP up to 5 MB — saved when you submit</span>
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
      {!count && !error && (
        <p className="text-secondary text-sm"><ImageIcon size={14} style={{ verticalAlign: "middle" }} /> Up to {max} images</p>
      )}
    </div>
  );
}
