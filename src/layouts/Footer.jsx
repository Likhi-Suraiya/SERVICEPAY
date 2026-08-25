const Footer = () => {
  return (
    <footer className="footer bg-footer-theme fixed-bottom py-3">
      <div className="container-xxl">
        <div className="text-center">
          Copyright © {new Date().getFullYear()} <b className="color-blue">PAYSERVICE
            </b>. Developed by  
           <b className="color-blue"> CS-MIS</b>. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
export default Footer;
