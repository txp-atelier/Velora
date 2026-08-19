import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Remove", danger = true }) {
  return (
    <Modal open={open} onClose={onClose} className="confirm-dialog" labelledBy="confirm-dialog-title" showClose={false}>
      <div className="confirm-dialog-icon">
        <AlertTriangle size={26} />
      </div>
      <h2 id="confirm-dialog-title">{title}</h2>
      <p>{message}</p>
      <div className="confirm-dialog-actions">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
