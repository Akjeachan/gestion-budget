import React from "react";
import "../styles/ConfirmationModal.css";

function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, isLoading = false }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="confirmation-overlay" onClick={onCancel} />
      <div className="confirmation-modal">
        <div className="confirmation-header">
          <h2>{title}</h2>
        </div>

        <div className="confirmation-body">
          <p>{message}</p>
        </div>

        <div className="confirmation-footer">
          <button
            className="btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            className="btn-confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "⏳ Validation..." : "Confirmer"}
          </button>
        </div>
      </div>
    </>
  );
}

export default ConfirmationModal;
