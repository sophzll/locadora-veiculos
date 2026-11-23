interface AlertProps {
  type: "success" | "danger" | "warning";
  message: string;
  onClose?: () => void;
}

export function Alert({ type, message, onClose }: AlertProps) {
  return (
    <div
      className={`alert alert-${type} d-flex justify-content-between align-items-center`}
      role="alert"
    >
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          className="btn-close"
          aria-label="Fechar"
          onClick={onClose}
        ></button>
      )}
    </div>
  );
}
