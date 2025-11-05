"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../../../components/AdminLayout";
import RoomLayoutDisplay from "../../../components/RoomLayoutDisplay";
import { requireAuth } from "../../../utils/auth";

// Miniature Room Card Component
const MiniatureRoomCard = ({ room, onClick }) => {
  const occupancyPercentage = (room.currentOccupancy / room.capacity) * 100;
  const getOccupancyColor = () => {
    if (occupancyPercentage === 100) return "bg-red-500";
    if (occupancyPercentage >= 75) return "bg-orange-500";
    if (occupancyPercentage >= 50) return "bg-yellow-500";
    if (occupancyPercentage > 0) return "bg-blue-500";
    return "bg-green-500";
  };

  // Get allocated beds from the room data
  const allocatedBeds = room.allocatedBedNumbers
    ? typeof room.allocatedBedNumbers === "string"
      ? JSON.parse(room.allocatedBedNumbers)
      : room.allocatedBedNumbers
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{
        scale: 1.08,
        y: -4,
        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => onClick(room)}
      className="cursor-pointer bg-base-100 rounded-lg shadow-md hover:shadow-2xl transition-all duration-200 p-3 border-2 border-base-300 hover:border-primary"
    >
      {/* Room Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-sm text-primary">{room.roomNumber}</div>
        <div className="text-xs badge badge-ghost">
          {room.currentOccupancy}/{room.capacity}
        </div>
      </div>

      {/* Miniature Bed Layout */}
      <div className="relative bg-base-200 rounded-md p-2 h-20 mb-2">
        <div className="absolute inset-1 border-2 border-base-300 rounded-sm bg-white">
          {/* Door indicator at top */}
          <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-amber-600 rounded-b"></div>

          {/* Mini beds in 2x2 grid */}
          <div className="grid grid-cols-2 gap-1 p-1.5 h-full">
            {Array.from({ length: 4 }, (_, index) => {
              const bedNumber = index + 1;
              const isOccupied = allocatedBeds.includes(bedNumber);
              return (
                <motion.div
                  key={bedNumber}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative rounded-sm border transition-all duration-200 ${
                    isOccupied
                      ? "bg-red-200 border-red-400 shadow-sm"
                      : "bg-green-100 border-green-300"
                  } flex items-center justify-center`}
                >
                  <div
                    className={`text-[8px] font-bold ${
                      isOccupied ? "text-red-700" : "text-green-700"
                    }`}
                  >
                    {bedNumber}
                  </div>
                  {isOccupied && (
                    <div className="absolute inset-0 bg-red-400/20"></div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Occupancy Bar with Animation */}
      <div className="w-full bg-base-300 rounded-full h-1.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${occupancyPercentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${getOccupancyColor()}`}
        />
      </div>

      {/* Status Badge */}
      {occupancyPercentage === 100 && (
        <div className="mt-1 text-center">
          <span className="badge badge-error badge-xs">FULL</span>
        </div>
      )}
    </motion.div>
  );
};

// Floor Block Component
const FloorBlock = ({ floor, block, rooms, onRoomClick }) => {
  const occupiedCount = rooms.filter((r) => r.currentOccupancy > 0).length;
  const totalCount = rooms.length;
  const blockOccupancyRate =
    totalCount > 0 ? ((occupiedCount / totalCount) * 100).toFixed(0) : "0";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="bg-base-100 rounded-xl shadow-lg p-4 border-2 border-base-300 hover:border-primary/50 transition-all duration-300"
    >
      {/* Block Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-primary/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold shadow-md">
            {block}
          </div>
          <div>
            <h3 className="font-bold text-base text-base-content">
              Block {block}
            </h3>
            <p className="text-xs text-base-content/60">
              {blockOccupancyRate}% Occupied
            </p>
          </div>
        </div>
        <div className="badge badge-outline badge-sm">
          {occupiedCount}/{totalCount} Rooms
        </div>
      </div>

      {/* Rooms Grid - 3 rows x 5 columns */}
      <div className="grid grid-cols-5 gap-2">
        {rooms
          .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
          .map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <MiniatureRoomCard room={room} onClick={onRoomClick} />
            </motion.div>
          ))}
      </div>
    </motion.div>
  );
};

