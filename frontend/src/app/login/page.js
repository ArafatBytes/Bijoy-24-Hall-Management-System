"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
} from "react-icons/fi";

export default function LoginPage() {
  const [userType, setUserType] = useState("student");
  const [formData, setFormData] = useState({
    userId: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password States
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: StudentID, 2: OTP, 3: NewPassword
  const [studentId, setStudentId] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${userType}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userType", data.userType);

        // Redirect based on user type
        if (data.userType === "Admin") {
          window.location.href = "/admin/dashboard";
        } else {
          window.location.href = "/student/dashboard";
        }
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openForgotPasswordModal = () => {
    setShowForgotPasswordModal(true);
    setForgotPasswordStep(1);
    setStudentId("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    setResetSuccess("");
    setMaskedEmail("");
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setForgotPasswordStep(1);
    setStudentId("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    setResetSuccess("");
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    setResetSuccess("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMaskedEmail(data.email);
        setResetSuccess(data.message);
        setForgotPasswordStep(2);
      } else {
        setResetError(data.message || "Failed to send OTP");
      }
    } catch (err) {
      setResetError("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    setResetSuccess("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId, otp }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResetSuccess(data.message);
        setForgotPasswordStep(3);
      } else {
        setResetError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setResetError("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    setResetSuccess("");

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      setResetLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      setResetLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId, otp, newPassword }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResetSuccess(data.message);
        setTimeout(() => {
          closeForgotPasswordModal();
        }, 2000);
      } else {
        setResetError(data.message || "Failed to reset password");
      }
    } catch (err) {
      setResetError("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300 relative z-10"
      >
        <div className="card-body p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-primary mb-2">
              Welcome Back
            </h1>
            <p className="text-base-content/70">
              Sign in to Bijoy 24 Hall Management System
            </p>
          </motion.div>

          {/* User Type Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="tabs tabs-boxed mb-6 bg-base-200"
          >
            <button
              className={`tab tab-lg flex-1 transition-all duration-300 ${
                userType === "student"
                  ? "tab-active bg-primary text-primary-content"
                  : "hover:bg-base-300"
              }`}
              onClick={() => setUserType("student")}
            >
              Student
            </button>
            <button
              className={`tab tab-lg flex-1 transition-all duration-300 ${
                userType === "admin"
                  ? "tab-active bg-primary text-primary-content"
                  : "hover:bg-base-300"
              }`}
              onClick={() => setUserType("admin")}
            >
              Admin
            </button>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="alert alert-error mb-4 bg-error/10 border-error/20 text-error"
            >
              <span>{error}</span>
            </motion.div>
          )}

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  {userType === "student" ? "Student ID" : "Admin ID"}
                </span>
              </label>
              <input
                type="text"
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
                placeholder={
                  userType === "student"
                    ? "Enter your student ID"
                    : "Enter your admin ID"
                }
                className="input input-bordered w-full focus:input-primary transition-all duration-300"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="input input-bordered w-full pr-12 focus:input-primary transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
                >
                  {showPassword ? (
                    <FiEyeOff className="w-5 h-5" />
                  ) : (
                    <FiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {userType === "student" && (
                <label className="label">
                  <span className="label-text-alt"></span>
                  <button
                    type="button"
                    onClick={openForgotPasswordModal}
                    className="label-text-alt link link-primary hover:link-hover"
                  >
                    Forgot Password?
                  </button>
                </label>
              )}
            </div>

            <motion.div
              className="form-control mt-8"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                type="submit"
                className={`btn btn-primary w-full text-lg py-3 shadow-lg hover:shadow-xl transition-all duration-300 ${
                  loading ? "loading" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </motion.div>
          </motion.form>

          {userType === "student" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-6"
            >
              <p className="text-sm text-base-content/70">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="link link-primary font-medium hover:text-primary-focus"
                >
                  Register here
                </Link>
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center mt-4"
          >
            <Link
              href="/"
              className="link link-secondary text-sm hover:text-secondary-focus"
            >
              ← Back to Home
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal modal-open"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-box max-w-md relative"
            >
              <button
                onClick={closeForgotPasswordModal}
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10"
              >
                <FiX className="w-5 h-5" />
              </button>

              <h3 className="font-bold text-2xl mb-2 text-primary flex items-center gap-2">
                <FiLock className="w-6 h-6" />
                Reset Password
              </h3>
              <p className="text-base-content/70 mb-6">
                {forgotPasswordStep === 1 &&
                  "Enter your Student ID to receive an OTP"}
                {forgotPasswordStep === 2 && "Enter the OTP sent to your email"}
                {forgotPasswordStep === 3 && "Create your new password"}
              </p>

              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      forgotPasswordStep >= 1
                        ? "bg-primary text-primary-content"
                        : "bg-base-300 text-base-content"
                    }`}
                  >
                    1
                  </div>
                  <div
                    className={`w-12 h-1 ${
                      forgotPasswordStep >= 2 ? "bg-primary" : "bg-base-300"
                    }`}
                  ></div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      forgotPasswordStep >= 2
                        ? "bg-primary text-primary-content"
                        : "bg-base-300 text-base-content"
                    }`}
                  >
                    2
                  </div>
                  <div
                    className={`w-12 h-1 ${
                      forgotPasswordStep >= 3 ? "bg-primary" : "bg-base-300"
                    }`}
                  ></div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      forgotPasswordStep >= 3
                        ? "bg-primary text-primary-content"
                        : "bg-base-300 text-base-content"
                    }`}
                  >
                    3
                  </div>
                </div>
              </div>

              {resetError && (
                <div className="alert alert-error mb-4">
                  <FiAlertCircle className="w-5 h-5" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="alert alert-success mb-4">
                  <FiCheckCircle className="w-5 h-5" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              {/* Step 1: Enter Student ID */}
              {forgotPasswordStep === 1 && (
                <form onSubmit={handleSendOTP}>
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Student ID</span>
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="Enter your student ID"
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <FiMail className="w-4 h-4" />
                        Send OTP
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: Verify OTP */}
              {forgotPasswordStep === 2 && (
                <form onSubmit={handleVerifyOTP}>
                  <div className="bg-base-200 p-4 rounded-lg mb-4">
                    <p className="text-sm text-base-content/70">
                      OTP sent to: <strong>{maskedEmail}</strong>
                    </p>
                  </div>
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Enter OTP</span>
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="000000"
                      className="input input-bordered w-full text-center text-2xl tracking-widest font-mono"
                      maxLength="6"
                      required
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/70">
                        OTP is valid for 5 minutes
                      </span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotPasswordStep(1)}
                      className="btn btn-ghost flex-1"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                      disabled={resetLoading || otp.length !== 6}
                    >
                      {resetLoading ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          Verifying...
                        </>
                      ) : (
                        "Verify OTP"
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Reset Password */}
              {forgotPasswordStep === 3 && (
                <form onSubmit={handleResetPassword}>
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">
                        New Password
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="input input-bordered w-full pr-12"
                        required
                        minLength="6"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
                      >
                        {showNewPassword ? (
                          <FiEyeOff className="w-5 h-5" />
                        ) : (
                          <FiEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <label className="label">
                      <span className="label-text-alt text-base-content/70">
                        Must be at least 6 characters
                      </span>
                    </label>
                  </div>

                  <div className="form-control mb-6">
                    <label className="label">
                      <span className="label-text font-medium">
                        Confirm Password
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="input input-bordered w-full pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
                      >
                        {showConfirmPassword ? (
                          <FiEyeOff className="w-5 h-5" />
                        ) : (
                          <FiEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Resetting...
                      </>
                    ) : (
                      <>
                        <FiLock className="w-4 h-4" />
                        Reset Password
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
