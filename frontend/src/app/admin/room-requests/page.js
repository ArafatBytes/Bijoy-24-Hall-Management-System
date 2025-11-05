"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../../../components/AdminLayout";
import RoomLayoutDisplay from "../../../components/RoomLayoutDisplay";
import RoomLayout from "../../../components/RoomLayout";
import { getAuthHeaders } from "../../../utils/auth";

export default function RoomRequestsManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [roomLayout, setRoomLayout] = useState(null);
  const [roomLayoutLoading, setRoomLayoutLoading] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningTitle, setWarningTitle] = useState("");
  const [showAdminAllocation, setShowAdminAllocation] = useState(false);
  const [adminSelectedFloor, setAdminSelectedFloor] = useState(null);
  const [adminSelectedBlock, setAdminSelectedBlock] = useState(null);
  const [adminSelectedRoom, setAdminSelectedRoom] = useState(null);
  const [adminSelectedBed, setAdminSelectedBed] = useState(null);
  const [adminRoomAvailability, setAdminRoomAvailability] = useState({});
  const [adminRoomLayout, setAdminRoomLayout] = useState(null);
  const [loadingAdminRooms, setLoadingAdminRooms] = useState(false);
  const [showAllocationConfirm, setShowAllocationConfirm] = useState(false);
  const [confirmAllocationData, setConfirmAllocationData] = useState(null);
  const [adminAllocationNotes, setAdminAllocationNotes] = useState("");
  const [showAdminRoomLayout, setShowAdminRoomLayout] = useState(false);
  const [approvedToday, setApprovedToday] = useState(0);

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
    loadRoomRequests();
    loadApprovedTodayCount();
  }, []);

  // Admin room selection functions
  const loadAdminRoomAvailability = async (floor, block) => {
    try {
      setLoadingAdminRooms(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/availability/${floor}/${block}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAdminRoomAvailability(data);
      } else {
        console.error(
          "Failed to load admin room availability:",
          response.status
        );
        setAdminRoomAvailability({});
      }
    } catch (error) {
      console.error("Error loading admin room availability:", error);
      setAdminRoomAvailability({});
    } finally {
      setLoadingAdminRooms(false);
    }
  };

  const loadAdminRoomLayout = async (block, roomNo) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/room-layout/${block}/${roomNo}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const layoutData = await response.json();
        setAdminRoomLayout(layoutData);
      } else {
        console.error("Failed to load admin room layout:", response.status);
        setAdminRoomLayout(null);
      }
    } catch (error) {
      console.error("Error loading admin room layout:", error);
      setAdminRoomLayout(null);
    }
  };

  const handleAdminAllocation = async (bedNo) => {
    try {
      setActionLoading(true);

      // Use admin notes from the allocation modal
      const adminNotes = adminAllocationNotes;

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/allocate-by-admin/${selectedRequest.id}`;
      console.log("=== FRONTEND: Admin allocation starting ===");
      console.log("Admin allocation URL:", url);
      console.log("Selected request ID:", selectedRequest.id);
      console.log("Admin selected floor:", adminSelectedFloor);
      console.log("Admin selected block:", adminSelectedBlock);
      console.log("Admin selected room:", adminSelectedRoom);
      console.log("Bed number:", bedNo);
      console.log("Admin notes:", adminNotes);

      const requestBody = {
        Block: adminSelectedBlock,
        RoomNo: adminSelectedRoom,
        BedNo: bedNo,
        AdminNotes: adminNotes,
      };

      console.log("Admin allocation request body:", requestBody);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (response.ok) {
        console.log("=== FRONTEND: Admin allocation successful ===");
        const responseData = await response.json();
        console.log("Response data:", responseData);
        // Update local state
        setRequests((prev) =>
          prev.map((req) =>
            req.id === selectedRequest.id
              ? { ...req, status: "Approved", adminNotes: adminNotes }
              : req
          )
        );

        setShowModal(false);
        setSelectedRequest(null);
        setShowAdminAllocation(false);

        // Reset admin selection state
        setAdminSelectedFloor(null);
        setAdminSelectedBlock(null);
        setAdminSelectedRoom(null);
        setAdminSelectedBed(null);
        setAdminRoomAvailability({});
        setAdminRoomLayout(null);
        setShowAdminRoomLayout(false);
        setAdminAllocationNotes("");

        // Reload requests to get fresh data
        loadRoomRequests();
        loadApprovedTodayCount();
      } else {
        console.log("=== FRONTEND: Admin allocation failed ===");
        let errorMessage = "Failed to allocate room";
        const contentType = response.headers.get("content-type");

        try {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            console.log("Error response data:", errorData);
            errorMessage = errorData.message || errorData.title || errorMessage;
          } else {
            const errorText = await response.text();
            console.log("Error response text:", errorText);
            errorMessage =
              errorText ||
              `Server error (${response.status}): ${response.statusText}`;
          }
        } catch (parseError) {
          console.log("Error parsing response:", parseError);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }

        setWarningTitle("Failed to Allocate Room");
        setWarningMessage(errorMessage);
        setShowWarningModal(true);
      }
    } catch (error) {
      console.error("Error with admin allocation:", error);
      setWarningTitle("Network Error");
      setWarningMessage(
        "Failed to allocate room. Please check your connection and try again."
      );
      setShowWarningModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const loadRoomLayout = async (block, roomNo) => {
    try {
      setRoomLayoutLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/room-layout/${block}/${roomNo}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const layoutData = await response.json();
        console.log("Room layout data received:", layoutData);
        console.log("Roommates data:", layoutData.roommates);
        setRoomLayout(layoutData);
      } else {
        console.error("Failed to load room layout:", response.status);
        setRoomLayout(null);
      }
    } catch (error) {
      console.error("Error loading room layout:", error);
      setRoomLayout(null);
    } finally {
      setRoomLayoutLoading(false);
    }
  };

  const loadApprovedTodayCount = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/stats`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const statsData = await response.json();
        setApprovedToday(statsData.approvedToday || 0);
      }
    } catch (error) {
      console.error("Error loading approved today count:", error);
    }
  };

  const loadRoomRequests = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/admin/requests`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Transform the data to match the expected format
        const transformedData = data.map((request) => ({
          id: request.id,
          studentId: request.studentId,
          studentName: request.studentName,
          firstName: request.firstName,
          lastName: request.lastName,
          email: request.email,
          phone: request.phone,
          address: request.address,
          department: request.department,
          year: request.year,
          session: request.session,
          bloodGroup: request.bloodGroup,
          profileImageUrl: request.profileImageUrl,
          registrationDate: request.registrationDate,
          requestedRoom: request.requestedRoom,
          requestedBlock: request.requestedBlock,
          requestedBed: request.requestedBed,
          currentRoom: request.currentRoom,
          currentBedNo: request.currentBedNo,
          isRoomChange: request.isRoomChange,
          status: request.status,
          requestDate: request.requestDate,
          studentNotes: request.studentNotes,
          adminNotes: request.adminNotes,
          priority: request.priority,
        }));

        setRequests(transformedData);
      } else {
        console.error("Failed to load room requests:", response.status);
        setRequests([]); // Set empty array on error
      }
    } catch (error) {
      console.error("Error loading room requests:", error);
      setRequests([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action, notes = "") => {
    try {
      setActionLoading(true);

      // Get admin notes from textarea if available
      const textarea = document.querySelector(
        'textarea[placeholder="Add admin notes..."]'
      );
      const adminNotes = textarea ? textarea.value : notes;

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/admin-action/${requestId}`;
      const requestBody = {
        action: action,
        adminNotes: adminNotes,
      };

      console.log("Making API request:", {
        url,
        method: "POST",
        body: requestBody,
        headers: getAuthHeaders(),
      });

      console.log("Request ID:", requestId, "Action:", action);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status, response.statusText);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        const data = await response.json();

        // Update local state
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  status: action === "approve" ? "Approved" : "Rejected",
                  adminNotes: notes,
                }
              : req
          )
        );

        setShowModal(false);
        setSelectedRequest(null);

        // Reload requests to get fresh data
        loadRoomRequests();
        loadApprovedTodayCount();
      } else {
        let errorMessage = `Failed to ${action} request`;

        // Check content type to determine how to parse the response
        const contentType = response.headers.get("content-type");
        console.log("Error response content-type:", contentType);

        try {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            console.error(`Error ${action}ing request (JSON):`, errorData);
            errorMessage = errorData.message || errorData.title || errorMessage;
          } else {
            // Handle as text response
            const errorText = await response.text();
            console.error(`Error ${action}ing request (Text):`, errorText);
            errorMessage =
              errorText ||
              `Server error (${response.status}): ${response.statusText}`;
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }

        // Show warning modal instead of alert
        setWarningTitle(
          `Failed to ${action === "approve" ? "Approve" : "Reject"} Request`
        );
        setWarningMessage(errorMessage);
        setShowWarningModal(true);
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      setWarningTitle("Network Error");
      setWarningMessage(
        `Failed to ${action} request. Please check your connection and try again.`
      );
      setShowWarningModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesFilter =
      filter === "all" || request.status.toLowerCase() === filter.toLowerCase();
    const matchesSearch =
      request.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.studentId.includes(searchTerm) ||
      request.requestedRoom.includes(searchTerm) ||
      (request.session &&
        request.session.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: "badge-warning",
      Approved: "badge-success",
      Rejected: "badge-error",
      "Under Review": "badge-info",
    };
    return statusConfig[status] || "badge-neutral";
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      High: "badge-error",
      Normal: "badge-neutral",
      Low: "badge-ghost",
    };
    return priorityConfig[priority] || "badge-neutral";
  };

  return (
    <AdminLayout activeTab="room-requests">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-base-100 shadow-sm border-b border-base-300 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-base-content">
              Room Allotment Requests
            </h1>
            <p className="text-base-content/70 mt-1">
              Manage and approve student room allocation requests
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Pending</div>
                <div className="stat-value text-warning">
                  {requests.filter((r) => r.status === "Pending").length}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Approved Today</div>
                <div className="stat-value text-success">{approvedToday}</div>
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
          {/* Filters and Search */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {["all", "pending", "approved", "rejected"].map(
                    (filterOption) => (
                      <button
                        key={filterOption}
                        onClick={() => setFilter(filterOption)}
                        className={`btn btn-sm ${
                          filter === filterOption
                            ? "btn-primary"
                            : "btn-outline"
                        }`}
                      >
                        {filterOption.charAt(0).toUpperCase() +
                          filterOption.slice(1)}
                        {filterOption !== "all" && (
                          <span className="badge badge-sm ml-2">
                            {
                              requests.filter(
                                (r) =>
                                  filterOption === "all" ||
                                  r.status.toLowerCase() === filterOption
                              ).length
                            }
                          </span>
                        )}
                      </button>
                    )
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="form-control">
                    <input
                      type="text"
                      placeholder="Search students, ID, session, or room..."
                      className="input input-bordered w-full max-w-md"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="loading loading-spinner loading-lg text-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Student Details</th>
                        <th>Requested Room</th>
                        <th>Current Status</th>
                        <th>Priority</th>
                        <th>Request Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => (
                        <motion.tr
                          key={request.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover"
                        >
                          <td>
                            <div className="flex items-center space-x-3">
                              <div className="avatar">
                                <div className="mask mask-squircle w-12 h-12">
                                  {request.profileImageUrl ? (
                                    <img
                                      src={request.profileImageUrl}
                                      alt={request.studentName}
                                      className="w-12 h-12 object-cover"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-primary text-primary-content rounded-lg flex items-center justify-center font-bold">
                                      {request.studentName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="font-bold">
                                  {request.studentName}
                                </div>
                                <div className="text-sm opacity-50">
                                  ID: {request.studentId}
                                </div>
                                <div className="text-sm opacity-50">
                                  {request.department} - Year {request.year}
                                </div>
                                <div className="text-sm opacity-50">
                                  {request.email}
                                </div>
                                <div className="text-sm opacity-50">
                                  📞 {request.phone}
                                </div>
                                {request.bloodGroup && (
                                  <div className="text-xs badge badge-outline badge-sm mt-1">
                                    🩸 {request.bloodGroup}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-bold">
                                  Room {request.requestedRoom}/
                                  {request.requestedBlock}
                                </div>
                                <div className="text-sm opacity-50">
                                  Bed {request.requestedBed}
                                </div>
                                {request.currentRoom && (
                                  <div className="text-sm text-info">
                                    Current: {request.currentRoom}
                                  </div>
                                )}
                              </div>
                              {request.isRoomChange && (
                                <div className="badge badge-warning badge-sm">
                                  Room Change
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div
                              className={`badge ${getStatusBadge(
                                request.status
                              )}`}
                            >
                              {request.status}
                            </div>
                          </td>
                          <td>
                            <div
                              className={`badge badge-sm ${getPriorityBadge(
                                request.priority
                              )}`}
                            >
                              {request.priority}
                            </div>
                          </td>
                          <td>
                            <div className="text-sm">
                              {new Date(
                                request.requestDate
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-xs opacity-50">
                              {new Date(
                                request.requestDate
                              ).toLocaleTimeString()}
                            </div>
                          </td>
                          <td>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowModal(true);
                                  // Load room layout for the requested room
                                  loadRoomLayout(
                                    request.requestedBlock,
                                    request.requestedRoom
                                  );
                                }}
                                className="btn btn-info btn-xs"
                              >
                                View
                              </button>
                              {request.status === "Pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleAction(request.id, "approve")
                                    }
                                    className="btn btn-success btn-xs"
                                    disabled={actionLoading}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleAction(request.id, "reject")
                                    }
                                    className="btn btn-error btn-xs"
                                    disabled={actionLoading}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredRequests.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-base-content/50">
                        <svg
                          className="w-16 h-16 mx-auto mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          ></path>
                        </svg>
                        <p className="text-lg font-medium">No requests found</p>
                        <p className="text-sm">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Request Details Modal */}
      <AnimatePresence>
        {showModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-base-100 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-primary">
                  Request Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
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

              <div className="space-y-6">
                {/* Student Information */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="avatar">
                        <div className="mask mask-squircle w-16 h-16">
                          {selectedRequest.profileImageUrl ? (
                            <img
                              src={selectedRequest.profileImageUrl}
                              alt={selectedRequest.studentName}
                              className="w-16 h-16 object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-primary text-primary-content rounded-lg flex items-center justify-center font-bold text-lg">
                              {selectedRequest.studentName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="card-title text-xl">
                          {selectedRequest.studentName}
                        </h4>
                        <p className="text-base-content/70">
                          Student ID: {selectedRequest.studentId}
                        </p>
                        {selectedRequest.bloodGroup && (
                          <div className="badge badge-outline badge-sm mt-1">
                            🩸 {selectedRequest.bloodGroup}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">
                            Department
                          </span>
                        </label>
                        <p className="text-base-content">
                          {selectedRequest.department}
                        </p>
                      </div>
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">Year</span>
                        </label>
                        <p className="text-base-content">
                          {formatYear(selectedRequest.year)}
                        </p>
                      </div>
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">
                            Session
                          </span>
                        </label>
                        <p className="text-base-content">
                          {selectedRequest.session || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">Email</span>
                        </label>
                        <p className="text-base-content">
                          {selectedRequest.email}
                        </p>
                      </div>
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">Phone</span>
                        </label>
                        <p className="text-base-content">
                          {selectedRequest.phone}
                        </p>
                      </div>
                      {selectedRequest.address && (
                        <div>
                          <label className="label">
                            <span className="label-text font-medium">
                              Address
                            </span>
                          </label>
                          <p className="text-base-content">
                            {selectedRequest.address}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">
                            Registration Date
                          </span>
                        </label>
                        <p className="text-base-content">
                          {selectedRequest.registrationDate
                            ? new Date(
                                selectedRequest.registrationDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">
                            Request Priority
                          </span>
                        </label>
                        <div
                          className={`badge ${getPriorityBadge(
                            selectedRequest.priority
                          )}`}
                        >
                          {selectedRequest.priority}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Request Information */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <div className="flex items-center gap-3 mb-4">
                      <h4 className="card-title">Room Request Details</h4>
                      {selectedRequest.isRoomChange && (
                        <div className="badge badge-warning">
                          Room Change Request
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRequest.isRoomChange &&
                        selectedRequest.currentRoom && (
                          <div>
                            <label className="label">
                              <span className="label-text font-medium">
                                Current Room & Bed
                              </span>
                            </label>
                            <p className="text-success font-bold">
                              Room {selectedRequest.currentRoom} - Bed{" "}
                              {selectedRequest.currentBedNo || "N/A"}
                            </p>
                          </div>
                        )}
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">
                            {selectedRequest.isRoomChange
                              ? "Requested New Room"
                              : "Requested Room"}
                          </span>
                        </label>
                        <p className="text-base-content font-bold">
                          Room {selectedRequest.requestedRoom}/
                          {selectedRequest.requestedBlock} - Bed{" "}
                          {selectedRequest.requestedBed}
                        </p>
                      </div>
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">
                            Request Date
                          </span>
                        </label>
                        <p className="text-base-content">
                          {new Date(
                            selectedRequest.requestDate
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            selectedRequest.requestDate
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">
                            Current Status
                          </span>
                        </label>
                        <div
                          className={`badge ${getStatusBadge(
                            selectedRequest.status
                          )}`}
                        >
                          {selectedRequest.status}
                        </div>
                      </div>
                      {/* Room Layout Section */}
                      <div className="md:col-span-2">
                        <label className="label">
                          <span className="label-text font-medium">
                            Applied Room Layout
                          </span>
                        </label>
                        <div className="bg-base-100 p-4 rounded-lg border">
                          {roomLayoutLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <span className="loading loading-spinner loading-md"></span>
                              <span className="ml-2">
                                Loading room layout...
                              </span>
                            </div>
                          ) : (
                            <RoomLayoutDisplay
                              roomData={roomLayout}
                              selectedBed={selectedRequest.requestedBed}
                              showClickable={false}
                            />
                          )}
                        </div>
                      </div>

                      {selectedRequest.studentNotes && (
                        <div className="md:col-span-2">
                          <label className="label">
                            <span className="label-text font-medium">
                              Student Notes
                            </span>
                          </label>
                          <p className="text-base-content bg-base-100 p-3 rounded-lg">
                            {selectedRequest.studentNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                {selectedRequest.status === "Pending" && (
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title">Admin Actions</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="label">
                            <span className="label-text font-medium">
                              Admin Notes (Optional)
                            </span>
                          </label>
                          <textarea
                            className="textarea textarea-bordered w-full"
                            placeholder="Add admin notes..."
                            defaultValue={selectedRequest.adminNotes}
                            rows="3"
                          />
                        </div>

                        <div className="flex justify-end space-x-4">
                          <button
                            onClick={() =>
                              handleAction(selectedRequest.id, "reject")
                            }
                            className="btn btn-error"
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                              "Reject Request"
                            )}
                          </button>
                          <button
                            onClick={() => setShowAdminAllocation(true)}
                            className="btn btn-warning"
                            disabled={actionLoading}
                          >
                            Allocate Different Room
                          </button>
                          <button
                            onClick={() =>
                              handleAction(selectedRequest.id, "approve")
                            }
                            className="btn btn-success"
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                              "Approve Request"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning Modal */}
      <AnimatePresence>
        {showWarningModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowWarningModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-base-100 rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mr-4">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-error">
                    {warningTitle}
                  </h3>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-base-content">{warningMessage}</p>

                {warningMessage.includes("already occupied") && (
                  <div className="mt-4 p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <p className="text-sm text-warning-content">
                      <strong>Reason:</strong> The requested bed is currently
                      occupied by another student. Please check the room layout
                      and select a different bed, or ask the current occupant to
                      vacate first.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="btn btn-primary"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Allocation Modal */}
      <AnimatePresence>
        {showAdminAllocation && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            onClick={() => {
              setShowAdminAllocation(false);
              setAdminSelectedFloor(null);
              setAdminSelectedBlock(null);
              setAdminSelectedRoom(null);
              setAdminSelectedBed(null);
              setAdminRoomAvailability({});
              setAdminRoomLayout(null);
              setShowAdminRoomLayout(false);
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
                <h3 className="text-2xl font-bold text-warning">
                  Admin Room Allocation
                </h3>
                <button
                  onClick={() => {
                    setShowAdminAllocation(false);
                    setAdminSelectedFloor(null);
                    setAdminSelectedBlock(null);
                    setAdminSelectedRoom(null);
                    setAdminSelectedBed(null);
                    setAdminRoomAvailability({});
                    setAdminRoomLayout(null);
                    setShowAdminRoomLayout(false);
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

              <div className="mb-6 p-4 bg-warning/10 rounded-lg border border-warning/20">
                <h4 className="font-bold text-lg mb-2">
                  Student: {selectedRequest.studentName}
                </h4>
                <p className="text-base-content/80">
                  Originally requested: Room {selectedRequest.requestedRoom}/
                  {selectedRequest.requestedBlock} - Bed{" "}
                  {selectedRequest.requestedBed}
                </p>
                <p className="text-base-content/80 mt-1">
                  You can allocate any available room and bed as per your
                  choice.
                </p>
              </div>

              {/* Floor Selection */}
              <div className="mb-6">
                <label className="label">
                  <span className="label-text font-medium">Select Floor</span>
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3].map((floor) => (
                    <button
                      key={floor}
                      onClick={() => {
                        setAdminSelectedFloor(floor);
                        setAdminSelectedBlock(null);
                        setAdminSelectedRoom(null);
                        setAdminRoomLayout(null);
                        setAdminRoomAvailability({});
                      }}
                      className={`btn ${
                        adminSelectedFloor === floor
                          ? "btn-primary"
                          : "btn-outline"
                      }`}
                    >
                      Floor {floor}
                    </button>
                  ))}
                </div>
              </div>

              {/* Block Selection */}
              <AnimatePresence>
                {adminSelectedFloor && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <label className="label">
                      <span className="label-text font-medium">
                        Select Block
                      </span>
                    </label>
                    <div className="flex gap-3">
                      {["A", "B"].map((block) => (
                        <button
                          key={block}
                          onClick={() => {
                            setAdminSelectedBlock(block);
                            setAdminSelectedRoom(null);
                            setAdminRoomLayout(null);
                            loadAdminRoomAvailability(
                              adminSelectedFloor,
                              block
                            );
                          }}
                          className={`btn ${
                            adminSelectedBlock === block
                              ? "btn-primary"
                              : "btn-outline"
                          }`}
                        >
                          Block {block}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Room Selection */}
              <AnimatePresence>
                {adminSelectedBlock && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <label className="label">
                      <span className="label-text font-medium">
                        Select Room
                      </span>
                    </label>
                    {loadingAdminRooms ? (
                      <div className="flex justify-center py-8">
                        <span className="loading loading-spinner loading-md"></span>
                        <span className="ml-2">Loading rooms...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                        {Object.entries(adminRoomAvailability).map(
                          ([roomNo, roomData]) => (
                            <button
                              key={roomNo}
                              onClick={() => {
                                setAdminSelectedRoom(roomNo);
                                setShowAdminRoomLayout(true);
                              }}
                              className={`btn ${
                                adminSelectedRoom === roomNo
                                  ? "btn-primary"
                                  : "btn-outline"
                              } flex-col h-auto py-3`}
                            >
                              <span className="font-bold">Room {roomNo}</span>
                              <span className="text-xs opacity-70">
                                {roomData.availableBeds}/{roomData.capacity}{" "}
                                available
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bed Selection */}
              <AnimatePresence>
                {adminSelectedRoom && !showAdminRoomLayout && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <label className="label">
                      <span className="label-text font-medium">Select Bed</span>
                    </label>

                    <div className="text-center py-4">
                      <p className="text-base-content/70">
                        Room {adminSelectedRoom} selected. Click "View Room
                        Layout" to select a bed.
                      </p>
                      <button
                        onClick={() => setShowAdminRoomLayout(true)}
                        className="btn btn-primary mt-2"
                      >
                        View Room Layout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowAdminAllocation(false);
                    setAdminSelectedFloor(null);
                    setAdminSelectedBlock(null);
                    setAdminSelectedRoom(null);
                    setAdminSelectedBed(null);
                    setAdminRoomAvailability({});
                    setAdminRoomLayout(null);
                    setShowAdminRoomLayout(false);
                  }}
                  className="btn btn-ghost"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Allocation Confirmation Modal */}
      <AnimatePresence>
        {showAllocationConfirm && confirmAllocationData && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4"
            onClick={() => {
              setShowAllocationConfirm(false);
              setConfirmAllocationData(null);
              setAdminAllocationNotes("");
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-base-100 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-success"
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
                </div>
                <div>
                  <h3 className="text-xl font-bold text-success">
                    Confirm Room Allocation
                  </h3>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-base-200 p-4 rounded-lg mb-4">
                  <h4 className="font-bold text-lg mb-2">Student Details</h4>
                  <p className="text-base-content">
                    <strong>Name:</strong> {selectedRequest.studentName}
                  </p>
                  <p className="text-base-content">
                    <strong>ID:</strong> {selectedRequest.studentId}
                  </p>
                  <p className="text-base-content">
                    <strong>Department:</strong> {selectedRequest.department}
                  </p>
                </div>

                <div className="bg-warning/10 p-4 rounded-lg border border-warning/20 mb-4">
                  <h4 className="font-bold text-lg mb-2">Original Request</h4>
                  <p className="text-base-content">
                    Room {selectedRequest.requestedRoom}/
                    {selectedRequest.requestedBlock} - Bed{" "}
                    {selectedRequest.requestedBed}
                  </p>
                </div>

                <div className="bg-success/10 p-4 rounded-lg border border-success/20">
                  <h4 className="font-bold text-lg mb-2">Admin Allocation</h4>
                  <p className="text-base-content">
                    <strong>Floor:</strong> {confirmAllocationData.floor}
                  </p>
                  <p className="text-base-content">
                    <strong>Block:</strong> {confirmAllocationData.block}
                  </p>
                  <p className="text-base-content">
                    <strong>Room:</strong> {confirmAllocationData.roomNo}
                  </p>
                  <p className="text-base-content">
                    <strong>Bed:</strong> {confirmAllocationData.bedNo}
                  </p>
                </div>

                <div className="mt-4">
                  <label className="label">
                    <span className="label-text font-medium">
                      Admin Notes{" "}
                      <span className="text-base-content/60">(Optional)</span>
                    </span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full h-24 resize-none"
                    placeholder="Add notes about this allocation (e.g., reason for different room, special considerations, etc.)"
                    value={adminAllocationNotes}
                    onChange={(e) => setAdminAllocationNotes(e.target.value)}
                    maxLength={300}
                  />
                  <div className="text-xs text-base-content/60 mt-1">
                    {adminAllocationNotes.length}/300 characters
                  </div>
                </div>

                <p className="text-sm text-base-content/70 mt-4">
                  Are you sure you want to allocate this student to the selected
                  room and bed?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAllocationConfirm(false);
                    setConfirmAllocationData(null);
                    setAdminAllocationNotes("");
                  }}
                  className="btn btn-ghost flex-1"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAllocationConfirm(false);
                    handleAdminAllocation(confirmAllocationData.bedNo);
                    setConfirmAllocationData(null);
                  }}
                  className="btn btn-success flex-1"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Allocating...
                    </>
                  ) : (
                    "Confirm Allocation"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room Layout Modal */}
      <AnimatePresence>
        {showAdminRoomLayout && adminSelectedRoom && (
          <RoomLayout
            roomNumber={adminSelectedRoom}
            block={adminSelectedBlock}
            onBedSelect={(bedNo) => {
              if (typeof bedNo === "number") {
                setConfirmAllocationData({
                  bedNo: bedNo,
                  roomNo: adminSelectedRoom,
                  block: adminSelectedBlock,
                  floor: adminSelectedFloor,
                });
                setShowAdminRoomLayout(false);
                setShowAllocationConfirm(true);
              }
            }}
            onClose={() => {
              setShowAdminRoomLayout(false);
            }}
            isAdminMode={true}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
