"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../../../components/AdminLayout";
import RoomLayoutDisplay from "../../../components/RoomLayoutDisplay";
import RoomLayout from "../../../components/RoomLayout";
import { getAuthHeaders } from "../../../utils/auth";

export default function StudentsManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showRoomCancellationModal, setShowRoomCancellationModal] =
    useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [roomLayoutData, setRoomLayoutData] = useState(null);
  const [loadingRoomLayout, setLoadingRoomLayout] = useState(false);

  // Room allocation modal state (exact same as student room page)
  const [showRoomAllocationModal, setShowRoomAllocationModal] = useState(false);
  const [isChangeRoom, setIsChangeRoom] = useState(false); // true for change, false for allocate
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [roomAvailability, setRoomAvailability] = useState({});
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showRoomLayout, setShowRoomLayout] = useState(false);
  const [selectedRoomForLayout, setSelectedRoomForLayout] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [applying, setApplying] = useState(false);

  // Constants (same as student room page)
  const floors = [1, 2, 3];
  const blocks = ["A", "B"];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    department: "all",
    year: "all",
    bloodGroup: "all",
    roomStatus: "all",
  });
  const [sortBy, setSortBy] = useState("registrationDate");
  const [sortOrder, setSortOrder] = useState("desc");

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    years: [],
    bloodGroups: [],
  });

  // Summary stats
  const [summary, setSummary] = useState({
    totalStudents: 0,
    allocatedStudents: 0,
    activeStudents: 0,
  });

  // Bulk delete state
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);

  useEffect(() => {
    loadStudents();
  }, [currentPage, searchTerm, filters, sortBy, sortOrder]);

  // Handle URL query parameters for actions from room management page
  useEffect(() => {
    const handleUrlParams = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get("action");
      const studentId = urlParams.get("studentId");

      if (action && studentId) {
        // Find the student by studentId
        const student = students.find(
          (s) => s.studentId === studentId || s.id.toString() === studentId
        );

        if (student) {
          // Execute the action
          switch (action) {
            case "contact":
              handleStudentAction("contact", student);
              break;
            case "cancelRoom":
              handleStudentAction("cancelRoom", student);
              break;
            case "changeRoom":
              setSelectedStudent(student);
              openRoomAllocationModal(true);
              break;
            case "allocateRoom":
              setSelectedStudent(student);
              openRoomAllocationModal(false);
              break;
            case "delete":
              handleStudentAction("delete", student);
              break;
            default:
              // Unknown action, just show the student details
              setSelectedStudent(student);
              setShowModal(true);
          }

          // Clean up URL parameters
          window.history.replaceState({}, "", window.location.pathname);
        } else if (students.length > 0) {
          // Student not found in current page, might need to search
          // Set search term to student ID and reload
          setSearchTerm(studentId);
        }
      }
    };

    if (students.length > 0) {
      handleUrlParams();
    }
  }, [students]);

  const loadStudents = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "20",
        search: searchTerm,
        department: filters.department,
        year: filters.year,
        bloodGroup: filters.bloodGroup,
        roomStatus: filters.roomStatus,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/admin?${params}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalCount);
        setFilterOptions(data.filters);
        setSummary(data.summary);
      } else {
        console.error("Failed to load students:", response.status);
        setStudents([]);
      }
    } catch (error) {
      console.error("Error loading students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const formatYear = (year) => {
    if (!year) return "N/A";
    const yearNum = parseInt(year);
    if (yearNum === 1) return "1st Year";
    if (yearNum === 2) return "2nd Year";
    if (yearNum === 3) return "3rd Year";
    if (yearNum === 4) return "4th Year";
    return `${yearNum}th Year`;
  };

  const getStatusBadge = (student) => {
    if (!student.isActive) {
      return <div className="badge badge-error">Inactive</div>;
    }
    if (student.isRoomAllocated) {
      return <div className="badge badge-success">Room Allocated</div>;
    }
    return <div className="badge badge-warning">No Room</div>;
  };

  const handleStudentAction = async (action, student) => {
    setSelectedStudent(student);

    switch (action) {
      case "contact":
        setShowContactModal(true);
        break;
      case "cancelRoom":
        if (student.isRoomAllocated) {
          await loadRoomLayoutForCancellation(student);
          setShowRoomCancellationModal(true);
        }
        break;
      case "delete":
        setShowDeleteConfirmModal(true);
        break;
      default:
        console.log(`Action: ${action} for student: ${student.id}`);
    }
  };

  const loadRoomLayoutForCancellation = async (student) => {
    try {
      setLoadingRoomLayout(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/room-layout/${student.block}/${student.roomNo}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const layoutData = await response.json();
        setRoomLayoutData(layoutData);
      } else {
        console.error("Failed to load room layout:", response.status);
        setRoomLayoutData(null);
      }
    } catch (error) {
      console.error("Error loading room layout:", error);
      setRoomLayoutData(null);
    } finally {
      setLoadingRoomLayout(false);
    }
  };

  const handleCancelRoomAllocation = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/${selectedStudent.id}/cancel-room`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        // Refresh the students list
        await loadStudents();
        setShowRoomCancellationModal(false);
        setSelectedStudent(null);
        setRoomLayoutData(null);
        // Show success modal
        setSuccessMessage(
          "Room allocation cancelled successfully! The student can now apply for a new room."
        );
        setShowSuccessModal(true);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        setSuccessMessage(
          `Failed to cancel room allocation: ${errorData.message}`
        );
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error cancelling room allocation:", error);
      setSuccessMessage("Failed to cancel room allocation. Please try again.");
      setShowSuccessModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/${selectedStudent.id}/admin-delete`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        // Refresh the students list
        await loadStudents();
        setShowDeleteConfirmModal(false);
        setSelectedStudent(null);
        // Show success modal
        setSuccessMessage(
          "Student account deleted successfully! All associated data has been removed."
        );
        setShowSuccessModal(true);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        setSuccessMessage(
          `Failed to delete student account: ${errorData.message}`
        );
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      setSuccessMessage("Failed to delete student account. Please try again.");
      setShowSuccessModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    // Get all student IDs from current filtered students
    const studentIds = students.map((student) => student.studentId);

    if (studentIds.length === 0) {
      alert("No students found to delete");
      return;
    }

    setDeleting(true);
    setDeleteResult(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/admin/bulk-delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ studentIds }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setDeleteResult({
          success: true,
          ...data,
        });
        // Refresh students data
        await loadStudents();
      } else {
        setDeleteResult({
          success: false,
          message: data.message || "Failed to delete students",
        });
      }
    } catch (error) {
      console.error("Error during bulk delete:", error);
      setDeleteResult({
        success: false,
        message: "An error occurred during bulk delete",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleContactAction = (type, value) => {
    if (type === "phone") {
      // Try WhatsApp first, fallback to phone call
      const whatsappUrl = `https://wa.me/${value.replace(/[^0-9]/g, "")}`;
      const phoneUrl = `tel:${value}`;

      // Open WhatsApp in a new tab, if it fails, make a phone call
      const whatsappWindow = window.open(whatsappUrl, "_blank");

      // If WhatsApp doesn't open (blocked popup or not available), fallback to phone
      setTimeout(() => {
        if (!whatsappWindow || whatsappWindow.closed) {
          window.location.href = phoneUrl;
        }
      }, 1000);
    } else if (type === "email") {
      const subject = encodeURIComponent("Regarding Hall Management");
      const body = encodeURIComponent(
        `Dear ${selectedStudent.studentName},\n\n`
      );
      const emailUrl = `mailto:${value}?subject=${subject}&body=${body}`;

      // Try to open email client
      window.open(emailUrl, "_self");
    }
  };

  // Room allocation functions (exact same as student room page)
  const openRoomAllocationModal = (changeRoom = false) => {
    setIsChangeRoom(changeRoom);
    setShowRoomAllocationModal(true);
    setSelectedFloor(null);
    setSelectedBlock(null);
    setRoomAvailability({});
    setSelectedRoomForLayout(null);
    setSelectedBed(null);
    setAdminNotes("");
    setShowRoomLayout(false);
    setShowNotesModal(false);
    setApplying(false);
  };

  const closeRoomAllocationModal = () => {
    setShowRoomAllocationModal(false);
    setIsChangeRoom(false);
    setSelectedFloor(null);
    setSelectedBlock(null);
    setRoomAvailability({});
    setSelectedRoomForLayout(null);
    setSelectedBed(null);
    setAdminNotes("");
    setShowRoomLayout(false);
    setShowNotesModal(false);
    setApplying(false);
  };

  const selectFloor = (floor) => {
    setSelectedFloor(floor);
    setSelectedBlock(null);
    setRoomAvailability({});
  };

  const selectBlock = async (block) => {
    setSelectedBlock(block);
    setLoadingRooms(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/availability/${selectedFloor}/${block}`,
        { headers: getAuthHeaders() }
      );

      if (response.ok) {
        const data = await response.json();
        setRoomAvailability(data);
      } else {
        setSuccessMessage("Failed to load room availability");
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error loading room availability:", error);
      setSuccessMessage("Failed to load room availability");
      setShowSuccessModal(true);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleRoomSelection = (roomNo) => {
    setSelectedRoomForLayout(roomNo);
    setShowRoomLayout(true);
    setShowRoomAllocationModal(false);
  };

  const handleBedSelection = (bedNo) => {
    // Store the selected bed and show notes modal
    setSelectedBed(bedNo);
    setShowRoomLayout(false);
    setShowNotesModal(true);
  };

  // Keep the old function name for compatibility but redirect to room selection
  const applyForRoom = handleRoomSelection;

  const getRoomStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-500 hover:bg-green-600";
      case "limited":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "full":
        return "bg-red-500 cursor-not-allowed";
      default:
        return "bg-gray-500";
    }
  };

  const getRoomStatusText = (availableBeds) => {
    if (availableBeds === 0) return "Full";
    if (availableBeds === 1) return "1 bed left";
    return `${availableBeds} beds available`;
  };

  const handleRoomAllocation = async () => {
    if (!selectedBlock || !selectedRoomForLayout || !selectedBed) {
      setSuccessMessage("Please select a room and bed before proceeding.");
      setShowSuccessModal(true);
      return;
    }

    try {
      setActionLoading(true);

      const requestBody = {
        Block: selectedBlock,
        RoomNo: selectedRoomForLayout,
        BedNo: selectedBed,
        AdminNotes:
          adminNotes ||
          (isChangeRoom ? "Room changed by admin" : "Room allocated by admin"),
      };

      console.log("Room allocation request:", requestBody);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/${selectedStudent.id}/admin-allocate-room`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log("Room allocation successful:", responseData);

        // Refresh the students list
        await loadStudents();

        // Close all modals
        setShowNotesModal(false);
        setShowRoomLayout(false);
        setShowRoomAllocationModal(false);
        setShowModal(false);
        setSelectedStudent(null);

        // Show success message
        const action = isChangeRoom ? "changed" : "allocated";
        setSuccessMessage(
          `Room ${action} successfully! ${responseData.student.name} has been assigned to Room ${responseData.allocatedRoom}, Bed ${responseData.allocatedBed}.`
        );
        setShowSuccessModal(true);

        // Reset form
        closeRoomAllocationModal();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        console.error("Room allocation failed:", errorData);
        const errorMessage =
          errorData.message || errorData.details || "Unknown error";
        setSuccessMessage(
          `Failed to ${
            isChangeRoom ? "change" : "allocate"
          } room: ${errorMessage}`
        );
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error with room allocation:", error);
      setSuccessMessage(
        `Failed to ${isChangeRoom ? "change" : "allocate"} room: ${
          error.message || "Network error. Please try again."
        }`
      );
      setShowSuccessModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-base-content">
              Student Management
            </h1>
            <p className="text-base-content/70 mt-1">
              Manage and monitor all registered students
            </p>
          </div>

          {/* Summary Stats */}
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Total Students</div>
              <div className="stat-value text-primary">
                {summary.totalStudents}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Room Allocated</div>
              <div className="stat-value text-success">
                {summary.allocatedStudents}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Active</div>
              <div className="stat-value text-info">
                {summary.activeStudents}
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {/* Department Filter */}
                <select
                  className="select select-bordered select-sm"
                  value={filters.department}
                  onChange={(e) =>
                    handleFilterChange("department", e.target.value)
                  }
                >
                  <option value="all">All Departments</option>
                  {filterOptions.departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                {/* Year Filter */}
                <select
                  className="select select-bordered select-sm"
                  value={filters.year}
                  onChange={(e) => handleFilterChange("year", e.target.value)}
                >
                  <option value="all">All Years</option>
                  {filterOptions.years.map((year) => (
                    <option key={year} value={year}>
                      {formatYear(year)}
                    </option>
                  ))}
                </select>

                {/* Blood Group Filter */}
                <select
                  className="select select-bordered select-sm"
                  value={filters.bloodGroup}
                  onChange={(e) =>
                    handleFilterChange("bloodGroup", e.target.value)
                  }
                >
                  <option value="all">All Blood Groups</option>
                  {filterOptions.bloodGroups.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>

                {/* Room Status Filter */}
                <select
                  className="select select-bordered select-sm"
                  value={filters.roomStatus}
                  onChange={(e) =>
                    handleFilterChange("roomStatus", e.target.value)
                  }
                >
                  <option value="all">All Students</option>
                  <option value="allocated">Room Allocated</option>
                  <option value="not-allocated">No Room</option>
                </select>
              </div>

              {/* Search */}
              <div className="flex gap-2">
                <div className="form-control">
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Search students by name, ID, session, department, room..."
                      className="input input-bordered input-sm"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                    <button className="btn btn-square btn-sm">
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Sort Toggle */}
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleSort("registrationDate")}
                  title={`Sort by registration date (${
                    sortOrder === "desc" ? "Newest first" : "Oldest first"
                  })`}
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      sortOrder === "asc" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                  {sortOrder === "desc" ? "Newest First" : "Oldest First"}
                </button>
              </div>
            </div>

            {/* Bulk Delete Button */}
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-base-content/70">
                {searchTerm && (
                  <>
                    Showing {students.length} students matching &quot;
                    {searchTerm}&quot;
                  </>
                )}
              </div>
              {students.length > 0 && (
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="btn btn-error btn-sm"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Filtered Students
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Department & Year</th>
                        <th>Contact</th>
                        <th>Room Status</th>
                        <th>Blood Group</th>
                        <th>Registration</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="hover"
                        >
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="mask mask-squircle w-12 h-12">
                                  {student.profileImageUrl ? (
                                    <img
                                      src={student.profileImageUrl}
                                      alt={student.studentName}
                                      className="w-12 h-12 object-cover"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-primary text-primary-content rounded-lg flex items-center justify-center font-bold">
                                      {student.studentName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="font-bold">
                                  {student.studentName}
                                </div>
                                <div className="text-sm opacity-50">
                                  ID: {student.studentId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="font-medium">
                              {student.department}
                            </div>
                            <div className="text-sm opacity-50">
                              {formatYear(student.year)}
                            </div>
                          </td>
                          <td>
                            <div className="text-sm">
                              <div>{student.email}</div>
                              <div className="opacity-50">
                                {student.phoneNumber}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(student)}
                              {student.currentRoom && (
                                <div className="text-xs opacity-70">
                                  Room {student.currentRoom} - Bed{" "}
                                  {student.bedNo}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="badge badge-outline badge-sm">
                              🩸 {student.bloodGroup || "N/A"}
                            </div>
                          </td>
                          <td>
                            <div className="text-sm">
                              {new Date(
                                student.registrationDate
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-xs opacity-50">
                              {new Date(
                                student.registrationDate
                              ).toLocaleTimeString()}
                            </div>
                          </td>
                          <td>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowModal(true);
                                }}
                                className="btn btn-info btn-xs"
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>

                  {students.length === 0 && (
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
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <p className="text-lg font-medium">No students found</p>
                        <p className="text-sm">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="join">
                      <button
                        className="join-item btn btn-sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        «
                      </button>

                      {/* Page numbers */}
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
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
                              className={`join-item btn btn-sm ${
                                currentPage === pageNum ? "btn-active" : ""
                              }`}
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}

                      <button
                        className="join-item btn btn-sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        »
                      </button>
                    </div>
                  </div>
                )}

                {/* Page info */}
                <div className="text-center text-sm text-base-content/70 mt-2">
                  Showing {(currentPage - 1) * 20 + 1} to{" "}
                  {Math.min(currentPage * 20, totalCount)} of {totalCount}{" "}
                  students
                </div>
              </>
            )}
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
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-base-100 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-primary">
                    Student Details
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
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Profile Image Section */}
                  <div className="lg:col-span-1">
                    <div className="card bg-base-200">
                      <div className="card-body items-center text-center">
                        <div className="avatar">
                          <div className="w-32 h-32 rounded-full">
                            {selectedStudent.profileImageUrl ? (
                              <img
                                src={selectedStudent.profileImageUrl}
                                alt={selectedStudent.studentName}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary text-primary-content rounded-full flex items-center justify-center text-4xl font-bold">
                                {selectedStudent.studentName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                            )}
                          </div>
                        </div>
                        <h4 className="card-title text-xl mt-4">
                          {selectedStudent.studentName}
                        </h4>
                        <p className="text-base-content/70">
                          ID: {selectedStudent.studentId}
                        </p>
                        {getStatusBadge(selectedStudent)}
                      </div>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Personal Information */}
                      <div className="card bg-base-200">
                        <div className="card-body">
                          <h5 className="card-title text-lg mb-4">
                            Personal Information
                          </h5>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-base-content/70">
                                Full Name
                              </label>
                              <p className="font-medium">
                                {selectedStudent.studentName}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-base-content/70">
                                Email
                              </label>
                              <p className="font-medium">
                                {selectedStudent.email}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-base-content/70">
                                Phone Number
                              </label>
                              <p className="font-medium">
                                {selectedStudent.phoneNumber}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-base-content/70">
                                Guardian Phone Number
                              </label>
                              <p className="font-medium">
                                {selectedStudent.guardianPhoneNumber ||
                                  "Not provided"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-base-content/70">
                                Blood Group
                              </label>
                              <p className="font-medium text-error">
                                {selectedStudent.bloodGroup || "Not specified"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-base-content/70">
                                Address
                              </label>
                              <p className="font-medium">
                                {selectedStudent.address || "Not provided"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Academic Information */}
                      <div className="card bg-base-200">
                        <div className="card-body">
                          <h5 className="card-title text-lg mb-4">
                            Academic Information
                          </h5>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-base-content/70">
                                Student ID
                              </label>
                              <p className="font-medium">
                                {selectedStudent.studentId}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-base-content/70">
                                Department
                              </label>
                              <p className="font-medium">
                                {selectedStudent.department}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-base-content/70">
                                Year
                              </label>
                              <p className="font-medium">
                                {formatYear(selectedStudent.year)}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-base-content/70">
                                Session
                              </label>
                              <p className="font-medium">
                                {selectedStudent.session || "Not specified"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-base-content/70">
                                Registration Date
                              </label>
                              <p className="font-medium">
                                {new Date(
                                  selectedStudent.registrationDate
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-base-content/70">
                                Account Status
                              </label>
                              <p className="font-medium">
                                {selectedStudent.isActive ? (
                                  <span className="text-success">Active</span>
                                ) : (
                                  <span className="text-error">Inactive</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Room Information */}
                      <div className="card bg-base-200 md:col-span-2">
                        <div className="card-body">
                          <h5 className="card-title text-lg mb-4">
                            Room Information
                          </h5>
                          {selectedStudent.isRoomAllocated ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-sm font-medium text-base-content/70">
                                  Current Room
                                </label>
                                <p className="font-medium text-success">
                                  Room {selectedStudent.currentRoom}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-base-content/70">
                                  Bed Number
                                </label>
                                <p className="font-medium text-success">
                                  Bed {selectedStudent.bedNo}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-base-content/70">
                                  Allocation Date
                                </label>
                                <p className="font-medium">
                                  {selectedStudent.roomAllocationDate
                                    ? new Date(
                                        selectedStudent.roomAllocationDate
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-base-content/70">
                                No room allocated
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-center mt-8 pt-6 border-t">
                  <button
                    onClick={() =>
                      handleStudentAction("contact", selectedStudent)
                    }
                    className="btn btn-info"
                    disabled={actionLoading}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Contact Student
                  </button>

                  {selectedStudent.isRoomAllocated && (
                    <button
                      onClick={() =>
                        handleStudentAction("cancelRoom", selectedStudent)
                      }
                      className="btn btn-warning"
                      disabled={actionLoading}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Cancel Room Allocation
                    </button>
                  )}

                  {/* Change Room Button - only for students with room allocation */}
                  {selectedStudent.isRoomAllocated && (
                    <button
                      onClick={() => openRoomAllocationModal(true)}
                      className="btn btn-info"
                      disabled={actionLoading}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                      Change Room
                    </button>
                  )}

                  {/* Allocate Room Button - only for students without room allocation */}
                  {!selectedStudent.isRoomAllocated && (
                    <button
                      onClick={() => openRoomAllocationModal(false)}
                      className="btn btn-success"
                      disabled={actionLoading}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Allocate Room
                    </button>
                  )}

                  <button
                    onClick={() =>
                      handleStudentAction("delete", selectedStudent)
                    }
                    className="btn btn-error"
                    disabled={actionLoading}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete Account
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contact Modal */}
        <AnimatePresence>
          {showContactModal && selectedStudent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowContactModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-base-100 rounded-2xl p-8 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-primary">
                    Contact Student
                  </h3>
                  <button
                    onClick={() => setShowContactModal(false)}
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
                      />
                    </svg>
                  </button>
                </div>

                <div className="text-center mb-6">
                  <div className="avatar mb-4">
                    <div className="w-20 h-20 rounded-full">
                      {selectedStudent.profileImageUrl ? (
                        <img
                          src={selectedStudent.profileImageUrl}
                          alt={selectedStudent.studentName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary text-primary-content rounded-full flex items-center justify-center text-2xl font-bold">
                          {selectedStudent.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                      )}
                    </div>
                  </div>
                  <h4 className="text-xl font-bold">
                    {selectedStudent.studentName}
                  </h4>
                  <p className="text-base-content/70">
                    ID: {selectedStudent.studentId}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h5 className="card-title text-lg mb-4">
                        Contact Options
                      </h5>

                      {/* Phone Contact */}
                      <div className="p-3 bg-base-100 rounded-lg mb-3">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-success"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium">Phone</p>
                            <p className="text-sm text-base-content/70">
                              {selectedStudent.phoneNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() =>
                              handleContactAction(
                                "phone",
                                selectedStudent.phoneNumber
                              )
                            }
                            className="btn btn-success btn-sm"
                          >
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                            WhatsApp/Call
                          </button>
                        </div>
                      </div>

                      {/* Email Contact */}
                      <div className="p-3 bg-base-100 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-info/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-info"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium">Email</p>
                            <p className="text-sm text-base-content/70 break-all">
                              {selectedStudent.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() =>
                              handleContactAction(
                                "email",
                                selectedStudent.email
                              )
                            }
                            className="btn btn-info btn-sm"
                          >
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                              />
                            </svg>
                            Send Email
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="btn btn-primary"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Room Cancellation Modal */}
        <AnimatePresence>
          {showRoomCancellationModal && selectedStudent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowRoomCancellationModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-base-100 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-warning">
                    Cancel Room Allocation
                  </h3>
                  <button
                    onClick={() => setShowRoomCancellationModal(false)}
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
                      />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <div className="alert alert-warning">
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
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div>
                      <h4 className="font-bold">Warning!</h4>
                      <p>
                        You are about to cancel the room allocation for{" "}
                        <strong>{selectedStudent.studentName}</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4">
                    Current Room Details
                  </h4>
                  <div className="bg-base-200 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-base-content/70">
                          Student
                        </label>
                        <p className="font-medium">
                          {selectedStudent.studentName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-base-content/70">
                          Student ID
                        </label>
                        <p className="font-medium">
                          {selectedStudent.studentId}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-base-content/70">
                          Current Room
                        </label>
                        <p className="font-medium text-warning">
                          Room {selectedStudent.currentRoom}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-base-content/70">
                          Bed Number
                        </label>
                        <p className="font-medium text-warning">
                          Bed {selectedStudent.bedNo}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Room Layout */}
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">Room Layout</h5>
                    {loadingRoomLayout ? (
                      <div className="flex justify-center py-8">
                        <span className="loading loading-spinner loading-md"></span>
                        <span className="ml-2">Loading room layout...</span>
                      </div>
                    ) : roomLayoutData ? (
                      <RoomLayoutDisplay
                        roomData={roomLayoutData}
                        currentStudentBed={selectedStudent.bedNo}
                        showRoommateDetails={false}
                        currentStudentName={selectedStudent.studentName}
                        isAdminView={true}
                      />
                    ) : (
                      <div className="text-center py-4 text-base-content/70">
                        Unable to load room layout
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => setShowRoomCancellationModal(false)}
                    className="btn btn-ghost"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCancelRoomAllocation}
                    className="btn btn-warning"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Confirm Cancellation
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirmModal && selectedStudent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteConfirmModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-base-100 rounded-2xl p-8 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-error">
                    Delete Student Account
                  </h3>
                  <button
                    onClick={() => setShowDeleteConfirmModal(false)}
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
                      />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <div className="alert alert-error">
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
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div>
                      <h4 className="font-bold">Danger!</h4>
                      <p>
                        This action cannot be undone. This will permanently
                        delete the student account.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="bg-base-200 p-4 rounded-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="avatar">
                        <div className="w-16 h-16 rounded-full">
                          {selectedStudent.profileImageUrl ? (
                            <img
                              src={selectedStudent.profileImageUrl}
                              alt={selectedStudent.studentName}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary text-primary-content rounded-full flex items-center justify-center text-xl font-bold">
                              {selectedStudent.studentName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">
                          {selectedStudent.studentName}
                        </h4>
                        <p className="text-base-content/70">
                          ID: {selectedStudent.studentId}
                        </p>
                        <p className="text-base-content/70">
                          {selectedStudent.department}
                        </p>
                      </div>
                    </div>

                    {selectedStudent.isRoomAllocated && (
                      <div className="bg-warning/10 p-3 rounded border border-warning/20">
                        <p className="text-sm text-warning-content">
                          <strong>Note:</strong> This student is currently
                          allocated to Room {selectedStudent.currentRoom} - Bed{" "}
                          {selectedStudent.bedNo}. Deleting the account will
                          also remove the room allocation.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirmModal(false)}
                    className="btn btn-ghost"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteStudent}
                    className="btn btn-error"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete Permanently
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Delete Confirmation Modal */}
        <AnimatePresence>
          {showBulkDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4"
              onClick={() => !deleting && setShowBulkDeleteModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-base-100 rounded-2xl p-8 max-w-2xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {!deleteResult ? (
                  <>
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 bg-error/20 rounded-full flex items-center justify-center flex-shrink-0">
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
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-base-content mb-2">
                          Confirm Bulk Delete
                        </h3>
                        <p className="text-base-content/70">
                          You are about to permanently delete{" "}
                          <span className="font-bold text-error">
                            {students.length} student account(s)
                          </span>
                          .
                        </p>
                        {searchTerm && (
                          <div className="mt-3 p-3 bg-warning/10 border-l-4 border-warning rounded">
                            <p className="text-sm text-base-content/80">
                              <span className="font-semibold">
                                Active Filter:
                              </span>{" "}
                              &quot;{searchTerm}&quot;
                            </p>
                            <p className="text-sm text-base-content/70 mt-1">
                              Only students matching this filter will be
                              deleted.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-error/5 border border-error/20 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-error mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <div className="text-sm">
                          <p className="font-semibold text-error mb-1">
                            Warning:
                          </p>
                          <p className="text-base-content/70">
                            This action will permanently delete all student
                            accounts in the filtered results, including their
                            room allocations and all associated data. This
                            action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowBulkDeleteModal(false)}
                        className="btn btn-outline"
                        disabled={deleting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="btn btn-error"
                        disabled={deleting}
                      >
                        {deleting ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Deleting...
                          </>
                        ) : (
                          <>
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Confirm Delete
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-4 mb-6">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          deleteResult.success ? "bg-success/20" : "bg-error/20"
                        }`}
                      >
                        <svg
                          className={`w-6 h-6 ${
                            deleteResult.success ? "text-success" : "text-error"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {deleteResult.success ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          )}
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-base-content mb-2">
                          {deleteResult.success
                            ? "Bulk Delete Completed"
                            : "Bulk Delete Failed"}
                        </h3>
                        <p className="text-base-content/70">
                          {deleteResult.message}
                        </p>
                      </div>
                    </div>

                    {deleteResult.success && (
                      <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-base-content/70">
                              Successfully Deleted
                            </p>
                            <p className="text-2xl font-bold text-success">
                              {deleteResult.deletedCount}
                            </p>
                          </div>
                          {deleteResult.failedCount > 0 && (
                            <div>
                              <p className="text-sm text-base-content/70">
                                Failed
                              </p>
                              <p className="text-2xl font-bold text-error">
                                {deleteResult.failedCount}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {deleteResult.failedStudents &&
                      deleteResult.failedStudents.length > 0 && (
                        <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
                          <p className="font-semibold mb-2 text-error">
                            Failed Students:
                          </p>
                          <ul className="list-disc list-inside text-sm text-base-content/70">
                            {deleteResult.failedStudents.map((student, idx) => (
                              <li key={idx}>{student}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => {
                          setShowBulkDeleteModal(false);
                          setDeleteResult(null);
                        }}
                        className="btn btn-primary"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Room Application Modal (exact copy from student room page) */}
        <AnimatePresence>
          {showRoomAllocationModal && selectedStudent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={closeRoomAllocationModal}
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
                    {isChangeRoom ? "Change Room" : "Allocate Room"} -{" "}
                    {selectedStudent.studentName}
                  </h3>
                  <button
                    onClick={closeRoomAllocationModal}
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

                {/* Current Room Info (for room changes) */}
                {isChangeRoom && selectedStudent.isRoomAllocated && (
                  <div className="mb-6 p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <h4 className="font-semibold text-warning mb-2">
                      Current Room Assignment
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Room:</span>
                        <p className="text-primary font-bold">
                          {selectedStudent.currentRoom || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Bed:</span>
                        <p className="text-primary font-bold">
                          Bed {selectedStudent.bedNo || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Allocated:</span>
                        <p className="text-sm text-base-content/70">
                          {selectedStudent.roomAllocationDate
                            ? new Date(
                                selectedStudent.roomAllocationDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Floor Selection */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold mb-4">Select Floor</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {floors.map((floor) => (
                      <motion.button
                        key={floor}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => selectFloor(floor)}
                        className={`btn ${
                          selectedFloor === floor
                            ? "btn-primary"
                            : "btn-outline"
                        }`}
                      >
                        Floor {floor}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Block Selection */}
                <AnimatePresence>
                  {selectedFloor && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-8"
                    >
                      <h4 className="text-lg font-semibold mb-4">
                        Select Block (Floor {selectedFloor})
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {blocks.map((block) => (
                          <motion.button
                            key={block}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => selectBlock(block)}
                            className={`btn ${
                              selectedBlock === block
                                ? "btn-primary"
                                : "btn-outline"
                            }`}
                          >
                            Block {block}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Room Selection */}
                <AnimatePresence>
                  {selectedBlock && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <h4 className="text-lg font-semibold mb-4">
                        Select Room (Floor {selectedFloor}, Block{" "}
                        {selectedBlock})
                      </h4>

                      {loadingRooms ? (
                        <div className="flex justify-center py-8">
                          <div className="loading loading-spinner loading-lg text-primary"></div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                          {Object.entries(roomAvailability).map(
                            ([roomNo, roomData]) => (
                              <motion.button
                                key={roomNo}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                  delay: parseInt(roomNo.slice(-2)) * 0.02,
                                }}
                                whileHover={
                                  roomData.status !== "full"
                                    ? { scale: 1.05 }
                                    : {}
                                }
                                whileTap={
                                  roomData.status !== "full"
                                    ? { scale: 0.95 }
                                    : {}
                                }
                                onClick={() =>
                                  roomData.status !== "full" &&
                                  applyForRoom(roomNo)
                                }
                                disabled={
                                  roomData.status === "full" || applying
                                }
                                className={`btn btn-sm flex-col h-auto py-3 ${getRoomStatusColor(
                                  roomData.status
                                )} text-white`}
                              >
                                <span className="font-bold text-lg">
                                  {roomNo}
                                </span>
                                <span className="text-xs opacity-90">
                                  {getRoomStatusText(roomData.availableBeds)}
                                </span>
                              </motion.button>
                            )
                          )}
                        </div>
                      )}

                      {/* Legend */}
                      <div className="mt-6 flex justify-center">
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span>Available (2+ beds)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                            <span>Limited (1 bed)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span>Full</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {applying && (
                  <div className="flex justify-center mt-6">
                    <div className="loading loading-spinner loading-lg text-primary"></div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Room Layout Modal */}
        <AnimatePresence>
          {showRoomLayout && selectedRoomForLayout && (
            <RoomLayout
              roomNumber={selectedRoomForLayout}
              block={selectedBlock}
              onBedSelect={handleBedSelection}
              onClose={() => setShowRoomLayout(false)}
              isAdminMode={true}
            />
          )}
        </AnimatePresence>

        {/* Admin Notes Modal */}
        <AnimatePresence>
          {showNotesModal && selectedBed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowNotesModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-base-100 rounded-2xl p-8 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-primary">
                    {isChangeRoom ? "Change Room" : "Allocate Room"}
                  </h3>
                  <button
                    onClick={() => setShowNotesModal(false)}
                    className="btn btn-ghost btn-circle btn-sm"
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>

                {/* Selected Room & Bed Info */}
                <div className="mb-6 p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">
                    Selected Room & Bed
                  </h4>
                  <p className="text-base-content">
                    Room {selectedRoomForLayout}/{selectedBlock} - Bed{" "}
                    {selectedBed}
                  </p>
                </div>

                {/* Admin Notes */}
                <div className="mb-6">
                  <label className="label">
                    <span className="label-text font-medium">
                      Admin Notes (Optional)
                    </span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full h-24 resize-none"
                    placeholder={`Add notes about this ${
                      isChangeRoom ? "room change" : "room allocation"
                    }...`}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    maxLength={300}
                  />
                  <div className="text-xs text-base-content/60 mt-1">
                    {adminNotes.length}/300 characters
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowNotesModal(false)}
                    className="btn btn-ghost"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRoomAllocation}
                    className="btn btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        {isChangeRoom ? "Changing..." : "Allocating..."}
                      </>
                    ) : (
                      <>{isChangeRoom ? "Change Room" : "Allocate Room"}</>
                    )}
                  </button>
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
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowSuccessModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-base-100 rounded-2xl p-8 max-w-md w-full"
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
                      Action Completed
                    </h3>
                    <p className="text-sm text-base-content/70">
                      Operation completed successfully
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-base-content">{successMessage}</p>
                </div>

                <div className="flex justify-end">
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
      </div>
    </AdminLayout>
  );
}
