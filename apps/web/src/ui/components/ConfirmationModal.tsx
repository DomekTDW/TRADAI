import React from "react";

export function ConfirmationModal(props: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!props.open) return null;

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{props.title}</div>
        <div style={{ opacity: 0.9, marginBottom: 16, lineHeight: 1.4 }}>{props.message}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={props.onCancel} style={styles.btnSecondary}>
            {props.cancelText ?? "Anuluj"}
          </button>
          <button onClick={props.onConfirm} style={styles.btnPrimary}>
            {props.confirmText ?? "Potwierdź"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "grid",
    placeItems: "center",
    zIndex: 50
  },
  modal: {
    width: "min(520px, calc(100vw - 32px))",
    background: "#111827",
    color: "white",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 20px 50px rgba(0,0,0,0.35)"
  },
  btnPrimary: {
    borderRadius: 10,
    padding: "10px 12px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "#22c55e",
    color: "#0b1220",
    fontWeight: 700,
    cursor: "pointer"
  },
  btnSecondary: {
    borderRadius: 10,
    padding: "10px 12px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "transparent",
    color: "white",
    fontWeight: 600,
    cursor: "pointer"
  }
};
