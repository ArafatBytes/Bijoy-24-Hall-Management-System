"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../../../components/AdminLayout";
import { getAuthHeaders } from "../../../utils/auth";
import { getAvatarImageUrl } from "../../../utils/profileImage";

export default function GalleryManagement() {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [galleryToDelete, setGalleryToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

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
    loadGalleryRequests();
  }, []);

  const loadGalleryRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gallery`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("=== FRONTEND: Gallery requests loaded ===", data);
        setGalleries(data);
      } else {
        console.error("Failed to load gallery requests:", response.status);
      }
    } catch (error) {
      console.error("Error loading gallery requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (galleryId) => {
    try {
      setActionLoading(true);
      console.log("=== FRONTEND: Approving gallery request ===", galleryId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gallery/${galleryId}/approve`,
        {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminResponse:
              adminResponse || "Your gallery request has been approved!",
          }),
        }
      );

      if (response.ok) {
        console.log("=== FRONTEND: Gallery request approved successfully ===");

        // Close modal and reset state
        setShowModal(false);
        setSelectedGallery(null);
        setAdminResponse("");

        // Reload gallery requests to get fresh data
        loadGalleryRequests();
      } else {
        console.log("=== FRONTEND: Failed to approve gallery request ===");
        let errorMessage = "Failed to approve gallery request";
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
      console.error("Error approving gallery request:", error);
      alert("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (galleryId) => {
    try {
      setActionLoading(true);
      console.log("=== FRONTEND: Rejecting gallery request ===", galleryId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gallery/${galleryId}/reject`,
        {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminResponse:
              adminResponse || "Your gallery request has been rejected.",
          }),
        }
      );

      if (response.ok) {
        console.log("=== FRONTEND: Gallery request rejected successfully ===");

        // Close modal and reset state
        setShowModal(false);
        setSelectedGallery(null);
        setAdminResponse("");

        // Reload gallery requests to get fresh data
        loadGalleryRequests();
      } else {
        console.log("=== FRONTEND: Failed to reject gallery request ===");
        let errorMessage = "Failed to reject gallery request";
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
      console.error("Error rejecting gallery request:", error);
      alert("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (gallery) => {
    setGalleryToDelete(gallery);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!galleryToDelete) return;

    try {
      setActionLoading(true);
      setShowDeleteConfirm(false);
      console.log(
        "=== FRONTEND: Deleting gallery request ===",
        galleryToDelete.id
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gallery/${galleryToDelete.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        console.log("=== FRONTEND: Gallery request deleted successfully ===");

        // Close modal and reset state
        setShowModal(false);
        setSelectedGallery(null);
        setGalleryToDelete(null);

        // Show success modal
        setModalMessage("Gallery request has been deleted successfully!");
        setShowSuccessModal(true);

        // Reload gallery requests to get fresh data
        loadGalleryRequests();
      } else {
        console.log("=== FRONTEND: Failed to delete gallery request ===");
        let errorMessage = "Failed to delete gallery request";
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

        setModalMessage(`Error: ${errorMessage}`);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error deleting gallery request:", error);
      setModalMessage("Network error. Please try again.");
      setShowErrorModal(true);
    } finally {
      setActionLoading(false);
      setGalleryToDelete(null);
    }
  };

  const filteredGalleries = galleries.filter((gallery) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && gallery.status === "Pending") ||
      (filter === "approved" && gallery.status === "Approved") ||
      (filter === "rejected" && gallery.status === "Rejected");

    const matchesSearch =
      searchTerm === "" ||
      gallery.student?.firstName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      gallery.student?.lastName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      gallery.student?.studentId
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      gallery.student?.session
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      gallery.shortDescription
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      gallery.timeOfEvent?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "text-success";
      case "Rejected":
        return "text-error";
      case "Pending":
        return "text-warning";
      default:
        return "text-base-content";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return "badge-success";
      case "Rejected":
        return "badge-error";
      case "Pending":
        return "badge-warning";
      default:
        return "badge-ghost";
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
              📸 Gallery Management
            </h1>
            <p className="text-base-content/70 mt-1">
              Review and manage student gallery submissions
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {filteredGalleries.length}
            </div>
            <div className="text-sm text-base-content/70">
              {filter === "all"
                ? "Total"
                : filter.charAt(0).toUpperCase() + filter.slice(1)}{" "}
              Requests
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
              All ({galleries.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`btn btn-sm ${
                filter === "pending" ? "btn-warning" : "btn-outline"
              }`}
            >
              Pending ({galleries.filter((g) => g.status === "Pending").length})
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`btn btn-sm ${
                filter === "approved" ? "btn-success" : "btn-outline"
              }`}
            >
              Approved (
              {galleries.filter((g) => g.status === "Approved").length})
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`btn btn-sm ${
                filter === "rejected" ? "btn-error" : "btn-outline"
              }`}
            >
              Rejected (
              {galleries.filter((g) => g.status === "Rejected").length})
            </button>
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by student name, ID, session, description, or event..."
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
            {/* Gallery Requests List */}
            <div className="space-y-4">
              <AnimatePresence>
                {filteredGalleries.map((gallery, index) => (
                  <motion.div
                    key={gallery.id}
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
                                  gallery.student?.profileImageUrl
                                )}
                                alt="Student"
                                className="rounded-full"
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">
                                {gallery.student?.firstName}{" "}
                                {gallery.student?.lastName}
                              </h3>
                              <div
                                className={`badge ${getStatusBadge(
                                  gallery.status
                                )}`}
                              >
                                {gallery.status}
                              </div>
                            </div>
                            <div className="text-sm text-base-content/70 space-y-1">
                              <div className="flex flex-wrap gap-4">
                                <span>ID: {gallery.student?.studentId}</span>
                                <span>📧 {gallery.student?.email}</span>
                                <span>📞 {gallery.student?.phoneNumber}</span>
                              </div>
                              <div className="flex flex-wrap gap-4">
                                <span>🏢 {gallery.student?.department}</span>
                                <span>
                                  📚 {formatYear(gallery.student?.year)}
                                </span>
                                {gallery.student?.roomNo && (
                                  <span>
                                    🏠 Room {gallery.student?.roomNo}/
                                    {gallery.student?.block} (Bed{" "}
                                    {gallery.student?.bedNo})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Gallery Info */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className="avatar">
                            <div className="w-16 h-16 rounded-lg overflow-hidden">
                              <img
                                src={gallery.imageUrl}
                                alt="Gallery"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-purple-600 mb-1">
                              📸 Gallery Submission
                            </h4>
                            <p className="text-base-content/80 mb-2 line-clamp-2">
                              {gallery.shortDescription}
                            </p>
                            <div className="text-sm text-base-content/70 space-y-1">
                              <div>🎉 Event: {gallery.timeOfEvent}</div>
                              <div>
                                📅 Submitted:{" "}
                                {formatDate(gallery.submittedDate)}
                              </div>
                              {gallery.reviewedDate && (
                                <div className="text-success">
                                  ✅ Reviewed:{" "}
                                  {formatDate(gallery.reviewedDate)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setSelectedGallery(gallery);
                              setShowModal(true);
                            }}
                            className="btn btn-sm btn-outline"
                          >
                            View Details
                          </button>
                          {gallery.status === "Pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(gallery.id)}
                                className="btn btn-sm btn-success"
                                disabled={actionLoading}
                              >
                                {actionLoading ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                  "Approve"
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(gallery.id)}
                                className="btn btn-sm btn-error"
                                disabled={actionLoading}
                              >
                                {actionLoading ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                  "Reject"
                                )}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteClick(gallery)}
                            className="btn btn-sm btn-outline btn-error"
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              "Delete"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredGalleries.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📸</div>
                  <h3 className="text-xl font-semibold mb-2">
                    No Gallery Requests Found
                  </h3>
                  <p className="text-base-content/70">
                    {filter === "all"
                      ? "No gallery requests have been submitted yet."
                      : `No ${filter} gallery requests found.`}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Gallery Details Modal */}
      <AnimatePresence>
        {showModal && selectedGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            onClick={() => {
              setShowModal(false);
              setSelectedGallery(null);
              setAdminResponse("");
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
                  📸 Gallery Request Details
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedGallery(null);
                    setAdminResponse("");
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
                                selectedGallery.student?.profileImageUrl
                              )}
                              alt="Student"
                              className="rounded-full"
                            />
                          </div>
                        </div>
                        <div>
                          <h5 className="font-semibold text-lg">
                            {selectedGallery.student?.firstName}{" "}
                            {selectedGallery.student?.lastName}
                          </h5>
                          <p className="text-base-content/70">
                            ID: {selectedGallery.student?.studentId}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Email:</span>
                          <span>{selectedGallery.student?.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Phone:</span>
                          <span>{selectedGallery.student?.phoneNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Department:</span>
                          <span>{selectedGallery.student?.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Year:</span>
                          <span>
                            {formatYear(selectedGallery.student?.year)}
                          </span>
                        </div>
                        {selectedGallery.student?.roomNo && (
                          <>
                            <div className="flex justify-between">
                              <span className="font-medium">Room:</span>
                              <span>
                                {selectedGallery.student?.roomNo}/
                                {selectedGallery.student?.block}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Bed:</span>
                              <span>{selectedGallery.student?.bedNo}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gallery Information */}
                <div className="space-y-6">
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title text-lg mb-4">
                        📸 Gallery Information
                      </h4>

                      {/* Image Display - Emphasized */}
                      <div className="mb-6 text-center">
                        <img
                          src={selectedGallery.imageUrl}
                          alt="Gallery"
                          className="max-w-full max-h-96 object-contain rounded-lg shadow-lg mx-auto"
                          style={{ aspectRatio: "auto" }}
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <span className="font-semibold">Description:</span>
                          <p className="mt-1 p-3 bg-base-100 rounded-lg">
                            {selectedGallery.shortDescription}
                          </p>
                        </div>

                        <div>
                          <span className="font-semibold">Time of Event:</span>
                          <p className="mt-1">{selectedGallery.timeOfEvent}</p>
                        </div>

                        <div className="flex justify-between">
                          <span className="font-semibold">Status:</span>
                          <div
                            className={`badge ${getStatusBadge(
                              selectedGallery.status
                            )}`}
                          >
                            {selectedGallery.status}
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <span className="font-semibold">Submitted:</span>
                          <span>
                            {formatDate(selectedGallery.submittedDate)}
                          </span>
                        </div>

                        {selectedGallery.reviewedDate && (
                          <div className="flex justify-between">
                            <span className="font-semibold">Reviewed:</span>
                            <span className="text-success">
                              {formatDate(selectedGallery.reviewedDate)}
                            </span>
                          </div>
                        )}

                        {selectedGallery.adminResponse && (
                          <div>
                            <span className="font-semibold">
                              Admin Response:
                            </span>
                            <p className="mt-1 p-3 bg-base-100 rounded-lg">
                              {selectedGallery.adminResponse}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Response Input */}
              {selectedGallery.status === "Pending" && (
                <div className="mt-6">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Admin Response (Optional)
                    </span>
                  </label>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Add a message for the student..."
                    className="textarea textarea-bordered w-full h-24"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedGallery(null);
                    setAdminResponse("");
                  }}
                  className="btn btn-ghost"
                  disabled={actionLoading}
                >
                  Close
                </button>
                {selectedGallery.status === "Pending" && (
                  <>
                    <button
                      onClick={() => handleReject(selectedGallery.id)}
                      className="btn btn-error"
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Rejecting...
                        </>
                      ) : (
                        "Reject"
                      )}
                    </button>
                    <button
                      onClick={() => handleApprove(selectedGallery.id)}
                      className="btn btn-success"
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Approving...
                        </>
                      ) : (
                        "Approve"
                      )}
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDeleteClick(selectedGallery)}
                  className="btn btn-outline btn-error"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && galleryToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4"
            onClick={() => {
              setShowDeleteConfirm(false);
              setGalleryToDelete(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-base-100 rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold text-error mb-4">
                  Confirm Deletion
                </h3>
                <p className="text-base-content/80 mb-2">
                  Are you sure you want to delete this gallery request?
                </p>
                <div className="bg-base-200 p-4 rounded-lg mb-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={galleryToDelete.imageUrl}
                      alt="Gallery"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="text-left">
                      <p className="font-semibold">
                        {galleryToDelete.student?.firstName}{" "}
                        {galleryToDelete.student?.lastName}
                      </p>
                      <p className="text-sm text-base-content/70">
                        {galleryToDelete.shortDescription.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-error font-semibold mb-6">
                  This action cannot be undone!
                </p>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setGalleryToDelete(null);
                    }}
                    className="btn btn-ghost"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="btn btn-error"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Deleting...
                      </>
                    ) : (
                      "Yes, Delete"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-base-100 rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-success mb-4">
                  Success!
                </h3>
                <p className="text-base-content/80 mb-6">{modalMessage}</p>

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="btn btn-success"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <AnimatePresence>
        {showErrorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4"
            onClick={() => setShowErrorModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-base-100 rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">❌</div>
                <h3 className="text-2xl font-bold text-error mb-4">Error</h3>
                <p className="text-base-content/80 mb-6">{modalMessage}</p>

                <button
                  onClick={() => setShowErrorModal(false)}
                  className="btn btn-error"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
