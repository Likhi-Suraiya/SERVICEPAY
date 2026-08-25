// components/AnimatedButton.jsx
import "./AnimatedButton.css";  

export const AnimatedButton = ({
  children,
  onClick,
  animationType = "continuous-bounce-subtle",
  className = "",
  disabled = false,
  type = "button",
  ...props
}) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={`animated-btn ${animationType} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default AnimatedButton;
