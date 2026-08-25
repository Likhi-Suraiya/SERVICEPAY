import "../loader/ImgSprinner.css";
import logoPng from "../../../public/assets/img/prg logo.png"; // <-- replace with your actual PNG path

const ImgSprinner = () => {
  return (
    <div className="blur-overlay">
      <div id="icon-background" className="loading-background">
        <div className="loading-icon">
          <div className="loading-container">
            <div data-loader="logo-circle"></div>
            <img
              src={logoPng}
              height={40}
              width={40}
              alt="Logo"
              className="logo-icon"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImgSprinner;
