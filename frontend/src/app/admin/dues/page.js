"use client";
import { useState, useEffect } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";

export default function DuesManagementPage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, paid, pending, overdue
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAllDues();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter]);

  const fetchAllDues = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/admin/all-dues`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Error fetching dues:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.session?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => {
        const latestPeriod = s.duesPeriods[0]; // Already sorted by PeriodStart desc
        if (!latestPeriod) return false;

        if (statusFilter === "paid") {
          return latestPeriod.status === "Paid";
        } else if (statusFilter === "pending") {
          return (
            latestPeriod.status === "Pending" &&
            new Date(latestPeriod.periodEnd) >= new Date()
          );
        } else if (statusFilter === "overdue") {
          return (
            latestPeriod.status === "Pending" &&
            new Date(latestPeriod.periodEnd) < new Date()
          );
        }
        return true;
      });
    }

    setFilteredStudents(filtered);
  };

  const viewStudentDetails = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (period) => {
    if (!period) return <span className="badge badge-ghost">No Data</span>;

    if (period.status === "Paid") {
      return <span className="badge badge-success">Paid</span>;
    } else if (period.status === "Pending") {
      const isOverdue = new Date(period.periodEnd) < new Date();
      return isOverdue ? (
        <span className="badge badge-error">Overdue</span>
      ) : (
        <span className="badge badge-warning">Pending</span>
      );
    }
    return <span className="badge badge-ghost">{period.status}</span>;
  };

  const getTotalPaid = (student) => {
    return student.duesPeriods
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getTotalPending = (student) => {
    return student.duesPeriods
      .filter((p) => p.status === "Pending")
      .reduce((sum, p) => sum + p.amount, 0);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-base-content">
            Dues Management
          </h1>
          <div className="text-sm text-base-content/70">
            Total Students:{" "}
            <span className="font-semibold">{filteredStudents.length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Search</span>
                </label>
                <input
                  type="text"
                  placeholder="Search by name, student ID, session, or room..."
                  className="input input-bordered w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Status Filter
                  </span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Students</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Dues Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-base-content/50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto mb-4 opacity-50"
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
                <p className="text-lg">No students found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th className="bg-primary/10 text-base-content">
                        Student ID
                      </th>
                      <th className="bg-primary/10 text-base-content">Name</th>
                      <th className="bg-primary/10 text-base-content">Room</th>
                      <th className="bg-primary/10 text-base-content">
                        Current Period
                      </th>
                      <th className="bg-primary/10 text-base-content">
                        Amount
                      </th>
                      <th className="bg-primary/10 text-base-content">
                        Status
                      </th>
                      <th className="bg-primary/10 text-base-content">
                        Total Paid
                      </th>
                      <th className="bg-primary/10 text-base-content">
                        Total Pending
                      </th>
                      <th className="bg-primary/10 text-base-content">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => {
                      const latestPeriod = student.duesPeriods[0];
                      return (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <td className="font-mono text-sm">
                            {student.studentId}
                          </td>
                          <td className="font-semibold">{student.name}</td>
                          <td>{student.roomNumber || "Not Assigned"}</td>
                          <td className="text-sm">
                            {latestPeriod ? (
                              <>
                                {formatDate(latestPeriod.periodStart)} -<br />
                                {formatDate(latestPeriod.periodEnd)}
                              </>
                            ) : (
                              "No Period"
                            )}
                          </td>
                          <td className="font-semibold">
                            {latestPeriod ? `৳${latestPeriod.amount}` : "N/A"}
                          </td>
                          <td>{getStatusBadge(latestPeriod)}</td>
                          <td className="text-green-600 font-semibold">
                            ৳{getTotalPaid(student)}
                          </td>
                          <td className="text-red-600 font-semibold">
                            ৳{getTotalPending(student)}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => viewStudentDetails(student)}
                            >
                              View Details
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      <AnimatePresence>
        {showModal && selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-base-content">
                      {selectedStudent.name}
                    </h2>
                    <p className="text-base-content/70">
                      Student ID: {selectedStudent.studentId}
                    </p>
                    <p className="text-base-content/70">
                      Room: {selectedStudent.roomNumber || "Not Assigned"}
                    </p>
                    <p className="text-base-content/70">
                      Registration:{" "}
                      {formatDate(selectedStudent.registrationDate)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="btn btn-sm btn-circle btn-ghost"
                  >
                    ✕
                  </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="stat bg-success/10 rounded-lg border border-success/20">
                    <div className="stat-title text-success">Total Paid</div>
                    <div className="stat-value text-success">
                      ৳{getTotalPaid(selectedStudent)}
                    </div>
                  </div>
                  <div className="stat bg-error/10 rounded-lg border border-error/20">
                    <div className="stat-title text-error">Total Pending</div>
                    <div className="stat-value text-error">
                      ৳{getTotalPending(selectedStudent)}
                    </div>
                  </div>
                  <div className="stat bg-info/10 rounded-lg border border-info/20">
                    <div className="stat-title text-info">Total Periods</div>
                    <div className="stat-value text-info">
                      {selectedStudent.duesPeriods.length}
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                <h3 className="text-xl font-bold mb-4 text-base-content">
                  Payment History
                </h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr className="bg-base-200">
                        <th className="text-base-content">Period</th>
                        <th className="text-base-content">Amount</th>
                        <th className="text-base-content">Status</th>
                        <th className="text-base-content">Paid Date</th>
                        <th className="text-base-content">Transaction ID</th>
                        <th className="text-base-content">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.duesPeriods.map((period) => (
                        <tr key={period.id}>
                          <td className="text-sm">
                            {formatDate(period.periodStart)} -{" "}
                            {formatDate(period.periodEnd)}
                          </td>
                          <td className="font-semibold">৳{period.amount}</td>
                          <td>{getStatusBadge(period)}</td>
                          <td>{formatDate(period.paidDate)}</td>
                          <td className="font-mono text-sm">
                            {period.payment?.transactionId || "N/A"}
                          </td>
                          <td>{period.payment?.paymentMethod || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
