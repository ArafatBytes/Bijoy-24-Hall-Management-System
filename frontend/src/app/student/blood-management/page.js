"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  getCurrentUser,
  requireAuth,
  getAuthHeaders,
} from "../../../utils/auth";
import { getAvatarImageUrl } from "../../../utils/profileImage";
import StudentNavbar from "../../../components/StudentNavbar";

export default function BloodManagement() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    bloodGroupNeeded: "",
    place: "",
    time: "",
    specialNotes: "",
  });

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

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
    if (!formData.bloodGroupNeeded || !formData.place || !formData.time) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bloodrequest`,
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
          "Blood request sent successfully! Potential donors will be notified via email."
        );
        setFormData({
          bloodGroupNeeded: "",
          place: "",
          time: "",
          specialNotes: "",
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to send blood request");
      }
    } catch (error) {
      console.error("Error sending blood request:", error);
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
          className="hero bg-gradient-to-r from-error to-warning rounded-lg text-white mb-8"
        >
          <div className="hero-content text-center py-12">
            <div>
              <h1 className="text-4xl font-bold mb-4">
                🩸 Blood Donation Request
              </h1>
              <p className="text-lg">
                Help save lives by connecting with fellow students who can
                donate blood in times of need
              </p>
            </div>
          </div>
        </motion.div>

        {/* Blood Request Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-base-100 shadow-xl"
        >
          <div className="card-body">
            <h2 className="card-title text-2xl text-error mb-6">
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
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                ></path>
              </svg>
              Request Blood Donation
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
              {/* Blood Group Needed */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Blood Group Needed <span className="text-error">*</span>
                  </span>
                </label>
                <select
                  name="bloodGroupNeeded"
                  value={formData.bloodGroupNeeded}
                  onChange={handleInputChange}
                  className="select select-bordered select-error w-full"
                  required
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              {/* Place */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Place/Location <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="place"
                  value={formData.place}
                  onChange={handleInputChange}
                  placeholder="e.g., Dhaka Medical College Hospital, Emergency Ward"
                  className="input input-bordered input-error w-full"
                  required
                />
              </div>

              {/* Time */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Time/Date Needed <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  placeholder="e.g., Today 3:00 PM, Tomorrow Morning, 25th December 2024"
                  className="input input-bordered input-error w-full"
                  required
                />
              </div>

              {/* Special Notes */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Special Notes (Optional)
                  </span>
                </label>
                <textarea
                  name="specialNotes"
                  value={formData.specialNotes}
                  onChange={handleInputChange}
                  placeholder="Any additional information, urgency level, or special requirements..."
                  className="textarea textarea-bordered textarea-error h-24 w-full"
                  rows="3"
                />
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
                  className="btn btn-error btn-lg"
                >
                  {submitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Sending Request...
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
                      Send Blood Request
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
              How it works
            </h3>
            <div className="space-y-2">
              <p>• Fill out the blood request form with required details</p>
              <p>
                • All students with matching blood group will receive an email
                notification
              </p>
              <p>
                • Potential donors can contact you directly using your provided
                contact information
              </p>
              <p>
                • Your request helps create a life-saving connection within our
                student community
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
