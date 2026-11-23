interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary" | "success" | "danger" | "warning";
  type?: "button" | "submit";
  size?: "sm" | "lg";
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({
  label,
  variant = "primary",
  type = "button",
  size,
  disabled,
  onClick,
}: ButtonProps) {
  const sizeClass = size ? ` btn-${size}` : "";
  return (
    <button
      type={type}
      className={`btn btn-${variant}${sizeClass}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
