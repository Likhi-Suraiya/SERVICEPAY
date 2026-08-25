import "./GlowButton.css";

export const GlowButton = ({
  children = "Click Me",
  onClick,
  className = "",
  size = "medium",
  disabled = false,
  type = "button",
  gradientColors = ["#ff5f6d", "#ffc371", "#42a5ff", "#5eff8e"],
  animationSpeed = "normal",
  showCursor = true,
  ...props
}) => {
  const sizeStyles = {
    small: { padding: "12px 32px", fontSize: "16px" },
    medium: { padding: "16px 48px", fontSize: "20px" },
    large: { padding: "20px 64px", fontSize: "24px" },
  };

  const speedStyles = {
    slow: { animationDuration: "4s, 1.5s, 2s, 1s" },
    normal: { animationDuration: "3s, 1.2s, 1.4s, 0.8s" },
    fast: { animationDuration: "2s, 0.8s, 1s, 0.5s" },
  };

  const gradientStyle = {
    background: `linear-gradient(90deg, ${gradientColors.join(", ")})`,
    backgroundSize: "300%",
  };

  return (
    <button
      className={`glow-btn ${className} ${
        disabled ? "glow-btn--disabled" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
      type={type}
      style={{
        ...sizeStyles[size],
        ...speedStyles[animationSpeed],
        ...gradientStyle,
        ...props.style,
      }}
      {...props}
    >
      {children}
      {showCursor && <span className="glow-btn__cursor" />}
    </button>
  );
};

export default GlowButton;
