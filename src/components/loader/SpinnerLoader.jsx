import './SpinnerLoader.css';

export const SpinnerLoader = ({ size = 80, color = '#7367f0', text = "Loading..." }) => {
  return (
    <div className="spinner-container">
      <div 
        className="spinner" 
        style={{
          width: size,
          height: size,
          borderTopColor: color
        }}
      >
        <div className="spinner-inner" style={{ borderColor: color }}></div>
      </div>
      <div className="spinner-text" style={{ color }}>
        {text}
        <span className="animated-dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </div>
    </div>
  );
};
