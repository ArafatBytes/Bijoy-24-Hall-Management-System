"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  getCurrentUser,
  requireAuth,
  getAuthHeaders,
} from "../../../../utils/auth";
import { getAvatarImageUrl } from "../../../../utils/profileImage";
import StudentNavbar from "../../../../components/StudentNavbar";

export default function NewComplaint() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    complaintType: "",
    shortDescription: "",
    occurrenceTime: "",
  });

  const complaintTypes = [
    "Electrical",
    "Plumber",
    "Repair & Maintenance",
    "Others",
  ];

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
    if (
      !formData.complaintType ||
      !formData.shortDescription ||
      !formData.occurrenceTime
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/complaints`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        setSuccess(
          "Complaint submitted successfully! We will address your concern as soon as possible."
        );
        setFormData({
          complaintType: "",
          shortDescription: "",
          occurrenceTime: "",
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to submit complaint");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
          className="hero bg-gradient-to-r from-warning to-error rounded-lg text-white mb-8"
        >
          <div className="hero-content text-center py-12">
            <div>
              <h1 className="text-4xl font-bold mb-4">📝 Submit Complaint</h1>
              <p className="text-lg">
                Report issues, maintenance requests, or concerns to help us
                improve your hall experience
              </p>
            </div>
          </div>
        </motion.div>

        {/* Complaint Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-base-100 shadow-xl"
        >
          <div className="card-body">
            <h2 className="card-title text-2xl text-warning mb-6">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              Complaint Details
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
              {/* Complaint Type */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Type of Complaint <span className="text-error">*</span>
                  </span>
                </label>
                <select
                  name="complaintType"
                  value={formData.complaintType}
                  onChange={handleInputChange}
                  className="select select-bordered select-warning w-full"
                  required
                >
                  <option value="">Select Complaint Type</option>
                  {complaintTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

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
                  placeholder="Please describe the issue in detail..."
                  className="textarea textarea-bordered textarea-warning h-32 w-full"
                  required
                  rows="4"
                />
                <label className="label">
                  <span className="label-text-alt">
                    Be as specific as possible to help us resolve the issue
                    quickly
                  </span>
                </label>
              </div>

              {/* Occurrence Time */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Occurrence Time <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="occurrenceTime"
                  value={formData.occurrenceTime}
                  onChange={handleInputChange}
                  placeholder="e.g., Today 3:00 PM, Yesterday evening, This morning"
                  className="input input-bordered input-warning w-full"
                  required
                />
                <label className="label">
                  <span className="label-text-alt">
                    When did this issue occur?
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
                  className="btn btn-warning btn-lg"
                >
                  {submitting ? (
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
                      Submit Complaint
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
              What happens next?
            </h3>
            <div className="space-y-2">
              <p>
                • Your complaint will be reviewed by the hall administration
              </p>
              <p>
                • You'll receive an email notification once your complaint is
                resolved
              </p>
              <p>
                • You can track your complaint status in your complaint history
              </p>
              <p>
                • For urgent issues, please contact the hall office directly
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
