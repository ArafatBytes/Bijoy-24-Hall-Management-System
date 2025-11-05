"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  getCurrentUser,
  requireAuth,
  getAuthHeaders,
} from "../../../utils/auth";
import { getAvatarImageUrl } from "../../../utils/profileImage";
import StudentNavbar from "../../../components/StudentNavbar";

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [allocationStatus, setAllocationStatus] = useState({
    isAllocated: false,
    hasPendingRequest: false,
    pendingRequest: null,
  });
  const [stats, setStats] = useState({
    totalComplaints: 0,
    solvedComplaints: 0,
    unsolvedComplaints: 0,
    lastComplaint: null,
    pendingPayments: 0,
    roomNumber: "Not Assigned",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    if (!requireAuth("Student")) {
      return;
    }

    // Load student data
    loadStudentData();
    loadAllocationStatus();
    loadComplaintStats();
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

        // Load additional stats
        loadStats(studentData.id);
      } else if (response.status === 401) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (studentId) => {
    try {
      const token = localStorage.getItem("token");

      // Load complaints count
      const complaintsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/complaints/student/${studentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Load payments
      const paymentsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/student/${studentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (complaintsResponse.ok && paymentsResponse.ok) {
        const complaints = await complaintsResponse.json();
        const payments = await paymentsResponse.json();

        setStats({
          totalComplaints: complaints.length,
          pendingPayments: payments.filter((p) => p.status === "Pending")
            .length,
          roomNumber: "A-101", // This would come from room allotment data
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadAllocationStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/student-status`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const statusData = await response.json();
        console.log("Allocation status data:", statusData);
        setAllocationStatus(statusData);
      } else {
        console.error(
          "Failed to load allocation status:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error loading allocation status:", error);
    }
  };

  const loadComplaintStats = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/complaints/stats`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const complaintStats = await response.json();
        console.log("Complaint stats data:", complaintStats);
        setStats((prev) => ({
          ...prev,
          totalComplaints: complaintStats.totalComplaints,
          solvedComplaints: complaintStats.solvedComplaints,
          unsolvedComplaints: complaintStats.unsolvedComplaints,
          lastComplaint: complaintStats.lastComplaint,
        }));
      } else {
        console.error(
          "Failed to load complaint stats:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error loading complaint stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navigation */}
      <StudentNavbar student={student} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="hero bg-gradient-to-r from-primary to-secondary rounded-lg text-white mb-8">
          <div className="hero-content text-center py-12">
            <div>
              <h1 className="text-4xl font-bold">
                Welcome, {student?.firstName || "Student"}!
              </h1>
              <p className="py-6">
                Manage your Hall activities, submit complaints, track payments,
                and stay updated with your room details.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
          >
            <div className="card-body">
              <h2 className="card-title text-primary flex items-center gap-2">
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  ></path>
                </svg>
                Room Status
              </h2>
              {allocationStatus.isAllocated ? (
                <div>
                  <p className="text-lg font-bold text-primary">
                    {student.roomNo}/{student.block} (Bed {student.bedNo})
                  </p>
                  <div className="badge badge-success badge-sm">Allocated</div>
                </div>
              ) : allocationStatus.hasPendingRequest ? (
                <div>
                  <p className="text-base-content/70">
                    Requested: {allocationStatus.pendingRequest?.requestedRoom}{" "}
                    (Bed {allocationStatus.pendingRequest?.requestedBed})
                  </p>
                  <div className="badge badge-warning badge-sm">
                    Pending Approval
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-base-content/70">No Room Assigned</p>
                  <div className="badge badge-error badge-sm">
                    Not Allocated
                  </div>
                </div>
              )}
              <div className="card-actions justify-end">
                <Link href="/student/room" className="btn btn-primary btn-sm">
                  {allocationStatus.isAllocated
                    ? "View Details"
                    : allocationStatus.hasPendingRequest
                    ? "Manage Request"
                    : "Apply for Room"}
                </Link>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
          >
            <div className="card-body">
              <h2 className="card-title text-error flex items-center gap-2">
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
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  ></path>
                </svg>
                Blood Management
              </h2>
              <p className="text-base-content/70">
                Help save lives by requesting blood donations from fellow
                students
              </p>
              <div className="card-actions justify-end">
                <Link
                  href="/student/blood-management"
                  className="btn btn-error btn-sm"
                >
                  Request for Blood
                </Link>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
          >
            <div className="card-body">
              <h2 className="card-title text-accent flex items-center gap-2">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                Complaint Status
              </h2>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {stats.totalComplaints}
                  </div>
                  <div className="text-xs text-base-content/70">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {stats.solvedComplaints}
                  </div>
                  <div className="text-xs text-base-content/70">Solved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">
                    {stats.unsolvedComplaints}
                  </div>
                  <div className="text-xs text-base-content/70">Pending</div>
                </div>
              </div>
              {stats.lastComplaint && (
                <div className="mb-3">
                  <div className="text-sm text-base-content/70">
                    Last Complaint:
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {stats.lastComplaint.complaintType}
                    </span>
                    <div
                      className={`badge badge-sm ${
                        stats.lastComplaint.status === "Solved"
                          ? "badge-success"
                          : "badge-warning"
                      }`}
                    >
                      {stats.lastComplaint.status}
                    </div>
                  </div>
                </div>
              )}
              <div className="card-actions justify-end">
                <Link
                  href="/student/complaints/history"
                  className="btn btn-accent btn-sm"
                >
                  View History
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/student/complaints/new"
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
          >
            <div className="card-body items-center text-center">
              <div className="text-error text-4xl mb-2">📝</div>
              <h2 className="card-title">Submit Complaint</h2>
              <p>Report issues or maintenance requests</p>
            </div>
          </Link>

          <Link
            href="/student/payments"
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
          >
            <div className="card-body items-center text-center">
              <div className="text-success text-4xl mb-2">💳</div>
              <h2 className="card-title">View Payments</h2>
              <p>Check payment history and dues</p>
            </div>
          </Link>

          <Link
            href="/student/room"
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
          >
            <div className="card-body items-center text-center">
              <div className="text-info text-4xl mb-2">🏠</div>
              <h2 className="card-title">Room Details</h2>
              <p>View your room information</p>
            </div>
          </Link>

          <Link
            href="/student/profile"
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
          >
            <div className="card-body items-center text-center">
              <div className="text-warning text-4xl mb-2">👤</div>
              <h2 className="card-title">Update Profile</h2>
              <p>Manage your personal information</p>
            </div>
          </Link>

          <Link
            href="/student/gallery/add"
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
          >
            <div className="card-body items-center text-center">
              <div className="text-purple-500 text-4xl mb-2">📸</div>
              <h2 className="card-title">Add to Gallery</h2>
              <p>Share your memorable moments</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
