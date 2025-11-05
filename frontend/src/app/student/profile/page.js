"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  getCurrentUser,
  requireAuth,
  getAuthHeaders,
} from "../../../utils/auth";
import { uploadImageToCloudinary } from "../../../utils/cloudinary";
import {
  getAvatarImageUrl,
  getProfilePageImageUrl,
} from "../../../utils/profileImage";
import StudentNavbar from "../../../components/StudentNavbar";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

export default function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    guardianPhoneNumber: "",
    address: "",
    department: "",
    year: 1,
    session: "",
    bloodGroup: "",
    profileImageUrl: "",
    studentId: "",
    dateOfBirth: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const departments = ["CSE", "Law", "NFS", "ESDM", "BBA", "Agriculture"];

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const sessions = ["19-20", "20-21", "21-22", "22-23", "23-24", "24-25"];

  useEffect(() => {
    if (!requireAuth("Student")) {
      return;
    }
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      // Get current student using JWT token
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/current`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const studentData = await response.json();
        setStudent(studentData);

        // Format date of birth for input field
        const formattedDateOfBirth = studentData.dateOfBirth
          ? new Date(studentData.dateOfBirth).toISOString().split("T")[0]
          : "";

        setFormData({
          firstName: studentData.firstName || "",
          lastName: studentData.lastName || "",
          email: studentData.email || "",
          phoneNumber: studentData.phoneNumber || "",
          guardianPhoneNumber: studentData.guardianPhoneNumber || "",
          address: studentData.address || "",
          department: studentData.department || "",
          year: studentData.year || 1,
          session: studentData.session || "",
          bloodGroup: studentData.bloodGroup || "",
          profileImageUrl: studentData.profileImageUrl || "",
          studentId: studentData.studentId || "",
          dateOfBirth: formattedDateOfBirth,
        });
      } else if (response.status === 401) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error loading student data:", error);
      setError("Failed to load profile data");
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const result = await uploadImageToCloudinary(file);
      if (result.success) {
        setFormData({
          ...formData,
          profileImageUrl: result.url,
        });
        setSuccess("Image uploaded successfully!");
      } else {
        setError(result.error || "Failed to upload image");
      }
    } catch (error) {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!student) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/${student.id}/profile`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            guardianPhoneNumber: formData.guardianPhoneNumber,
            address: formData.address,
            department: formData.department,
            year: formData.year,
            session: formData.session,
            bloodGroup: formData.bloodGroup,
            profileImageUrl: formData.profileImageUrl,
            dateOfBirth: formData.dateOfBirth,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setStudent(result.student);
        setSuccess("Profile updated successfully!");
      } else if (response.status === 401) {
        removeTokenFromStorage();
        window.location.href = "/login";
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    // Validate password length
    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    setChangingPassword(true);

    try {
      if (!student) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/${student.id}/change-password`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            oldPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        }
      );

      if (!response.ok) {
        // Read response once and handle both JSON and text
        let errorMessage = "Current password does not match";

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const data = await response.json();
            errorMessage = data.message || data.title || errorMessage;
          } catch (e) {
            // Keep default message if JSON parsing fails
          }
        } else {
          try {
            const text = await response.text();
            if (text) {
              errorMessage = text;
            }
          } catch (e) {
            // Keep default message if text reading fails
          }
        }

        // Normalize error messages related to incorrect password
        if (
          errorMessage.toLowerCase().includes("old password") ||
          errorMessage.toLowerCase().includes("incorrect") ||
          errorMessage.toLowerCase().includes("password is incorrect")
        ) {
          errorMessage = "Current password does not match";
        }

        throw new Error(errorMessage);
      }

      // Success
      const data = await response.json();
      setSuccess("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error changing password:", err);
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordError(""); // Clear error on input change
  };

  const openPasswordModal = () => {
    setShowPasswordModal(true);
    setPasswordError("");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordError("");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/70">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navigation */}
      <StudentNavbar student={student} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="alert alert-success mb-6"
            >
              <FiCheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="alert alert-error mb-6"
            >
              <FiAlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="card bg-base-100 shadow-xl mb-8"
          >
            <div className="card-body text-center py-12">
              <div className="relative inline-block group">
                <div
                  className="avatar cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 relative overflow-hidden">
                    <img
                      src={getProfilePageImageUrl(formData.profileImageUrl)}
                      alt="Profile"
                      className="rounded-full w-full h-full object-cover transition-all duration-300 group-hover:brightness-75"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-xs py-2 px-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                      {uploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="loading loading-spinner loading-xs"></div>
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <span>Edit Image</span>
                      )}
                    </div>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <h2 className="text-3xl font-bold text-primary mt-6">
                {student?.firstName} {student?.lastName}
              </h2>
              <p className="text-lg text-base-content/70 mb-3">
                Student ID: {student?.studentId}
              </p>
              <div className="flex justify-center">
                <div className="badge badge-primary badge-lg">
                  {student?.department}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card bg-base-100 shadow-xl"
          >
            <div className="card-body">
              <h3 className="card-title text-2xl mb-6">
                Edit Profile Information
              </h3>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="alert alert-error mb-4"
                >
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="alert alert-success mb-4"
                >
                  <span>{success}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="input input-bordered bg-base-200 text-base-content/70 cursor-not-allowed"
                      disabled
                      readOnly
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        Student ID cannot be changed
                      </span>
                    </label>
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
                      className="input input-bordered focus:input-primary transition-all duration-300"
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
                      className="input input-bordered focus:input-primary transition-all duration-300"
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
                      className="input input-bordered focus:input-primary transition-all duration-300"
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
                      <span className="label-text font-medium">
                        Date of Birth
                      </span>
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="input input-bordered focus:input-primary transition-all duration-300"
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
                        Phone Number
                      </span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="input input-bordered focus:input-primary transition-all duration-300"
                      required
                    />
                  </motion.div>

                  <motion.div
                    className="form-control"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.75 }}
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
                      className="input input-bordered focus:input-primary transition-all duration-300"
                      placeholder="Optional"
                    />
                  </motion.div>

                  <motion.div
                    className="form-control"
                    initial={{ opacity: 0, x: 20 }}
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
                      className="select select-bordered focus:select-primary transition-all duration-300"
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
                    initial={{ opacity: 0, x: -20 }}
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
                      className="select select-bordered focus:select-primary transition-all duration-300"
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
                    transition={{ delay: 0.75 }}
                  >
                    <label className="label">
                      <span className="label-text font-medium">Session</span>
                    </label>
                    <select
                      name="session"
                      value={formData.session}
                      onChange={handleInputChange}
                      className="select select-bordered focus:select-primary transition-all duration-300"
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

                  <motion.div
                    className="form-control"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <label className="label">
                      <span className="label-text font-medium">
                        Blood Group
                      </span>
                    </label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      className="select select-bordered focus:select-primary transition-all duration-300"
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
                </div>

                <motion.div
                  className="form-control"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <label className="label">
                    <span className="label-text font-medium">Address</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered focus:textarea-primary transition-all duration-300"
                    rows="3"
                    required
                  />
                </motion.div>

                <motion.div
                  className="flex justify-end gap-4 pt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <Link href="/student/dashboard" className="btn btn-outline">
                    Cancel
                  </Link>
                  <motion.button
                    type="submit"
                    className={`btn btn-primary px-8 ${
                      saving ? "loading" : ""
                    }`}
                    disabled={saving || uploading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </motion.button>
                </motion.div>
              </form>
            </div>
          </motion.div>

          {/* Security Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card bg-base-100 shadow-xl mt-8"
          >
            <div className="card-body">
              <h3 className="card-title text-xl mb-4">Security</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Password</p>
                  <p className="text-sm text-base-content/70">
                    Change your account password
                  </p>
                </div>
                <button
                  onClick={openPasswordModal}
                  className="btn btn-outline btn-primary gap-2"
                >
                  <FiLock className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Change Password</h3>

            {passwordError && (
              <div className="alert alert-error mb-4">
                <FiAlertCircle className="w-5 h-5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Current Password</span>
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    className="input input-bordered w-full pl-10 pr-12"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
                  >
                    {showCurrentPassword ? (
                      <FiEyeOff className="w-5 h-5" />
                    ) : (
                      <FiEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">New Password</span>
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    className="input input-bordered w-full pl-10 pr-12"
                    placeholder="Enter new password"
                    required
                    minLength={6}
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
                  <span className="label-text">Confirm New Password</span>
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    className="input input-bordered w-full pl-10 pr-12"
                    placeholder="Confirm new password"
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
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="btn btn-ghost"
                  disabled={changingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={changingPassword}
                >
                  {changingPassword ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