// Floor Level Component
const FloorLevel = ({ floor, rooms, onRoomClick }) => {
  const blockARooms = rooms.filter((r) => r.block === "A");
  const blockBRooms = rooms.filter((r) => r.block === "B");

  const totalOccupied = rooms.filter((r) => r.currentOccupancy > 0).length;
  const totalRooms = rooms.length;
  const totalStudents = rooms.reduce((sum, r) => sum + r.currentOccupancy, 0);
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const occupancyRate =
    totalRooms > 0 ? ((totalOccupied / totalRooms) * 100).toFixed(0) : "0";
  const studentOccupancyRate =
    totalCapacity > 0
      ? ((totalStudents / totalCapacity) * 100).toFixed(0)
      : "0";

  const floorLabel = floor === 1 ? "1st" : floor === 2 ? "2nd" : "3rd";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
      className="mb-8"
    >
      {/* Floor Header */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl p-5 shadow-xl"
      >
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center font-bold text-2xl shadow-lg"
          >
            {floor}
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {floorLabel} Floor
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
                />
              </svg>
            </h2>
            <p className="text-sm opacity-90">
              {totalOccupied} of {totalRooms} rooms occupied • {totalStudents}{" "}
              of {totalCapacity} beds occupied
            </p>
          </div>
        </div>
        <div className="text-right">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-4xl font-bold"
          >
            {studentOccupancyRate}%
          </motion.div>
          <div className="text-sm opacity-90">Student Occupancy</div>
        </div>
      </motion.div>

      {/* Blocks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FloorBlock
          floor={floor}
          block="A"
          rooms={blockARooms}
          onRoomClick={onRoomClick}
        />
        <FloorBlock
          floor={floor}
          block="B"
          rooms={blockBRooms}
          onRoomClick={onRoomClick}
        />
      </div>
    </motion.div>
  );
};

// Student Detail Modal Component (Same as in Students Page)
const StudentDetailModal = ({ student, onClose }) => {
  if (!student) return null;

  // Compute studentName from firstName and lastName if not available
  const studentName =
    student.studentName ||
    `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
    "Unknown Student";

  // Compute currentRoom from block and roomNo if not available
  const currentRoom =
    student.currentRoom ||
    (student.block && student.roomNo
      ? `${student.roomNo}/${student.block}`
      : null);

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-base-100 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-primary">Student Details</h3>
            <button onClick={onClose} className="btn btn-ghost btn-circle">
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
                      {student.profileImageUrl ? (
                        <img
                          src={student.profileImageUrl}
                          alt={studentName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary text-primary-content rounded-full flex items-center justify-center text-4xl font-bold">
                          {studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                      )}
                    </div>
                  </div>
                  <h4 className="card-title text-xl mt-4">{studentName}</h4>
                  <p className="text-base-content/70">
                    ID: {student.studentId || student.studentNumber}
                  </p>
                  {getStatusBadge(student)}
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
                        <p className="font-medium">{studentName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-base-content/70">
                          Email
                        </label>
                        <p className="font-medium">{student.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-base-content/70">
                          Phone Number
                        </label>
                        <p className="font-medium">{student.phoneNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-base-content/70">
                          Blood Group
                        </label>
                        <p className="font-medium text-error">
                          {student.bloodGroup || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-base-content/70">
                          Address
                        </label>
                        <p className="font-medium">
                          {student.address || "Not provided"}
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
                          {student.studentId || student.studentNumber}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-base-content/70">
                          Department
                        </label>
                        <p className="font-medium">{student.department}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-base-content/70">
                          Year
                        </label>
                        <p className="font-medium">
                          {formatYear(student.year)}
                        </p>
                      </div>
                      {student.session && (
                        <div>
                          <label className="text-sm font-medium text-base-content/70">
                            Session
                          </label>
                          <p className="font-medium">{student.session}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-base-content/70">
                          Registration Date
                        </label>
                        <p className="font-medium">
                          {student.registrationDate
                            ? new Date(
                                student.registrationDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-base-content/70">
                          Account Status
                        </label>
                        <p className="font-medium">
                          {student.isActive !== undefined ? (
                            student.isActive ? (
                              <span className="text-success">Active</span>
                            ) : (
                              <span className="text-error">Inactive</span>
                            )
                          ) : (
                            "N/A"
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
                    {student.isRoomAllocated || student.bedNo || currentRoom ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-base-content/70">
                            Current Room
                          </label>
                          <p className="font-medium text-success">
                            Room {currentRoom || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-base-content/70">
                            Bed Number
                          </label>
                          <p className="font-medium text-success">
                            Bed {student.bedNo || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-base-content/70">
                            Allocation Date
                          </label>
                          <p className="font-medium">
                            {student.roomAllocationDate
                              ? new Date(
                                  student.roomAllocationDate
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
              onClick={() => {
                // Redirect to students page with contact modal
                window.location.href = `/admin/students?action=contact&studentId=${
                  student.studentId || student.id
                }`;
              }}
              className="btn btn-info"
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

            {(student.isRoomAllocated || student.bedNo) && (
              <button
                onClick={() => {
                  // Redirect to students page with cancel room action
                  window.location.href = `/admin/students?action=cancelRoom&studentId=${
                    student.studentId || student.id
                  }`;
                }}
                className="btn btn-warning"
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
            {(student.isRoomAllocated || student.bedNo) && (
              <button
                onClick={() => {
                  // Redirect to students page with change room action
                  window.location.href = `/admin/students?action=changeRoom&studentId=${
                    student.studentId || student.id
                  }`;
                }}
                className="btn btn-info"
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
            {!student.isRoomAllocated && !student.bedNo && (
              <button
                onClick={() => {
                  // Redirect to students page with allocate room action
                  window.location.href = `/admin/students?action=allocateRoom&studentId=${
                    student.studentId || student.id
                  }`;
                }}
                className="btn btn-success"
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
              onClick={() => {
                // Redirect to students page with delete action
                window.location.href = `/admin/students?action=delete&studentId=${
                  student.studentId || student.id
                }`;
              }}
              className="btn btn-error"
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
    </AnimatePresence>
  );
};

// Room Detail Modal Component
const RoomDetailModal = ({ room, onClose }) => {
  const [roomLayout, setRoomLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  useEffect(() => {
    if (room) {
      fetchRoomLayout();
    }
  }, [room]);

  const fetchRoomLayout = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/room-layout/${room.block}/${room.roomNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRoomLayout(data);
      }
    } catch (error) {
      console.error("Error fetching room layout:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBedClick = async (bedNumber) => {
    if (roomLayout?.roommates) {
      const roommate = roomLayout.roommates.find((r) => r.bedNo === bedNumber);
      if (roommate) {
        // Fetch full student details from the students API
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/students/by-student-id/${roommate.studentId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const fullStudentData = await response.json();
            setSelectedStudent(fullStudentData);
            setShowStudentModal(true);
          } else {
            // Fallback to roommate data if API fails
            setSelectedStudent(roommate);
            setShowStudentModal(true);
          }
        } catch (error) {
          console.error("Error fetching student details:", error);
          // Fallback to roommate data
          setSelectedStudent(roommate);
          setShowStudentModal(true);
        }
      }
    }
  };

  if (!room) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-base-100 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Modal Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary to-secondary text-white p-6 rounded-t-2xl z-10 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Room {room.roomNumber}/{room.block}
                </h2>
                <p className="text-sm opacity-90">
                  Floor {room.floor} • Block {room.block} •{" "}
                  {room.currentOccupancy}/{room.capacity} Occupied
                </p>
              </div>
              <button
                onClick={onClose}
                className="btn btn-circle btn-ghost hover:bg-white/20"
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
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="loading loading-spinner loading-lg text-primary"></div>
              </div>
            ) : roomLayout ? (
              <div className="space-y-6">
                {/* Room Layout */}
                <RoomLayoutDisplay
                  roomData={roomLayout}
                  showRoommateDetails={true}
                  isAdminView={true}
                  onBedClick={handleBedClick}
                  showClickable={true}
                />

                {/* Roommates List */}
                {roomLayout.roommates && roomLayout.roommates.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold mb-4 text-base-content">
                      Current Residents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {roomLayout.roommates.map((roommate, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-base-200 rounded-lg p-4 flex items-start gap-3"
                        >
                          <div className="avatar">
                            <div className="w-12 h-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                              <img
                                src={
                                  roommate.profileImageUrl ||
                                  "/images/user_icon.png"
                                }
                                alt={roommate.studentName}
                                className="object-cover"
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-base-content">
                              {roommate.studentName}
                            </div>
                            <div className="text-sm text-base-content/70">
                              {roommate.studentNumber || roommate.studentId}
                            </div>
                            <div className="text-xs text-base-content/60">
                              Bed {roommate.bedNo} • {roommate.department}
                            </div>
                            <div className="mt-1 flex gap-2 flex-wrap">
                              <div className="badge badge-sm badge-outline">
                                {roommate.bloodGroup}
                              </div>
                              <div className="badge badge-sm badge-primary">
                                Year {roommate.year}
                              </div>
                              {roommate.session && (
                                <div className="badge badge-sm badge-secondary">
                                  {roommate.session}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Room Details */}
                <div className="bg-base-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-3 text-base-content">
                    Room Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-base-content/70">Capacity:</span>
                      <span className="ml-2 font-semibold">
                        {room.capacity} Beds
                      </span>
                    </div>
                    <div>
                      <span className="text-base-content/70">Available:</span>
                      <span className="ml-2 font-semibold">
                        {room.capacity - room.currentOccupancy} Beds
                      </span>
                    </div>
                    <div>
                      <span className="text-base-content/70">Type:</span>
                      <span className="ml-2 font-semibold">
                        {room.roomType}
                      </span>
                    </div>
                    <div>
                      <span className="text-base-content/70">Status:</span>
                      <span
                        className={`ml-2 font-semibold ${
                          room.currentOccupancy >= room.capacity
                            ? "text-error"
                            : "text-success"
                        }`}
                      >
                        {room.currentOccupancy >= room.capacity
                          ? "Full"
                          : "Available"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-base-content/70">
                Unable to load room details
              </div>
            )}
          </div>
        </motion.div>

        {/* Student Detail Modal */}
        {showStudentModal && selectedStudent && (
          <StudentDetailModal
            student={selectedStudent}
            onClose={() => {
              setShowStudentModal(false);
              setSelectedStudent(null);
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Main Room Management Page
export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    totalCapacity: 0,
    totalOccupied: 0,
  });

  // Bulk deallocation state
  const [showBulkDeallocateModal, setShowBulkDeallocateModal] = useState(false);
  const [deallocating, setDeallocating] = useState(false);
  const [deallocateResult, setDeallocateResult] = useState(null);

  useEffect(() => {
    if (!requireAuth("Admin")) {
      return;
    }
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rooms`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRooms(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (roomsData) => {
    const totalRooms = roomsData.length;
    const occupiedRooms = roomsData.filter(
      (r) => r.currentOccupancy > 0
    ).length;
    const totalCapacity = roomsData.reduce((sum, r) => sum + r.capacity, 0);
    const totalOccupied = roomsData.reduce(
      (sum, r) => sum + r.currentOccupancy,
      0
    );

    setStats({
      totalRooms,
      occupiedRooms,
      totalCapacity,
      totalOccupied,
    });
  };

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
  };

  const closeModal = () => {
    setSelectedRoom(null);
  };

  // Get all student IDs from filtered rooms
  const getStudentIdsFromFilteredRooms = () => {
    const studentIds = [];
    filteredRooms.forEach((room) => {
      if (room.roommates && room.roommates.length > 0) {
        room.roommates.forEach((student) => {
          if (student.studentId || student.studentNumber) {
            studentIds.push(student.studentId || student.studentNumber);
          }
        });
      }
    });
    return studentIds;
  };

  const handleBulkDeallocate = async () => {
    const studentIds = getStudentIdsFromFilteredRooms();

    if (studentIds.length === 0) {
      alert("No students found in the filtered rooms");
      return;
    }

    setDeallocating(true);
    setDeallocateResult(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/admin/bulk-deallocate`,
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
        setDeallocateResult({
          success: true,
          ...data,
        });
        // Refresh rooms data
        await fetchRooms();
      } else {
        setDeallocateResult({
          success: false,
          message: data.message || "Failed to deallocate rooms",
        });
      }
    } catch (error) {
      console.error("Error during bulk deallocation:", error);
      setDeallocateResult({
        success: false,
        message: "An error occurred during deallocation",
      });
    } finally {
      setDeallocating(false);
    }
  };

  // Filter rooms based on search term
  const filteredRooms = rooms.filter((room) => {
    if (!searchTerm) return true;

    // Search by room number or block
    const roomMatches =
      room.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.block?.toLowerCase().includes(searchTerm.toLowerCase());

    if (roomMatches) return true;

    // Get roommates/students from room's allocated data
    const roommates = room.roommates || [];

    // Search by student information
    const studentMatches = roommates.some((student) => {
      const fullName = `${student.firstName || ""} ${
        student.lastName || ""
      }`.toLowerCase();
      const studentId = (
        student.studentId ||
        student.studentNumber ||
        ""
      ).toLowerCase();
      const department = (student.department || "").toLowerCase();
      const session = (student.session || "").toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      return (
        fullName.includes(searchLower) ||
        studentId.includes(searchLower) ||
        department.includes(searchLower) ||
        session.includes(searchLower)
      );
    });

    return studentMatches;
  });

  if (loading) {
    return (
      <AdminLayout activeTab="room-management">
        <div className="flex-1 flex items-center justify-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  // Group rooms by floor (use filtered rooms)
  const floor3Rooms = filteredRooms.filter((r) => r.floor === 3);
  const floor2Rooms = filteredRooms.filter((r) => r.floor === 2);
  const floor1Rooms = filteredRooms.filter((r) => r.floor === 1);

  const occupancyRate = (
    (stats.totalOccupied / stats.totalCapacity) *
    100
  ).toFixed(1);

  return (
    <AdminLayout activeTab="room-management">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-base-100 shadow-sm border-b border-base-300 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-base-content">
              Room Management
            </h1>
            <p className="text-base-content/70 mt-1">
              Visual overview of all hall rooms and occupancy
            </p>
          </div>

          {/* Stats Summary */}
          <div className="flex gap-4">
            <div className="stats shadow">
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs">Total Rooms</div>
                <div className="stat-value text-2xl text-primary">
                  {stats.totalRooms}
                </div>
              </div>
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs">Occupied</div>
                <div className="stat-value text-2xl text-secondary">
                  {stats.occupiedRooms}
                </div>
              </div>
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs">Occupancy Rate</div>
                <div className="stat-value text-2xl text-accent">
                  {occupancyRate}%
                </div>
              </div>
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs">Students</div>
                <div className="stat-value text-2xl text-info">
                  {stats.totalOccupied}/{stats.totalCapacity}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto bg-base-200">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-8 max-w-7xl mx-auto"
        >
          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-base-100 rounded-lg shadow-md p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by student name, ID, session, department, room number, or block..."
                    className="input input-bordered w-full pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg
                    className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50"
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
                </div>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="btn btn-outline btn-error"
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
                    />
                  </svg>
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-base-content/70">
                {searchTerm && (
                  <>
                    Showing {filteredRooms.length} of {rooms.length} rooms
                  </>
                )}
              </div>
              {filteredRooms.length > 0 &&
                filteredRooms.some((r) => r.currentOccupancy > 0) && (
                  <button
                    onClick={() => setShowBulkDeallocateModal(true)}
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
                    Deallocate Filtered Rooms
                  </button>
                )}
            </div>
          </motion.div>
          {/* Hall Layout Info */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-info/10 border-l-4 border-info rounded-lg p-4 flex items-start gap-3"
          >
            <svg
              className="w-6 h-6 text-info mt-1 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold text-base-content">
                Hall Layout Overview
              </h3>
              <p className="text-sm text-base-content/70 mt-1">
                Floors are displayed from top to bottom (3rd floor at top, 1st
                floor at bottom). Click on any room to view detailed layout and
                resident information.
              </p>
            </div>
          </motion.div>

          {/* No Results Message */}
          {searchTerm && filteredRooms.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-base-100 rounded-lg shadow-md p-12 text-center"
            >
              <svg
                className="w-20 h-20 mx-auto text-base-content/30 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl font-bold text-base-content/70 mb-2">
                No Rooms Found
              </h3>
              <p className="text-base-content/60 mb-4">
                No rooms match your search criteria &quot;{searchTerm}&quot;
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="btn btn-primary"
              >
                Clear Search
              </button>
            </motion.div>
          )}

          {/* 3rd Floor (Top) */}
          {floor3Rooms.length > 0 && (
            <FloorLevel
              floor={3}
              rooms={floor3Rooms}
              onRoomClick={handleRoomClick}
            />
          )}

          {/* 2nd Floor (Middle) */}
          {floor2Rooms.length > 0 && (
            <FloorLevel
              floor={2}
              rooms={floor2Rooms}
              onRoomClick={handleRoomClick}
            />
          )}

          {/* 1st Floor (Bottom) */}
          {floor1Rooms.length > 0 && (
            <FloorLevel
              floor={1}
              rooms={floor1Rooms}
              onRoomClick={handleRoomClick}
            />
          )}

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-base-100 rounded-xl shadow-lg p-6 border-2 border-base-300 sticky bottom-0 z-10"
          >
            <h3 className="font-bold text-lg mb-4 text-base-content flex items-center gap-2">
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Occupancy Legend
            </h3>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded shadow-sm"></div>
                <span className="text-sm font-medium">Empty (0%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded shadow-sm"></div>
                <span className="text-sm font-medium">25-50% Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded shadow-sm"></div>
                <span className="text-sm font-medium">50-75% Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded shadow-sm"></div>
                <span className="text-sm font-medium">75-99% Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded shadow-sm"></div>
                <span className="text-sm font-medium">100% Full</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-base-300 text-sm text-base-content/70">
              <span className="font-semibold">Tip:</span> Hover over miniature
              rooms to preview, click to view full details
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <RoomDetailModal room={selectedRoom} onClose={closeModal} />
      )}

      {/* Bulk Deallocate Confirmation Modal */}
      <AnimatePresence>
        {showBulkDeallocateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4"
            onClick={() => !deallocating && setShowBulkDeallocateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-base-100 rounded-2xl p-8 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {!deallocateResult ? (
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
                        Confirm Bulk Deallocation
                      </h3>
                      <p className="text-base-content/70">
                        You are about to deallocate{" "}
                        <span className="font-bold text-error">
                          {getStudentIdsFromFilteredRooms().length} student(s)
                        </span>{" "}
                        from{" "}
                        <span className="font-bold text-error">
                          {
                            filteredRooms.filter((r) => r.currentOccupancy > 0)
                              .length
                          }{" "}
                          room(s)
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
                            deallocated.
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
                          This action will remove room allocations for all
                          students in the filtered results. This action cannot
                          be undone.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowBulkDeallocateModal(false)}
                      className="btn btn-outline"
                      disabled={deallocating}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkDeallocate}
                      className="btn btn-error"
                      disabled={deallocating}
                    >
                      {deallocating ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Deallocating...
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
                          Confirm Deallocation
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div
                      className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                        deallocateResult.success
                          ? "bg-success/20"
                          : "bg-error/20"
                      }`}
                    >
                      {deallocateResult.success ? (
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
                          />
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
                          />
                        </svg>
                      )}
                    </div>
                    <h3
                      className={`text-2xl font-bold mb-2 ${
                        deallocateResult.success ? "text-success" : "text-error"
                      }`}
                    >
                      {deallocateResult.success
                        ? "Deallocation Successful"
                        : "Deallocation Failed"}
                    </h3>
                    <p className="text-base-content/70">
                      {deallocateResult.message}
                    </p>
                  </div>

                  {deallocateResult.success && (
                    <div className="bg-base-200 rounded-lg p-4 mb-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-success">
                            {deallocateResult.deallocatedCount}
                          </div>
                          <div className="text-sm text-base-content/70">
                            Students Deallocated
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-info">
                            {deallocateResult.affectedRoomsCount}
                          </div>
                          <div className="text-sm text-base-content/70">
                            Rooms Updated
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-warning">
                            {deallocateResult.cancelledAllocationsCount || 0}
                          </div>
                          <div className="text-sm text-base-content/70">
                            Allocations Cancelled
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-base-content">
                            {deallocateResult.totalRequested}
                          </div>
                          <div className="text-sm text-base-content/70">
                            Total Requested
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {deallocateResult.failedStudents &&
                    deallocateResult.failedStudents.length > 0 && (
                      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
                        <p className="font-semibold text-warning mb-2">
                          Failed Students (
                          {deallocateResult.failedStudents.length}
                          ):
                        </p>
                        <ul className="text-sm text-base-content/70 space-y-1 max-h-40 overflow-y-auto">
                          {deallocateResult.failedStudents.map(
                            (student, idx) => (
                              <li key={idx}>• {student}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setShowBulkDeallocateModal(false);
                        setDeallocateResult(null);
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
    </AdminLayout>
  );
}
