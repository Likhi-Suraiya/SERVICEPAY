import { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { FaShieldAlt } from "react-icons/fa";
import PropTypes from "prop-types";

export const CaptchaModal = ({
  show,
  onHide,
  onVerify,
  title = "Security Verification",
  buttonText = "Proceed",
  isVerifying = false,
}) => {
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  // Generate random captcha
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz0123456789";
    let captcha = "";
    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(captcha);
    setCaptchaValue("");
    setCaptchaError("");
  };

  // Reset captcha when modal opens
  useEffect(() => {
    if (show) {
      generateCaptcha();
    }
  }, [show]);

  // Handle verify click
  const handleVerify = () => {
    if (!captchaValue) {
      setCaptchaError("Please enter the captcha code");
      return;
    }

    if (captchaValue !== captchaCode) {
      setCaptchaError("Invalid captcha code. Please try again.");
      generateCaptcha();
      return;
    }

    onVerify();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton style={{ backgroundColor: "#ff9a00" }}>
        <Modal.Title className="text-white">
          <FaShieldAlt className="me-2" />
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-3">
          <p className="mb-2">Please enter the code shown below:</p>
          <div
            style={{
              backgroundColor: "#f0f0f0",
              padding: "15px",
              fontSize: "28px",
              fontWeight: "bold",
              letterSpacing: "8px",
              fontFamily: "monospace",
              borderRadius: "8px",
              display: "inline-block",
              border: "1px solid #ddd",
            }}
          >
            {captchaCode}
          </div>
        </div>
        <Form.Group className="mb-3">
          <Form.Label>Enter Captcha Code</Form.Label>
          <Form.Control
            type="text"
            value={captchaValue}
            onChange={(e) => {
              setCaptchaValue(e.target.value);
              setCaptchaError("");
            }}
            placeholder="Enter the code above"
            isInvalid={!!captchaError}
            autoFocus
            onKeyPress={(e) => e.key === "Enter" && handleVerify()}
          />
          <Form.Control.Feedback type="invalid">
            {captchaError}
          </Form.Control.Feedback>
        </Form.Group>
        <Button
          variant="link"
          size="sm"
          onClick={generateCaptcha}
          className="mt-2"
        >
          Refresh Captcha
        </Button>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleVerify}
          disabled={isVerifying}
          style={{ backgroundColor: "#055fae" }}
        >
          {isVerifying ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Verifying...
            </>
          ) : (
            buttonText
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

CaptchaModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onVerify: PropTypes.func.isRequired,
  title: PropTypes.string,
  buttonText: PropTypes.string,
  isVerifying: PropTypes.bool,
};