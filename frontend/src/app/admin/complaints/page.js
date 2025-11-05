"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../../../components/AdminLayout";
import { getAuthHeaders } from "../../../utils/auth";
import { getAvatarImageUrl } from "../../../utils/profileImage";

export default function ComplaintManagement() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Helper function to format year properly
  const formatYear = (year) => {
    if (!year) return "N/A";
    const yearNum = parseInt(year);
    if (yearNum === 1) return "1st Year";
    if (yearNum === 2) return "2nd Year";
    if (yearNum === 3) return "3rd Year";
    if (yearNum === 4) return "4th Year";
    return `${yearNum}th Year`;
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/complaints`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("=== FRONTEND: Complaints loaded ===", data);
        setComplaints(data);
      } else {
        console.error("Failed to load complaints:", response.status);
      }
    } catch (error) {
      console.error("Error loading complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSolved = async (complaintId) => {
    try {
      setActionLoading(true);
      console.log("=== FRONTEND: Marking complaint as solved ===", complaintId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/complaints/${complaintId}/mark-solved`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        console.log(
          "=== FRONTEND: Complaint marked as solved successfully ==="
        );

        // Close modal and reset state
        setShowModal(false);
        setSelectedComplaint(null);

        // Reload complaints to get fresh data
        loadComplaints();
      } else {
        console.log("=== FRONTEND: Failed to mark complaint as solved ===");
        let errorMessage = "Failed to mark complaint as solved";
        const contentType = response.headers.get("content-type");

        try {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }

        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error marking complaint as solved:", error);
      alert("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "unsolved" && complaint.status === "Unsolved") ||
      (filter === "solved" && complaint.status === "Solved");

    const matchesSearch =
      searchTerm === "" ||
      complaint.student?.firstName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      complaint.student?.lastName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      complaint.student?.studentId
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      complaint.student?.session
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      complaint.complaintType
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      complaint.shortDescription
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Solved":
        return "text-success";
      case "Unsolved":
        return "text-warning";
      default:
        return "text-base-content";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Solved":
        return "badge-success";
      case "Unsolved":
        return "badge-warning";
      default:
        return "badge-ghost";
    }
  };

  const getComplaintTypeIcon = (type) => {
    switch (type) {
      case "Electrical":
        return "⚡";
      case "Plumber":
        return "🔧";
      case "Repair & Maintenance":
        return "🔨";
      default:
        return "📝";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-base-content">
              📝 Complaint Management
            </h1>
            <p className="text-base-content/70 mt-1">
              Manage and resolve student complaints
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {filteredComplaints.length}
            </div>
            <div className="text-sm text-base-content/70">
              {filter === "all"
                ? "Total"
                : filter === "unsolved"
                ? "Unsolved"
                : "Solved"}{" "}
              Complaints
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`btn btn-sm ${
                filter === "all" ? "btn-primary" : "btn-outline"
              }`}
            >
              All ({complaints.length})
            </button>
            <button
              onClick={() => setFilter("unsolved")}
              className={`btn btn-sm ${
                filter === "unsolved" ? "btn-warning" : "btn-outline"
              }`}
            >
              Unsolved (
              {complaints.filter((c) => c.status === "Unsolved").length})
            </button>
            <button
              onClick={() => setFilter("solved")}
              className={`btn btn-sm ${
                filter === "solved" ? "btn-success" : "btn-outline"
              }`}
            >
              Solved ({complaints.filter((c) => c.status === "Solved").length})
            </button>
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by student name, ID, session, complaint type, or description..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        ) : (
          <>
            {/* Complaints List */}
            <div className="space-y-4">
              <AnimatePresence>
                {filteredComplaints.map((complaint, index) => (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className="card-body">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Student Info */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className="avatar">
                            <div className="w-12 h-12 rounded-full">
                              <img
                                src={getAvatarImageUrl(
                                  complaint.student?.profileImageUrl
                                )}
                                alt="Student"
                                className="rounded-full"
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">
                                {complaint.student?.firstName}{" "}
                                {complaint.student?.lastName}
                              </h3>
                              <div
                                className={`badge ${getStatusBadge(
                                  complaint.status
                                )}`}
                              >
                                {complaint.status}
                              </div>
                            </div>
                            <div className="text-sm text-base-content/70 space-y-1">
                              <div className="flex flex-wrap gap-4">
                                <span>ID: {complaint.student?.studentId}</span>
                                <span>📧 {complaint.student?.email}</span>
                                <span>📞 {complaint.student?.phoneNumber}</span>
                              </div>
                              <div className="flex flex-wrap gap-4">
                                <span>🏢 {complaint.student?.department}</span>
                                <span>
                                  📚 {formatYear(complaint.student?.year)}
                                </span>
                                {complaint.student?.roomNo && (
                                  <span>
                                    🏠 Room {complaint.student?.roomNo}/
                                    {complaint.student?.block} (Bed{" "}
                                    {complaint.student?.bedNo})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Complaint Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">
                              {getComplaintTypeIcon(complaint.complaintType)}
                            </span>
                            <h4 className="font-semibold text-primary">
                              {complaint.complaintType}
                            </h4>
                          </div>
                          <p className="text-base-content/80 mb-2 line-clamp-2">
                            {complaint.shortDescription}
                          </p>
                          <div className="text-sm text-base-content/70 space-y-1">
                            <div>⏰ Occurred: {complaint.occurrenceTime}</div>
                            <div>
                              📅 Submitted:{" "}
                              {formatDate(complaint.submittedDate)}
                            </div>
                            {complaint.resolvedDate && (
                              <div className="text-success">
                                ✅ Resolved:{" "}
                                {formatDate(complaint.resolvedDate)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setShowModal(true);
                            }}
                            className="btn btn-sm btn-outline"
                          >
                            View Details
                          </button>
                          {complaint.status === "Unsolved" && (
                            <button
                              onClick={() => handleMarkAsSolved(complaint.id)}
                              className="btn btn-sm btn-success"
                              disabled={actionLoading}
                            >
                              {actionLoading ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                "Mark as Done"
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredComplaints.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold mb-2">
                    No Complaints Found
                  </h3>
                  <p className="text-base-content/70">
                    {filter === "all"
                      ? "No complaints have been submitted yet."
                      : `No ${filter} complaints found.`}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Complaint Details Modal */}
      <AnimatePresence>
        {showModal && selectedComplaint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            onClick={() => {
              setShowModal(false);
              setSelectedComplaint(null);
            }}
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
                  📝 Complaint Details
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedComplaint(null);
                  }}
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Student Information */}
                <div className="space-y-6">
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title text-lg mb-4">
                        👤 Student Information
                      </h4>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-full">
                            <img
                              src={getAvatarImageUrl(
                                selectedComplaint.student?.profileImageUrl
                              )}
                              alt="Student"
                              className="rounded-full"
                            />
                          </div>
                        </div>
                        <div>
                          <h5 className="font-semibold text-lg">
                            {selectedComplaint.student?.firstName}{" "}
                            {selectedComplaint.student?.lastName}
                          </h5>
                          <p className="text-base-content/70">
                            ID: {selectedComplaint.student?.studentId}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Email:</span>
                          <span>{selectedComplaint.student?.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Phone:</span>
                          <span>{selectedComplaint.student?.phoneNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Department:</span>
                          <span>{selectedComplaint.student?.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Year:</span>
                          <span>
                            {formatYear(selectedComplaint.student?.year)}
                          </span>
                        </div>
                        {selectedComplaint.student?.roomNo && (
                          <>
                            <div className="flex justify-between">
                              <span className="font-medium">Room:</span>
                              <span>
                                {selectedComplaint.student?.roomNo}/
                                {selectedComplaint.student?.block}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Bed:</span>
                              <span>{selectedComplaint.student?.bedNo}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complaint Information */}
                <div className="space-y-6">
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title text-lg mb-4">
                        📝 Complaint Information
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">
                              {getComplaintTypeIcon(
                                selectedComplaint.complaintType
                              )}
                            </span>
                            <span className="font-semibold">Type:</span>
                            <span className="font-medium text-primary">
                              {selectedComplaint.complaintType}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="font-semibold">Description:</span>
                          <p className="mt-1 p-3 bg-base-100 rounded-lg">
                            {selectedComplaint.shortDescription}
                          </p>
                        </div>

                        <div>
                          <span className="font-semibold">
                            Occurrence Time:
                          </span>
                          <p className="mt-1">
                            {selectedComplaint.occurrenceTime}
                          </p>
                        </div>

                        <div className="flex justify-between">
                          <span className="font-semibold">Status:</span>
                          <div
                            className={`badge ${getStatusBadge(
                              selectedComplaint.status
                            )}`}
                          >
                            {selectedComplaint.status}
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <span className="font-semibold">Submitted:</span>
                          <span>
                            {formatDate(selectedComplaint.submittedDate)}
                          </span>
                        </div>

                        {selectedComplaint.resolvedDate && (
                          <div className="flex justify-between">
                            <span className="font-semibold">Resolved:</span>
                            <span className="text-success">
                              {formatDate(selectedComplaint.resolvedDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedComplaint(null);
                  }}
                  className="btn btn-ghost"
                  disabled={actionLoading}
                >
                  Close
                </button>
                {selectedComplaint.status === "Unsolved" && (
                  <button
                    onClick={() => handleMarkAsSolved(selectedComplaint.id)}
                    className="btn btn-success"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Marking as Solved...
                      </>
                    ) : (
                      "Mark as Done"
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
