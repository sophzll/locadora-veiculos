import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface AlertProps {
  type: "success" | "danger" | "warning";
  message: string;
  onClose?: () => void;
  duration?: number;
}

const titulos = {
  success: "Sucesso!",
  danger: "Erro!",
  warning: "Atenção!",
};

const simbolos = {
  success: "✓",
  danger: "×",
  warning: "!",
};

export function Alert({ type, message, onClose, duration = 5000 }: AlertProps) {
  const fecharRef = useRef(onClose);
  const flutuante = Boolean(onClose);

  useEffect(() => {
    fecharRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!flutuante || !message || duration <= 0) return;

    const timer = window.setTimeout(() => fecharRef.current?.(), duration);
    return () => window.clearTimeout(timer);
  }, [message, type, duration, flutuante]);

  if (!message) return null;

  if (!flutuante) {
    return (
      <div className={`alert alert-${type}`} role="alert">
        {message}
      </div>
    );
  }

  return createPortal(
    <div
      className="toast-container position-fixed top-0 start-50 translate-middle-x p-3"
      style={{ zIndex: 1100, width: "min(100%, 480px)" }}
    >
      <div
        className={`toast show w-100 bg-dark text-light border-${type} shadow-lg`}
        role={type === "success" ? "status" : "alert"}
        aria-live={type === "success" ? "polite" : "assertive"}
        aria-atomic="true"
      >
        <div className="toast-body d-flex align-items-start gap-3 p-3">
          <span
            className={`rounded-circle bg-${type} ${type === "warning" ? "text-dark" : "text-white"} d-inline-flex align-items-center justify-content-center flex-shrink-0 fw-bold fs-5`}
            style={{ width: 36, height: 36 }}
            aria-hidden="true"
          >
            {simbolos[type]}
          </span>
          <div className="flex-grow-1 text-break">
            <strong className="d-block mb-1">{titulos[type]}</strong>
            <span>{message}</span>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white flex-shrink-0"
            aria-label="Fechar notificação"
            onClick={onClose}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
