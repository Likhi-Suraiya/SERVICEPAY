import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../context/AuthContext";
import { changedPassword } from "../../api/authapi";
import { AuthWrapper } from "../authentication/AuthWrapper";
import ThreeStringLoader from "../../components/loader/ThreeStringLoader";

export const ChangePassword = () => {
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  //---------------- Handle input changes ----------------

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  //----------------- Validate form -----------------

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 4) {
      newErrors.newPassword = "Password must be at least 4 characters long";
    }else if (formData.newPassword.length > 11) {
      newErrors.newPassword = "Password cannot exceed 11 characters";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Check if new password is same as current password
    if (
      formData.currentPassword &&
      formData.newPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      newErrors.newPassword =
        "New password must be different from current password";
    }
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  //----------------- Handle form submission -----------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    setIsLoading(true);

    try {
      const requestData = {
        partnerId: user?.staffId || "",
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      };

      console.log("Sending change password request:", requestData);
      const response = await changedPassword(requestData);

      if (response.successCode === "2000") {
        toast.success(
          response.successMessage || "Password changed successfully!"
        );

        // Reset form
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setErrors({});
      } else {
        toast.error(
          response.successMessage ||
            "Failed to change password. Please try again."
        );
      }
    } catch (error) {
      console.error("Change password error:", error);

      // Handle API error response
      const errorMessage =
        error.response?.data?.successMessage ||
        error.response?.data?.message ||
        "An error occurred while changing password. Please try again.";

      toast.error(errorMessage);

      // Set specific field errors if available from API
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="">
      {isLoading && <ThreeStringLoader />}
      <ToastContainer position="top-right" />
      <AuthWrapper>
        <h4 className="mb-2">Change Password? 🔒</h4>
        <p className="mb-4">
          Enter your current password and set a new password
        </p>

        <div>
          <p className="fw-bold me-3">
            Party ID:{" "}
            <span className="fw-normal fw-bold color-blue">
              {user?.staffId || "N/A"}
            </span>
          </p>
        </div>

        <form
          id="formAuthentication"
          className="mb-3"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Current Password Field */}
          <div className="mb-3 form-password-toggle">
            <label htmlFor="currentPassword" className="form-label">
              Current Password
            </label>
            <div className="input-group input-group-merge">
              <input
                type="password"
                autoComplete={"off"}
                id="currentPassword"
                className={`form-control${
                  errors.currentPassword ? " is-invalid" : ""
                }`}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                placeholder="••••••••••••"
                aria-describedby="currentPassword"
                disabled={isLoading}
              />
              {errors.currentPassword && (
                <div className="invalid-feedback d-block">
                  {errors.currentPassword}
                </div>
              )}
            </div>
          </div>

          {/* New Password Field */}
          <div className="mb-3 form-password-toggle">
            <label htmlFor="newPassword" className="form-label">
              New Password
            </label>
            <div className="input-group input-group-merge">
              <input
                type="password"
                autoComplete={"off"}
                id="newPassword"
                className={`form-control${
                  errors.newPassword ? " is-invalid" : ""
                }`}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="••••••••••••"
                aria-describedby="newPassword"
                disabled={isLoading}
              />
              {errors.newPassword && (
                <div className="invalid-feedback d-block">
                  {errors.newPassword}
                </div>
              )}
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="mb-3 form-password-toggle">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <div className="input-group input-group-merge">
              <input
                type="password"
                autoComplete={"off"}
                id="confirmPassword"
                className={`form-control${
                  errors.confirmPassword ? " is-invalid" : ""
                }`}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••••••"
                aria-describedby="confirmPassword"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <div className="invalid-feedback d-block">
                  {errors.confirmPassword}
                </div>
              )}
            </div>
          </div>

          <div className="mb-3">
            <button
              aria-label="Click to change password"
              className="btn btn-primary d-grid w-100"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                ></span>
              ) : (
                "Change Password"
              )}
            </button>
          </div>
        </form>
      </AuthWrapper>
    </div>
  );
};
