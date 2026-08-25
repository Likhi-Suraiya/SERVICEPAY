// components/EnhancedAnimatedButton.jsx
import "./AnimatedButton.css";      

export const EnhancedAnimatedButton = ({
  children,
  onClick,
  animationType = "continuous-bounce-subtle",
  className = "",
  disabled = false,
  type = "button",
  variant = "primary",
  size = "medium",
  loading = false,
  ...props
}) => {
  const handleClick = (e) => {
    if (disabled || loading) return;

    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "px-3 py-2 text-xs";
      case "large":
        return "px-6 py-3 text-base";
      default:
        return "px-4 py-2 text-sm";
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "secondary":
        return "bg-gray-600 hover:bg-gray-700";
      case "success":
        return "bg-green-600 hover:bg-green-700";
      case "warning":
        return "bg-orange-600 hover:bg-orange-700";
      default:
        return "bg-gradient-to-r from-blue-600 to-blue-700";
    }
  };

  return (
    <button
      type={type}
      className={`
        animated-btn
        ${!disabled && !loading ? animationType : ""}
        ${getSizeClasses()}
        ${getVariantClasses()}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default EnhancedAnimatedButton;
