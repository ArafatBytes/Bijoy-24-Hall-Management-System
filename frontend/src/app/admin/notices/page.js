"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../../../components/AdminLayout";
import { getAuthHeaders } from "../../../utils/auth";

export default function NoticeManagement() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Form states
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Success/Error modal states
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalType, setResultModalType] = useState("success"); // "success" or "error"
  const [resultModalTitle, setResultModalTitle] = useState("");
  const [resultModalMessage, setResultModalMessage] = useState("");

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notices/admin`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotices(data);
      } else {
        console.error("Failed to load notices:", response.status);
        setNotices([]);
      }
    } catch (error) {
      console.error("Error loading notices:", error);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  const showResultMessage = (type, title, message) => {
    setResultModalType(type);
    setResultModalTitle(title);
    setResultModalMessage(message);
    setShowResultModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!validTypes.includes(file.type)) {
        showResultMessage(
          "error",
          "Invalid File Type",
          "Please select a valid image (JPG, PNG) or PDF file"
        );
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showResultMessage(
          "error",
          "File Too Large",
          "File size should not exceed 5MB"
        );
        return;
      }
      setAttachmentFile(file);
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "student_profiles");

    const folder =
      file.type === "application/pdf"
        ? "hall_management/notices/pdfs"
        : "hall_management/notices/images";
    formData.append("folder", folder);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${
          process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
        }/${file.type === "application/pdf" ? "raw" : "image"}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          url: data.secure_url,
          fileName: file.name,
          type: file.type.includes("pdf") ? "pdf" : "image",
        };
      }
      return null;
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      return null;
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();

    if (!subject.trim() || !description.trim()) {
      showResultMessage(
        "error",
        "Missing Information",
        "Please fill in all required fields"
      );
      return;
    }

    try {
      setActionLoading(true);
      setUploading(true);

      let attachmentData = null;

      // Upload file to Cloudinary if attachment exists
      if (attachmentFile) {
        attachmentData = await uploadToCloudinary(attachmentFile);
        if (!attachmentData) {
          showResultMessage(
            "error",
            "Upload Failed",
            "Failed to upload attachment. Please try again."
          );
          setActionLoading(false);
          setUploading(false);
          return;
        }
      }

      const noticeData = {
        subject: subject.trim(),
        description: description.trim(),
        attachmentUrl: attachmentData?.url || null,
        attachmentFileName: attachmentData?.fileName || null,
        attachmentType: attachmentData?.type || null,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notices`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(noticeData),
        }
      );

      if (response.ok) {
        // Reset form
        setSubject("");
        setDescription("");
        setAttachmentFile(null);
        setShowModal(false);

        // Reload notices
        loadNotices();
        showResultMessage(
          "success",
          "Notice Created",
          "The notice has been created successfully and is now visible to all students!"
        );
      } else {
        const errorData = await response.json();
        showResultMessage(
          "error",
          "Creation Failed",
          errorData.message || "Failed to create notice. Please try again."
        );
      }
    } catch (error) {
      console.error("Error creating notice:", error);
      showResultMessage(
        "error",
        "Network Error",
        "Failed to create notice. Please check your connection and try again."
      );
    } finally {
      setActionLoading(false);
      setUploading(false);
    }
  };

  const handleViewNotice = (notice) => {
    setSelectedNotice(notice);
    setShowViewModal(true);
  };

  const confirmDeleteNotice = (noticeId) => {
    setNoticeToDelete(noticeId);
    setShowDeleteModal(true);
  };

  const handleDeleteNotice = async () => {
    if (!noticeToDelete) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notices/${noticeToDelete}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      setShowDeleteModal(false);
      setNoticeToDelete(null);

      if (response.ok) {
        loadNotices();
        showResultMessage(
          "success",
          "Notice Deleted",
          "The notice has been deleted successfully!"
        );
      } else {
        showResultMessage(
          "error",
          "Deletion Failed",
          "Failed to delete notice. Please try again."
        );
      }
    } catch (error) {
      console.error("Error deleting notice:", error);
      setShowDeleteModal(false);
      setNoticeToDelete(null);
      showResultMessage(
        "error",
        "Network Error",
        "Failed to delete notice. Please check your connection and try again."
      );
    }
  };

  const filteredNotices = notices.filter((notice) =>
    notice.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout activeTab="notices">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-base-100 shadow-sm border-b border-base-300 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-base-content">
              Notice Management
            </h1>
            <p className="text-base-content/70 mt-1">
              Create and manage notices for students
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Total Notices</div>
                <div className="stat-value text-primary">{notices.length}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Actions Bar */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="form-control w-full max-w-xs">
                  <input
                    type="text"
                    placeholder="Search notices..."
                    className="input input-bordered w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn btn-primary"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    ></path>
                  </svg>
                  Create New Notice
                </button>
              </div>
            </div>
          </div>

          {/* Notices Table */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="loading loading-spinner loading-lg text-primary"></div>
                </div>
              ) : filteredNotices.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-base-content/70">No notices found</p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th className="w-[200px]">Subject</th>
                        <th className="w-[250px]">Description</th>
                        <th className="w-[150px]">Attachment</th>
                        <th className="w-[180px]">Created Date</th>
                        <th className="w-[100px]">Total Reads</th>
                        <th className="w-[120px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNotices.map((notice) => (
                        <motion.tr
                          key={notice.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover"
                        >
                          <td>
                            <div className="font-semibold max-w-[200px] truncate">
                              {notice.subject}
                            </div>
                          </td>
                          <td>
                            <div className="max-w-[250px] truncate text-sm opacity-70">
                              {notice.description}
                            </div>
                          </td>
                          <td>
                            {notice.attachmentUrl ? (
                              <div className="flex items-center gap-2 max-w-[150px]">
                                {notice.attachmentType === "pdf" ? (
                                  <svg
                                    className="w-5 h-5 text-error flex-shrink-0"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-5 h-5 text-success flex-shrink-0"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M4 3h12l2 2v12l-2 2H4l-2-2V5l2-2z" />
                                  </svg>
                                )}
                                <span className="text-xs truncate">
                                  {notice.attachmentFileName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm opacity-50">None</span>
                            )}
                          </td>
                          <td>
                            <div className="text-sm">
                              {formatDate(notice.createdDate)}
                            </div>
                          </td>
                          <td>
                            <div className="badge badge-primary">
                              {notice.totalReads}
                            </div>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewNotice(notice)}
                                className="btn btn-sm btn-ghost"
                                title="View"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  ></path>
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  ></path>
                                </svg>
                              </button>
                              <button
                                onClick={() => confirmDeleteNotice(notice.id)}
                                className="btn btn-sm btn-ghost text-error"
                                title="Delete"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  ></path>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Create Notice Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !actionLoading && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-base-300">
                <h2 className="text-2xl font-bold">Create New Notice</h2>
                <p className="text-sm text-base-content/70 mt-1">
                  Fill in the details below to create a new notice
                </p>
              </div>

              <form onSubmit={handleCreateNotice} className="p-6 space-y-4">
                {/* Subject */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Subject <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter notice subject"
                    className="input input-bordered w-full"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    disabled={actionLoading}
                  />
                </div>

                {/* Description */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Description <span className="text-error">*</span>
                    </span>
                  </label>
                  <textarea
                    placeholder="Enter notice description or message body"
                    className="textarea textarea-bordered h-32"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    disabled={actionLoading}
                  ></textarea>
                </div>

                {/* Attachment */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Attachment (Optional)
                    </span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="file-input file-input-bordered w-full"
                    onChange={handleFileChange}
                    disabled={actionLoading}
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      Supported formats: JPG, PNG, PDF (Max 5MB)
                    </span>
                  </label>
                  {attachmentFile && (
                    <div className="mt-2 p-3 bg-base-200 rounded-lg flex items-center justify-between">
                      <span className="text-sm">{attachmentFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachmentFile(null)}
                        className="btn btn-sm btn-ghost btn-circle"
                        disabled={actionLoading}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-ghost flex-1"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        {uploading ? "Uploading..." : "Creating..."}
                      </>
                    ) : (
                      "Create Notice"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Notice Modal */}
      <AnimatePresence>
        {showViewModal && selectedNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-base-300">
                <h2 className="text-2xl font-bold">{selectedNotice.subject}</h2>
                <p className="text-sm text-base-content/70 mt-1">
                  Posted on {formatDate(selectedNotice.createdDate)}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description:</h3>
                  <p className="text-base-content/80 whitespace-pre-wrap">
                    {selectedNotice.description}
                  </p>
                </div>

                {selectedNotice.attachmentUrl && (
                  <div>
                    <h3 className="font-semibold mb-2">Attachment:</h3>
                    {selectedNotice.attachmentType === "pdf" ? (
                      <a
                        href={selectedNotice.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
                        </svg>
                        View PDF
                      </a>
                    ) : (
                      <img
                        src={selectedNotice.attachmentUrl}
                        alt="Notice attachment"
                        className="max-w-full rounded-lg shadow-md"
                      />
                    )}
                  </div>
                )}

                <div className="pt-4">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="btn btn-primary w-full"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-error/10 rounded-full mb-4">
                  <svg
                    className="w-6 h-6 text-error"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-center mb-2">
                  Delete Notice?
                </h3>
                <p className="text-center text-base-content/70 mb-6">
                  Are you sure you want to delete this notice? This action
                  cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="btn btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteNotice}
                    className="btn btn-error flex-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success/Error Result Modal */}
      <AnimatePresence>
        {showResultModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowResultModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div
                  className={`flex items-center justify-center w-16 h-16 mx-auto rounded-full mb-4 ${
                    resultModalType === "success"
                      ? "bg-success/10"
                      : "bg-error/10"
                  }`}
                >
                  {resultModalType === "success" ? (
                    <svg
                      className="w-8 h-8 text-success"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-8 h-8 text-error"
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
                  )}
                </div>
                <h3 className="text-2xl font-bold text-center mb-3">
                  {resultModalTitle}
                </h3>
                <p className="text-center text-base-content/70 mb-6">
                  {resultModalMessage}
                </p>
                <button
                  onClick={() => setShowResultModal(false)}
                  className={`btn w-full ${
                    resultModalType === "success" ? "btn-success" : "btn-error"
                  }`}
                >
                  {resultModalType === "success" ? "Great!" : "Try Again"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
