"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminLayout from "../../../components/AdminLayout";
import {
  FiMail,
  FiPhone,
  FiUser,
  FiEdit2,
  FiSave,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiLock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

export default function AdminAccountPage() {
  const [admin, setAdmin] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      console.log("Loading admin data...");
      console.log("Token:", token ? "Present" : "Missing");

      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/adminaccount/current`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to load admin data: ${response.status}`);
      }

      const data = await response.json();
      console.log("Admin data loaded:", data);

      setAdmin(data);
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
      });
    } catch (err) {
      console.error("Error loading admin data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: admin.firstName || "",
      lastName: admin.lastName || "",
      email: admin.email || "",
      phoneNumber: admin.phoneNumber || "",
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/adminaccount/${admin.id}/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data = await response.json();
      setAdmin(data.admin);
      setIsEditing(false);
      setSuccess("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

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

    try {
      setChangingPassword(true);
      setPasswordError("");

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/adminaccount/${admin.id}/change-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
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
          errorMessage.toLowerCase().includes("current password") ||
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
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-base-content/70">Loading admin profile...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !admin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="alert alert-error max-w-md">
            <FiAlertCircle className="w-6 h-6" />
            <span>{error}</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const getInitials = () => {
    if (!admin) return "A";
    const firstInitial = admin.firstName?.[0] || "";
    const lastInitial = admin.lastName?.[0] || "";
    return `${firstInitial}${lastInitial}`.toUpperCase() || "A";
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-base-200 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-base-content mb-2">
              Admin Profile
            </h1>
            <p className="text-base-content/70">
              Manage your account information
            </p>
          </motion.div>

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 flex"
            >
              <div className="card bg-base-100 shadow-xl w-full">
                <div className="card-body items-center text-center">
                  {/* Avatar */}
                  <div className="avatar placeholder mb-4">
                    <div className="bg-gradient-to-br from-primary to-secondary text-primary-content rounded-full w-32 h-32">
                      <span className="text-4xl font-bold">
                        {getInitials()}
                      </span>
                    </div>
                  </div>

                  <h2 className="card-title text-2xl">
                    {admin?.firstName} {admin?.lastName}
                  </h2>

                  {/* Hall Provost Badge */}
                  <div className="badge badge-primary badge-lg gap-2 mt-2">
                    <FiShield className="w-4 h-4" />
                    Hall Provost
                  </div>

                  <div className="divider"></div>

                  {/* Admin ID */}
                  <div className="w-full">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-base-content/70">Admin ID</span>
                      <span className="font-semibold">{admin?.adminId}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-base-content/70">Role</span>
                      <span className="badge badge-accent">Admin</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-base-content/70">Status</span>
                      <span className="badge badge-success">Active</span>
                    </div>
                  </div>

                  <div className="divider"></div>

                  {/* Member Since */}
                  <div className="text-sm text-base-content/70">
                    Member since{" "}
                    {admin?.createdDate
                      ? new Date(admin.createdDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            year: "numeric",
                          }
                        )
                      : "N/A"}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Edit Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 flex flex-col gap-6"
            >
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="card-title text-xl">Personal Information</h3>
                    {!isEditing ? (
                      <button
                        onClick={handleEdit}
                        className="btn btn-primary btn-sm gap-2"
                      >
                        <FiEdit2 className="w-4 h-4" />
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancel}
                          className="btn btn-ghost btn-sm gap-2"
                          disabled={saving}
                        >
                          <FiX className="w-4 h-4" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmit}
                          className="btn btn-primary btn-sm gap-2"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <span className="loading loading-spinner loading-xs"></span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <FiSave className="w-4 h-4" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* First Name */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          First Name
                        </span>
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="input input-bordered w-full pl-10"
                          required
                        />
                      </div>
                    </div>

                    {/* Last Name */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Last Name
                        </span>
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="input input-bordered w-full pl-10"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Email Address
                        </span>
                      </label>
                      <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="input input-bordered w-full pl-10"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Phone Number
                        </span>
                      </label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="input input-bordered w-full pl-10"
                          required
                        />
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Security Section */}
              <div className="card bg-base-100 shadow-xl">
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
              </div>
            </motion.div>
          </div>
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
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
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
    </AdminLayout>
  );
}
