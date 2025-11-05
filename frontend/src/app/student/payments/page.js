"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  requireAuth,
  getCurrentUser,
  getAuthHeaders,
} from "../../../utils/auth";
import { getAvatarImageUrl } from "../../../utils/profileImage";
import StudentNavbar from "../../../components/StudentNavbar";

export default function PaymentsPage() {
  const [student, setStudent] = useState(null);
  const [currentDues, setCurrentDues] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: "", message: "" });

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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/current`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const studentData = await response.json();
        setStudent(studentData);
      }
    } catch (error) {
      console.error("Error loading student data:", error);
    }
  };

  useEffect(() => {
    // Check if returning from SSLCommerz
    const urlParams = new URLSearchParams(window.location.search);
    const valId = urlParams.get("val_id");
    const status = urlParams.get("status");

    if (valId && status) {
      handlePaymentReturn(valId, status);
    } else {
      fetchCurrentDues();
      fetchPaymentHistory();
    }
  }, []);

  const handlePaymentReturn = async (valId, status) => {
    const paymentId = sessionStorage.getItem("pendingPaymentId");

    // Clear session storage
    sessionStorage.removeItem("pendingPaymentId");
    sessionStorage.removeItem("pendingDuesPeriodId");

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);

    if (status === "VALID" || status === "VALIDATED") {
      // Payment already processed by IPN endpoint
      // Just show success and refresh data
      setModalContent({
        type: "success",
        message: "Payment successful! Your dues have been updated.",
      });
      setShowModal(true);

      // Wait a moment for IPN to complete, then refresh
      await new Promise((resolve) => setTimeout(resolve, 1000));
      fetchCurrentDues();
      fetchPaymentHistory();
    } else if (status === "FAILED") {
      setModalContent({
        type: "error",
        message: "Payment failed. Please try again.",
      });
      setShowModal(true);
      fetchCurrentDues();
      fetchPaymentHistory();
    } else if (status === "CANCELLED") {
      setModalContent({ type: "error", message: "Payment was cancelled." });
      setShowModal(true);
      fetchCurrentDues();
      fetchPaymentHistory();
    }
  };

  const fetchCurrentDues = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/dues/current`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentDues(data);
      }
    } catch (error) {
      console.error("Error fetching current dues:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
    }
  };

  const handlePayNow = async () => {
    if (!currentDues?.hasDues) return;

    setPaying(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/initiate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            duesPeriodId: currentDues.duesPeriod.id,
          }),
        }
      );

      const data = await response.json();

      // Log the response for debugging
      console.log("Payment initiation response:", data);
      console.log("gatewayPageURL:", data.gatewayPageURL);
      console.log("gatewayPageURL type:", typeof data.gatewayPageURL);

      if (response.ok && data.success) {
        // Validate gatewayPageURL before redirect
        if (
          !data.gatewayPageURL ||
          data.gatewayPageURL === "null" ||
          data.gatewayPageURL === ""
        ) {
          setModalContent({
            type: "error",
            message:
              "Payment gateway URL is invalid. Please contact administrator.",
          });
          setShowModal(true);
          setPaying(false);
          return;
        }

        // Store payment ID in session storage for validation after redirect
        sessionStorage.setItem("pendingPaymentId", data.paymentId);
        sessionStorage.setItem(
          "pendingDuesPeriodId",
          currentDues.duesPeriod.id
        );

        // Redirect to SSLCommerz payment gateway
        window.location.href = data.gatewayPageURL;
      } else {
        setModalContent({
          type: "error",
          message: data.message || "Failed to initiate payment",
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      setModalContent({
        type: "error",
        message: "An error occurred. Please try again.",
      });
      setShowModal(true);
    } finally {
      setPaying(false);
    }
  };

  const validatePayment = async (valId, paymentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/validate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            valId: valId,
            paymentId: paymentId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setModalContent({
          type: "success",
          message: "Payment successful! Your dues have been paid.",
        });
        setShowModal(true);
        fetchCurrentDues();
        fetchPaymentHistory();
      } else {
        setModalContent({
          type: "error",
          message: data.message || "Payment validation failed",
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error validating payment:", error);
      setModalContent({
        type: "error",
        message: "Payment validation failed. Please contact admin.",
      });
      setShowModal(true);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navbar */}
      <StudentNavbar student={student} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-base-content mb-2">
            Payment Management
          </h1>
          <p className="text-base-content/70">
            Manage your hall fees and view payment history
          </p>
        </motion.div>

        {/* Current Dues Card */}
        {loading ? (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-base-300 rounded w-3/4"></div>
                  <div className="h-4 bg-base-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ) : currentDues?.hasDues ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-base-100 shadow-xl mb-6"
          >
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-error/10 p-3 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-error"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="card-title text-error">Current Dues</h2>
                  <p className="text-sm text-base-content/70">
                    Payment required
                  </p>
                </div>
              </div>

              <div className="divider my-2"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-base-content/70">Period</p>
                  <p className="font-semibold text-base-content">
                    {formatDate(currentDues.duesPeriod.periodStart)} -{" "}
                    {formatDate(currentDues.duesPeriod.periodEnd)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-base-content/70">Amount Due</p>
                  <p className="font-bold text-2xl text-error">
                    ৳{currentDues.duesPeriod.amount}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-base-content/70">Status</p>
                  <span className="badge badge-error badge-lg">
                    {currentDues.duesPeriod.status}
                  </span>
                </div>
              </div>

              <div className="card-actions justify-end mt-6">
                <button
                  className="btn btn-primary"
                  onClick={handlePayNow}
                  disabled={paying}
                >
                  {paying ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      Pay Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-base-100 shadow-xl mb-6"
          >
            <div className="card-body">
              <div className="flex items-center gap-3">
                <div className="bg-success/10 p-3 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="card-title text-success">All Dues Paid</h2>
                  <p className="text-base-content/70">
                    You have no pending dues at the moment.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-base-100 shadow-xl"
        >
          <div className="card-body">
            <h2 className="card-title text-base-content mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Payment History
            </h2>

            {paymentHistory.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto mb-4 text-base-content/30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-base-content/70">
                  No payment history available
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Period</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Transaction ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id} className="hover">
                        <td>
                          {formatDate(payment.paidDate || payment.dueDate)}
                        </td>
                        <td>
                          {payment.periodStart && payment.periodEnd ? (
                            <span className="text-sm">
                              {formatDate(payment.periodStart)} -{" "}
                              {formatDate(payment.periodEnd)}
                            </span>
                          ) : (
                            <span className="text-base-content/50">N/A</span>
                          )}
                        </td>
                        <td className="font-semibold">৳{payment.amount}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-base-content/50"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                            {payment.paymentMethod || "N/A"}
                          </div>
                        </td>
                        <td>
                          <code className="text-xs bg-base-200 px-2 py-1 rounded">
                            {payment.transactionId || "N/A"}
                          </code>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              payment.status === "Paid"
                                ? "badge-success"
                                : payment.status === "Pending"
                                ? "badge-warning"
                                : "badge-error"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal modal-open"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-box"
            >
              <div className="text-center">
                {modalContent.type === "success" ? (
                  <div className="text-success mb-4">
                    <div className="bg-success/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="text-error mb-4">
                    <div className="bg-error/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2 text-base-content">
                  {modalContent.type === "success" ? "Success!" : "Error"}
                </h3>
                <p className="text-base-content/70 mb-6">
                  {modalContent.message}
                </p>
                <div className="modal-action justify-center">
                  <button
                    onClick={() => setShowModal(false)}
                    className="btn btn-primary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
