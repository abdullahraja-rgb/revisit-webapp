"use client";

interface PrimaryButtonProps {
  onClick?: () => void;
  onSubmit?: () => void;
  className?: string;
  title?: string;
  type?: "button" | "submit" | "reset";
  children?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  iconRightClass?: string;
  titleClass?: string;
  gradientClass?: string;
  wrapperClass?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  onClick,
  onSubmit,
  className = "w-full h-[28px]",
  title,
  type = "button",
  children,
  iconLeft,
  iconRight,
  disabled = false,
  iconRightClass,
  titleClass = "text-sm font-[400] leading-normal",
}) => {
  return (
    <button
      onClick={onClick}
      onSubmit={onSubmit}
      type={type}
      disabled={disabled}
      className={`flex-center gap-3 leading-normal bg-green-600 text-white rounded-[6px] transition-all duration-200 relative cursor-pointer
        ${disabled ? "cursor-not-allowed" : "hover:brightness-110"}
        ${className}
        relative z-10 m-[1px]`}
    >
      {iconLeft && <span>{iconLeft}</span>}
      {disabled && (
        <div className="inset-0 flex-center">
          <div className="w-4 h-4 border-t-2 border-b-2 border-pri-light rounded-full animate-spin"></div>
        </div>
      )}
      {title && <span className={titleClass}>{title}</span>}
      {iconRight && <span className={`${iconRightClass}`}>{iconRight}</span>}
      {children}
    </button>
  );
};

export default PrimaryButton;