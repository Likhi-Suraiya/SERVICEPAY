import { useState } from "react";

export const useCaptcha = () => {
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [onVerifyCallback, setOnVerifyCallback] = useState(null);

  const showCaptchaModal = (onVerify) => {
    setOnVerifyCallback(() => onVerify);
    setShowCaptcha(true);
  };

  const hideCaptchaModal = () => {
    setShowCaptcha(false);
    setOnVerifyCallback(null);
    setIsVerifying(false);
  };

  const handleVerify = async () => {
    if (onVerifyCallback) {
      setIsVerifying(true);
      try {
        await onVerifyCallback();
        hideCaptchaModal();
      } catch (error) {
        console.error("Verification failed:", error);
      } finally {
        setIsVerifying(false);
      }
    }
  };

  return {
    showCaptcha,
    isVerifying,
    showCaptchaModal,
    hideCaptchaModal,
    handleVerify,
  };
};