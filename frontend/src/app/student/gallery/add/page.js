"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  getCurrentUser,
  requireAuth,
  getAuthHeaders,
} from "../../../../utils/auth";
import { getAvatarImageUrl } from "../../../../utils/profileImage";
import StudentNavbar from "../../../../components/StudentNavbar";

export default function AddToGallery() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [galleryHistory, setGalleryHistory] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [formData, setFormData] = useState({
    imageUrl: "",
    shortDescription: "",
    timeOfEvent: "",
  });

  useEffect(() => {
    // Check authentication
    if (!requireAuth("Student")) {
      return;
    }

    // Load student data
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
      } else {
        console.error("Failed to load student data");
      }
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadGalleryHistory = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gallery/my-galleries`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGalleryHistory(data);
      } else {
        console.error("Failed to load gallery history");
      }
    } catch (error) {
      console.error("Error loading gallery history:", error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "hall_gallery"); // You'll need to create this preset in Cloudinary
    formData.append("cloud_name", "dnx5rfyyx");

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dnx5rfyyx/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.secure_url;
      } else {
        throw new Error("Failed to upload image");
      }
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate required fields
    if (!selectedImage || !formData.shortDescription || !formData.timeOfEvent) {
      setError("Please fill in all required fields and select an image");
      return;
    }

    setSubmitting(true);
    setUploading(true);

    try {
      // Upload image to Cloudinary
      const imageUrl = await uploadToCloudinary(selectedImage);

      setUploading(false);

      // Submit gallery request
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gallery`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            imageUrl: imageUrl,
          }),
        }
      );

      if (response.ok) {
        setSuccess(
          "Gallery request submitted successfully! Your submission will be reviewed by the administration."
        );
        setFormData({
          imageUrl: "",
          shortDescription: "",
          timeOfEvent: "",
        });
        setSelectedImage(null);
        setImagePreview("");

        // Reset file input
        const fileInput = document.getElementById("imageFile");
        if (fileInput) fileInput.value = "";
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to submit gallery request");
      }
    } catch (error) {
      console.error("Error submitting gallery request:", error);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleViewHistory = async () => {
    await loadGalleryHistory();
    setShowHistory(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return "badge-success";
      case "Rejected":
        return "badge-error";
      default:
        return "badge-warning";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navigation */}
      <StudentNavbar student={student} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white mb-8"
        >
          <div className="hero-content text-center py-12">
            <div>
              <h1 className="text-4xl font-bold mb-4">
                📸 Share Your Memories
              </h1>
              <p className="text-lg">
                Add your special moments to our hall gallery and let everyone
                celebrate with you!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleViewHistory}
            className="btn btn-outline btn-primary"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            View History
          </button>
        </div>

        {/* Gallery Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-base-100 shadow-xl"
        >
          <div className="card-body">
            <h2 className="card-title text-2xl text-purple-600 mb-6">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              Gallery Submission
            </h2>

            {/* Success/Error Messages */}
            {success && (
              <div className="alert alert-success mb-6">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                {success}
              </div>
            )}

            {error && (
              <div className="alert alert-error mb-6">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Upload Image <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="file"
                  id="imageFile"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input file-input-bordered file-input-primary w-full"
                  required
                />
                <label className="label">
                  <span className="label-text-alt">
                    Supported formats: JPG, PNG, GIF (Max 10MB)
                  </span>
                </label>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Preview</span>
                  </label>
                  <div className="flex justify-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-md max-h-64 object-cover rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              )}

              {/* Short Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Short Description <span className="text-error">*</span>
                  </span>
                </label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Describe this memorable moment..."
                  className="textarea textarea-bordered textarea-primary h-32 w-full"
                  required
                  rows="4"
                />
                <label className="label">
                  <span className="label-text-alt">
                    Tell us what makes this moment special
                  </span>
                </label>
              </div>

              {/* Time of Event */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Time of Event <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="timeOfEvent"
                  value={formData.timeOfEvent}
                  onChange={handleInputChange}
                  placeholder="e.g., Cultural Night 2024, Freshers Welcome, Sports Day"
                  className="input input-bordered input-primary w-full"
                  required
                />
                <label className="label">
                  <span className="label-text-alt">
                    When did this event take place?
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
                <Link
                  href="/student/dashboard"
                  className="btn btn-ghost btn-lg"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-lg"
                >
                  {uploading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Uploading Image...
                    </>
                  ) : submitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        ></path>
                      </svg>
                      Submit to Gallery
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card bg-info text-info-content shadow-xl mt-8"
        >
          <div className="card-body">
            <h3 className="card-title">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              Submission Guidelines
            </h3>
            <div className="space-y-2">
              <p>
                • Your submission will be reviewed by the hall administration
              </p>
              <p>
                • Only appropriate and hall-related content will be approved
              </p>
              <p>
                • You&apos;ll receive an email notification about the status
              </p>
              <p>
                • Approved images will be featured in our official hall gallery
              </p>
              <p>• Please ensure you have permission to share the image</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gallery History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-base-100 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-primary">
                  📸 Your Gallery History
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="btn btn-ghost btn-circle"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>

              {galleryHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📸</div>
                  <h3 className="text-xl font-semibold mb-2">
                    No Gallery Submissions
                  </h3>
                  <p className="text-base-content/70">
                    You haven&apos;t submitted any gallery requests yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {galleryHistory.map((gallery, index) => (
                    <motion.div
                      key={gallery.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="card bg-base-200 shadow-lg"
                    >
                      <figure className="px-4 pt-4">
                        <img
                          src={gallery.imageUrl}
                          alt="Gallery"
                          className="rounded-lg w-full max-h-48 object-contain bg-base-100"
                        />
                      </figure>
                      <div className="card-body">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">Gallery Submission</h4>
                          <div
                            className={`badge ${getStatusBadge(
                              gallery.status
                            )}`}
                          >
                            {gallery.status}
                          </div>
                        </div>
                        <p className="text-sm text-base-content/80 mb-3">
                          {gallery.shortDescription}
                        </p>
                        <div className="text-xs text-base-content/70 space-y-1">
                          <div>📅 Event: {gallery.timeOfEvent}</div>
                          <div>
                            📤 Submitted: {formatDate(gallery.submittedDate)}
                          </div>
                          {gallery.reviewedDate && (
                            <div>
                              ✅ Reviewed: {formatDate(gallery.reviewedDate)}
                            </div>
                          )}
                          {gallery.adminResponse && (
                            <div className="mt-2 p-2 bg-base-100 rounded text-sm">
                              <strong>Admin Response:</strong>{" "}
                              {gallery.adminResponse}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
