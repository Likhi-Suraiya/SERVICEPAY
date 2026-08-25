// ImgSprinner.jsx
import "../loader/ThreeStringLoader.css";
import logoPng from "../../../public/assets/img/prg logo.png";

const ThreeStringLoader = () => {
  return (
    <div className="blur-overlay">
      <div className="loading-bg">
        <div className="sk-three-strings">
          <div className="sk-string sk-string-1"></div>
          <div className="sk-string sk-string-2"></div>
          <div className="sk-string sk-string-3"></div>
          <div className="logo-center">
            <img 
              src={logoPng} 
              alt="Logo" 
              className="logo-icn" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeStringLoader;
