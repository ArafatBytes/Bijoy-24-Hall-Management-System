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

export default function ComplaintHistory() {
  const [student, setStudent] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    // Check authentication
    if (!requireAuth("Student")) {
      return;
    }

    // Load student data and complaints
    loadStudentData();
    loadComplaints(1);
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
    }
  };

  const loadComplaints = async (page) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/complaints/my-complaints?page=${page}&pageSize=${pageSize}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setComplaints(data.complaints);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
        setTotalComplaints(data.totalComplaints);
      } else {
        console.error("Failed to load complaints");
      }
    } catch (error) {
      console.error("Error loading complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      loadComplaints(page);
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

  const getStatusBadge = (status) => {
    return status === "Solved" ? "badge-success" : "badge-warning";
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

  if (loading && currentPage === 1) {
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero bg-gradient-to-r from-accent to-primary rounded-lg text-white mb-8"
        >
          <div className="hero-content text-center py-12">
            <div>
              <h1 className="text-4xl font-bold mb-4">
                📋 Your Complaint History
              </h1>
              <p className="text-lg">
                Track all your submitted complaints and their resolution status
              </p>
              <div className="stats stats-horizontal bg-white/20 backdrop-blur-sm rounded-lg mt-6">
                <div className="stat">
                  <div className="stat-title text-white/80">
                    Total Complaints
                  </div>
                  <div className="stat-value text-white">{totalComplaints}</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-white/80">Current Page</div>
                  <div className="stat-value text-white">
                    {currentPage} of {totalPages}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <Link href="/student/complaints/new" className="btn btn-primary">
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              New Complaint
            </Link>
          </div>

          {loading && (
            <div className="loading loading-spinner loading-md text-primary"></div>
          )}
        </div>

        {/* Complaints Grid */}
        {complaints.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-base-100 shadow-xl"
          >
            <div className="card-body text-center py-16">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold mb-4">No Complaints Found</h2>
              <p className="text-base-content/70 mb-6">
                You haven't submitted any complaints yet. If you have any issues
                or concerns, feel free to submit a complaint.
              </p>
              <Link href="/student/complaints/new" className="btn btn-primary">
                Submit Your First Complaint
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.map((complaint, index) => (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {getComplaintTypeIcon(complaint.complaintType)}
                      </span>
                      <h3 className="card-title text-lg">
                        {complaint.complaintType}
                      </h3>
                    </div>
                    <div
                      className={`badge ${getStatusBadge(complaint.status)}`}
                    >
                      {complaint.status}
                    </div>
                  </div>

                  <p className="text-base-content/80 mb-4 line-clamp-3">
                    {complaint.shortDescription}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-base-content/60"
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
                      <span className="text-base-content/70">
                        Occurred: {complaint.occurrenceTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-base-content/60"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1.5 1.5M14 7l1.5 1.5"
                        ></path>
                      </svg>
                      <span className="text-base-content/70">
                        Submitted: {formatDate(complaint.submittedDate)}
                      </span>
                    </div>

                    {complaint.resolvedDate && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-success"
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
                        <span className="text-success">
                          Resolved: {formatDate(complaint.resolvedDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mt-8"
          >
            <div className="join">
              <button
                className="join-item btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                «
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    className={`join-item btn ${
                      currentPage === pageNum ? "btn-active" : ""
                    }`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                className="join-item btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
