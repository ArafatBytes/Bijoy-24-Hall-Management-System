"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    studentId: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    guardianPhoneNumber: "",
    address: "",
    dateOfBirth: "",
    department: "",
    year: 1,
    session: "",
    bloodGroup: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const departments = ["CSE", "Law", "NFS", "ESDM", "BBA", "Agriculture"];

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const sessions = ["19-20", "20-21", "21-22", "22-23", "23-24", "24-25"];

  // Validation functions
  const validateStudentId = (studentId) => {
    const regex = /^\d{7}$/;
    return regex.test(studentId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate Student ID format
    if (!validateStudentId(formData.studentId)) {
      setError("Invalid Student ID format");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/student/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Registration successful! Redirecting to dashboard...");
        localStorage.setItem("token", data.token);
        localStorage.setItem("userType", data.userType);

        setTimeout(() => {
          window.location.href = "/student/dashboard";
        }, 2000);
      } else {
        setError(data.message || "Registration failed");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="card w-full max-w-4xl bg-base-100 shadow-2xl border border-base-300 relative z-10"
      >
        <div className="card-body p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-primary mb-2">
              Join Bijoy 24 Hall
            </h1>
            <p className="text-base-content/70 text-lg">
              Create your account to access hall management services
            </p>
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

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="alert alert-success mb-4 bg-success/10 border-success/20 text-success"
            >
              <span>{success}</span>
            </motion.div>
          )}

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                className="form-control"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="label">
                  <span className="label-text font-medium">Student ID</span>
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  placeholder=""
                  className="input input-bordered w-full focus:input-primary transition-all duration-300"
                  required
                />
              </motion.div>

              <motion.div
                className="form-control"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className="input input-bordered w-full focus:input-primary transition-all duration-300"
                  required
                />
              </motion.div>

              <motion.div
                className="form-control"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="label">
                  <span className="label-text font-medium">First Name</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name"
                  className="input input-bordered w-full focus:input-primary transition-all duration-300"
                  required
                />
              </motion.div>

              <motion.div
                className="form-control"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="label">
                  <span className="label-text font-medium">Last Name</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                  className="input input-bordered w-full focus:input-primary transition-all duration-300"
                  required
                />
              </motion.div>

              <motion.div
                className="form-control"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label className="label">
                  <span className="label-text font-medium">Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+880 1234 567890"
                  className="input input-bordered w-full focus:input-primary transition-all duration-300"
                  required
                />
              </motion.div>

              <motion.div
                className="form-control"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label className="label">
                  <span className="label-text font-medium">
                    Guardian Phone Number
                  </span>
                </label>
                <input
                  type="tel"
                  name="guardianPhoneNumber"
                  value={formData.guardianPhoneNumber}
                  onChange={handleInputChange}
                  placeholder="+880 1234 567890"
                  className="input input-bordered w-full focus:input-primary transition-all duration-300"
                />
              </motion.div>

              <motion.div
                className="form-control"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75 }}
              >
                <label className="label">
                  <span className="label-text font-medium">Date of Birth</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="input input-bordered w-full focus:input-primary transition-all duration-300"
                  required
                />
              </motion.div>

              <motion.div
                className="form-control"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <label className="label">
                  <span className="label-text font-medium">Department</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="select select-bordered w-full focus:select-primary transition-all duration-300"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </motion.div>

              <motion.div
                className="form-control"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <label className="label">
                  <span className="label-text font-medium">Year</span>
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="select select-bordered w-full focus:select-primary transition-all duration-300"
                  required
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </motion.div>

              <motion.div
                className="form-control"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.85 }}
              >
                <label className="label">
                  <span className="label-text font-medium">Session</span>
                </label>
                <select
                  name="session"
                  value={formData.session}
                  onChange={handleInputChange}
                  className="select select-bordered w-full focus:select-primary transition-all duration-300"
                  required
                >
                  <option value="">Select Session</option>
                  {sessions.map((session) => (
                    <option key={session} value={session}>
                      {session}
                    </option>
                  ))}
                </select>
              </motion.div>
            </div>

            {/* Blood Group Field */}
            <motion.div
              className="form-control"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <label className="label">
                <span className="label-text font-medium">Blood Group</span>
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleInputChange}
                className="select select-bordered w-full focus:select-primary transition-all duration-300"
                required
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </motion.div>

            <motion.div
              className="form-control"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95 }}
            >
              <label className="label">
                <span className="label-text font-medium">Address</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Your permanent address"
                className="textarea textarea-bordered w-full focus:textarea-primary transition-all duration-300"
                rows="3"
                required
              />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                className="form-control"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
              >
                <label className="label">
                  <span className="label-text font-medium">Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
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
              </motion.div>

              <motion.div
                className="form-control"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
              >
                <label className="label">
                  <span className="label-text font-medium">
                    Confirm Password
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="input input-bordered w-full pr-12 focus:input-primary transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="w-5 h-5" />
                    ) : (
                      <FiEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="form-control mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
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
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </motion.div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center mt-6"
          >
            <p className="text-sm text-base-content/70">
              Already have an account?{" "}
              <Link
                href="/login"
                className="link link-primary font-medium hover:text-primary-focus"
              >
                Sign in here
              </Link>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
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
    </div>
  );
}
