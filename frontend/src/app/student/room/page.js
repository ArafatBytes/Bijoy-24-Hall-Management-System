"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import RoomLayout from "../../../components/RoomLayout";
import RoomLayoutDisplay from "../../../components/RoomLayoutDisplay";
import {
  getCurrentUser,
  requireAuth,
  getAuthHeaders,
} from "../../../utils/auth";
import { getAvatarImageUrl } from "../../../utils/profileImage";
import StudentNavbar from "../../../components/StudentNavbar";

export default function StudentRoom() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [roomAvailability, setRoomAvailability] = useState({});
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showRoomLayout, setShowRoomLayout] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [studentNotes, setStudentNotes] = useState("");
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedRoomForLayout, setSelectedRoomForLayout] = useState(null);
  const [allocationStatus, setAllocationStatus] = useState({
    isAllocated: false,
    hasPendingRequest: false,
    pendingRequest: null,
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRoomLayout, setCurrentRoomLayout] = useState(null);
  const [loadingCurrentRoom, setLoadingCurrentRoom] = useState(false);
  const [showRoommateModal, setShowRoommateModal] = useState(false);
  const [selectedRoommate, setSelectedRoommate] = useState(null);

  const floors = [1, 2, 3];
  const blocks = ["A", "B"];

  useEffect(() => {
    if (!requireAuth("Student")) {
      return;
    }
    setError(""); // Clear any previous errors
    loadStudentData();
    loadAllocationStatus();
  }, []);

  // Load current room layout when student has an allocated room
  useEffect(() => {
    if (student && student.block && student.roomNo) {
      loadCurrentRoomLayout();
    }
  }, [student]);

  const loadCurrentRoomLayout = async () => {
    if (!student?.block || !student?.roomNo) return;

    try {
      setLoadingCurrentRoom(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/room-layout/${student.block}/${student.roomNo}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const layoutData = await response.json();
        console.log("Room layout data received:", layoutData);
        console.log("Roommates in layout data:", layoutData.roommates);
        setCurrentRoomLayout(layoutData);
      } else {
        console.error("Failed to load current room layout:", response.status);
        setCurrentRoomLayout(null);
      }
    } catch (error) {
      console.error("Error loading current room layout:", error);
      setCurrentRoomLayout(null);
    } finally {
      setLoadingCurrentRoom(false);
    }
  };

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
        console.log("Student data received:", studentData);
        console.log("Profile image URL:", studentData.profileImageUrl);
        setStudent(studentData);
        setError(""); // Clear any previous errors
      } else if (response.status === 401) {
        window.location.href = "/login";
      } else {
        // Handle other HTTP errors
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        console.error("API Error:", response.status, errorData);
        setError(
          `Failed to load student data: ${errorData.message || "Server error"}`
        );
      }
    } catch (error) {
      console.error("Error loading student data:", error);
      setError("Failed to load student data");
    } finally {
      setLoading(false);
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
        console.log("Room page - Allocation status data:", statusData);
        setAllocationStatus(statusData);
      } else {
        console.error(
          "Room page - Failed to load allocation status:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error loading allocation status:", error);
    }
  };

  const openApplicationModal = () => {
    setIsEditMode(false);
    setShowModal(true);
    setSelectedFloor(null);
    setSelectedBlock(null);
    setRoomAvailability({});
    setError("");
    setSuccess("");
  };

  const openEditRequestModal = async () => {
    setIsEditMode(true);
    setShowModal(true);
    setError("");
    setSuccess("");

    // Pre-populate with current request data from RoomAllotments table fields
    if (allocationStatus.pendingRequest) {
      // Use the correct field names from RoomAllotments table
      const requestedBlock =
        allocationStatus.pendingRequest.requestedRoom.split("/")[1]; // From RequestedBlock field
      const requestedRoomNo =
        allocationStatus.pendingRequest.requestedRoom.split("/")[0]; // From RequestedRoomNo field
      const requestedFloor = parseInt(requestedRoomNo.charAt(0)); // Extract floor from room number

      console.log(
        "Edit mode - Current request:",
        allocationStatus.pendingRequest
      );
      console.log(
        "Edit mode - RequestedBlock:",
        requestedBlock,
        "RequestedRoomNo:",
        requestedRoomNo,
        "Floor:",
        requestedFloor
      );

      // Pre-populate the form with current request data
      setSelectedFloor(requestedFloor);
      setSelectedBlock(requestedBlock);

      // Load room availability for the current floor/block
      setLoadingRooms(true);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/availability/${requestedFloor}/${requestedBlock}`,
          { headers: getAuthHeaders() }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Edit mode - Room availability loaded:", data);
          setRoomAvailability(data);
        } else {
          console.error(
            "Edit mode - Failed to load room availability:",
            response.status,
            response.statusText
          );
          setError("Failed to load room availability");
        }
      } catch (error) {
        console.error("Error loading room availability:", error);
        setError("Failed to load room availability");
      } finally {
        setLoadingRooms(false);
      }

      // Don't automatically show room layout - let user navigate through the full selection process
      setShowRoomLayout(false);
      setSelectedRoomForLayout(null);
    }
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
        setError("Failed to load room availability");
      }
    } catch (error) {
      console.error("Error loading room availability:", error);
      setError("Failed to load room availability");
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleRoomSelection = (roomNo) => {
    setSelectedRoomForLayout(roomNo);
    setShowRoomLayout(true);
    setShowModal(false);
  };

  const handleBedSelection = (bedNo) => {
    // Store the selected bed and show notes modal
    setSelectedBed(bedNo);
    setShowRoomLayout(false);
    setShowNotesModal(true);
    // Pre-fill notes if editing
    if (isEditMode && allocationStatus.pendingRequest?.studentNotes) {
      setStudentNotes(allocationStatus.pendingRequest.studentNotes);
    } else {
      setStudentNotes("");
    }
  };

  const handleSubmitWithNotes = async () => {
    setApplying(true);
    setError("");

    try {
      let response, endpoint, method;

      if (isEditMode) {
        // Edit existing request
        endpoint = `edit-request/${allocationStatus.pendingRequest.id}`;
        method = "POST";
        console.log(
          "Edit mode - API call:",
          endpoint,
          "Request ID:",
          allocationStatus.pendingRequest.id
        );
      } else {
        // Determine if this is a room change or new application
        const isRoomChange = allocationStatus.currentStatus === "approved";
        endpoint = isRoomChange ? "change" : "apply";
        method = "POST";
      }

      const requestBody = {
        Block: selectedBlock,
        RoomNo: selectedRoomForLayout,
        BedNo: selectedBed,
        Notes: studentNotes || "",
      };

      console.log("API Request:", method, endpoint, "Body:", requestBody);

      response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/${endpoint}`,
        {
          method: method,
          headers: getAuthHeaders(),
          body: JSON.stringify(requestBody),
        }
      );

      let data;
      const contentType = response.headers.get("content-type");

      try {
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const textResponse = await response.text();
          console.log(
            "Room request response (text):",
            response.status,
            textResponse
          );
          data = { message: textResponse };
        }
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        data = {
          message: `Server error (${response.status}): ${response.statusText}`,
        };
      }
      console.log("Room request response:", response.status, data);

      if (response.ok) {
        if (isEditMode) {
          setSuccess(
            `Room request updated successfully! New request: ${selectedRoomForLayout}/${selectedBlock} (Bed ${selectedBed}). Please wait for admin approval.`
          );
        } else if (
          allocationStatus.currentStatus === "approved" ||
          allocationStatus.currentStatus === "approved_with_pending_change"
        ) {
          setSuccess(
            `Room change request submitted successfully! Requested room: ${selectedRoomForLayout}/${selectedBlock} (Bed ${selectedBed}). Please wait for admin approval.`
          );
        } else {
          setSuccess(
            `Room application submitted successfully! Requested room: ${selectedRoomForLayout}/${selectedBlock} (Bed ${selectedBed}). Please wait for admin approval.`
          );
        }
        setShowRoomLayout(false);
        setShowModal(false);
        setShowNotesModal(false);
        setIsEditMode(false);
        setStudentNotes("");
        setSelectedBed(null);
        // Only refresh allocation status, not student data (to prevent premature updates)
        loadAllocationStatus(); // This will show the new pending request
      } else {
        console.error("Room request failed:", response.status, data);
        setError(
          data.message ||
            data.title ||
            `Failed to ${
              isEditMode
                ? "update"
                : allocationStatus.currentStatus === "approved"
                ? "change"
                : "apply for"
            } room`
        );
      }
    } catch (error) {
      console.error("Error with room request:", error);
      setError(
        `Failed to ${
          isEditMode
            ? "update"
            : allocationStatus.currentStatus === "approved"
            ? "change"
            : "apply for"
        } room`
      );
    } finally {
      setApplying(false);
    }
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
    if (availableBeds >= 3) return `${availableBeds} beds available`;
    if (availableBeds > 0)
      return `${availableBeds} bed${availableBeds > 1 ? "s" : ""} left`;
    return "Full";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300">
      {/* Navbar */}
      <StudentNavbar student={student} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="alert alert-success mb-6"
            >
              <span>{success}</span>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="alert alert-error mb-6"
            >
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Room Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card bg-base-100 shadow-xl mb-8"
        >
          <div className="card-body text-center py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-primary mb-4">
                Room Allocation Status
              </h2>

              {/* Approved Status */}
              {allocationStatus.currentStatus === "approved" &&
                allocationStatus.currentAllocation && (
                  <div className="space-y-4">
                    <div className="badge badge-success badge-lg">
                      ✓ Room Allocated
                    </div>
                    <div className="bg-base-200 rounded-lg p-6 max-w-md mx-auto">
                      <h3 className="text-xl font-semibold mb-4">
                        Your Current Room
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-left">
                        <div>
                          <span className="font-medium text-base-content/70">
                            Block:
                          </span>
                          <p className="text-lg font-bold text-primary">
                            {
                              allocationStatus.currentAllocation.room.split(
                                "/"
                              )[1]
                            }
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-base-content/70">
                            Room No:
                          </span>
                          <p className="text-lg font-bold text-primary">
                            {
                              allocationStatus.currentAllocation.room.split(
                                "/"
                              )[0]
                            }
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-base-content/70">
                            Bed No:
                          </span>
                          <p className="text-lg font-bold text-primary">
                            {allocationStatus.currentAllocation.bed}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-base-content/70">
                            Allocated:
                          </span>
                          <p className="text-sm text-base-content/70">
                            {allocationStatus.currentAllocation.allotmentDate
                              ? new Date(
                                  allocationStatus.currentAllocation.allotmentDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      {allocationStatus.currentAllocation.adminNotes && (
                        <div className="mt-4 p-3 bg-success/10 rounded-lg">
                          <p className="text-sm font-medium text-success">
                            Admin Notes:
                          </p>
                          <p className="text-sm text-base-content/80">
                            {allocationStatus.currentAllocation.adminNotes}
                          </p>
                        </div>
                      )}
                      <div className="mt-6 flex gap-3 justify-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={openApplicationModal}
                          className="btn btn-outline btn-primary"
                        >
                          Request Room Change
                        </motion.button>
                      </div>
                    </div>

                    {/* Room Layout Section */}
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold mb-4 text-center">
                        Your Room Layout
                      </h3>
                      {loadingCurrentRoom ? (
                        <div className="flex justify-center py-8">
                          <span className="loading loading-spinner loading-md"></span>
                          <span className="ml-2">Loading room layout...</span>
                        </div>
                      ) : (
                        <div>
                          <RoomLayoutDisplay
                            roomData={currentRoomLayout}
                            currentStudentBed={parseInt(
                              allocationStatus.currentAllocation.bed
                            )}
                            showRoommateDetails={true}
                            onBedClick={(roommate) => {
                              if (roommate && typeof roommate === "object") {
                                console.log(
                                  "Selected roommate data:",
                                  roommate
                                );
                                setSelectedRoommate(roommate);
                                setShowRoommateModal(true);
                              }
                            }}
                          />
                          {currentRoomLayout?.roommates?.some(
                            (r) =>
                              r.bedNo !==
                              parseInt(allocationStatus.currentAllocation.bed)
                          ) && (
                            <div className="text-center mt-4">
                              <p className="text-sm text-primary bg-primary/10 px-4 py-2 rounded-lg inline-block">
                                💡 Click on your roommates&apos; photos to view
                                their contact information
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Approved with Pending Room Change Status */}
              {allocationStatus.currentStatus ===
                "approved_with_pending_change" &&
                allocationStatus.currentAllocation &&
                allocationStatus.pendingRequest && (
                  <div className="space-y-6">
                    <div className="badge badge-warning badge-lg">
                      ⏳ Room Change Pending
                    </div>

                    {/* Current Room */}
                    <div className="bg-base-200 rounded-lg p-6 max-w-md mx-auto">
                      <h3 className="text-xl font-semibold mb-4 text-success">
                        Your Current Room
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-left">
                        <div>
                          <span className="font-medium text-base-content/70">
                            Block:
                          </span>
                          <p className="text-lg font-bold text-success">
                            {
                              allocationStatus.currentAllocation.room.split(
                                "/"
                              )[1]
                            }
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-base-content/70">
                            Room No:
                          </span>
                          <p className="text-lg font-bold text-success">
                            {
                              allocationStatus.currentAllocation.room.split(
                                "/"
                              )[0]
                            }
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-base-content/70">
                            Bed No:
                          </span>
                          <p className="text-lg font-bold text-success">
                            {allocationStatus.currentAllocation.bed}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-base-content/70">
                            Allocated:
                          </span>
                          <p className="text-sm text-base-content/70">
                            {allocationStatus.currentAllocation.allotmentDate
                              ? new Date(
                                  allocationStatus.currentAllocation.allotmentDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pending Room Change Request */}
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-6 max-w-md mx-auto">
                      <h3 className="text-xl font-semibold mb-4 text-warning">
                        Requested Room Change
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-left">
                        <div>
                          <span className="font-medium text-base-content/70">
                            New Block:
                          </span>
                          <p className="text-lg font-bold text-warning">
                            {
                              allocationStatus.pendingRequest.requestedRoom.split(
                                "/"
                              )[1]
                            }
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-base-content/70">
                            New Room:
                          </span>
                          <p className="text-lg font-bold text-warning">
                            {
                              allocationStatus.pendingRequest.requestedRoom.split(
                                "/"
                              )[0]
                            }
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-base-content/70">
                            New Bed:
                          </span>
                          <p className="text-lg font-bold text-warning">
                            {allocationStatus.pendingRequest.requestedBed}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-base-content/70">
                            Requested:
                          </span>
                          <p className="text-sm text-base-content/70">
                            {new Date(
                              allocationStatus.pendingRequest.requestDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {allocationStatus.pendingRequest.studentNotes && (
                        <div className="mt-4 p-3 bg-base-100 rounded-lg">
                          <p className="text-sm font-medium text-base-content/70">
                            Your notes:
                          </p>
                          <p className="text-sm text-base-content/80">
                            {allocationStatus.pendingRequest.studentNotes}
                          </p>
                        </div>
                      )}
                      <div className="mt-6 flex gap-3 justify-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={openEditRequestModal}
                          className="btn btn-outline btn-warning"
                        >
                          Edit Change Request
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}

              {/* Pending Status */}
              {allocationStatus.currentStatus === "pending" &&
                allocationStatus.pendingRequest && (
                  <div className="space-y-4">
                    <div className="badge badge-warning badge-lg">
                      ⏳ Pending Approval
                    </div>
                    <p className="text-base-content/70 mb-6">
                      Your request for Room{" "}
                      {allocationStatus.pendingRequest.requestedRoom} (Bed{" "}
                      {allocationStatus.pendingRequest.requestedBed}) is pending
                      admin approval
                    </p>
                    <div className="bg-base-200 rounded-lg p-4 max-w-md mx-auto">
                      <div className="text-sm text-base-content/70 mb-2">
                        Request submitted on:
                      </div>
                      <div className="font-medium">
                        {new Date(
                          allocationStatus.pendingRequest.requestDate
                        ).toLocaleDateString()}
                      </div>
                      {allocationStatus.pendingRequest.studentNotes && (
                        <div className="mt-3">
                          <div className="text-sm text-base-content/70 mb-1">
                            Your notes:
                          </div>
                          <div className="text-sm bg-base-100 p-2 rounded">
                            {allocationStatus.pendingRequest.studentNotes}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-4 flex-wrap justify-center">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={true}
                        className="btn btn-lg btn-outline btn-neutral cursor-not-allowed"
                      >
                        Request Pending
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={openEditRequestModal}
                        className="btn btn-lg btn-primary"
                      >
                        Edit Request
                      </motion.button>
                    </div>
                  </div>
                )}

              {/* Rejected Status */}
              {allocationStatus.currentStatus === "rejected" &&
                allocationStatus.rejectedRequest && (
                  <div className="space-y-4">
                    <div className="badge badge-error badge-lg">
                      ✗ Request Rejected
                    </div>
                    <p className="text-base-content/70 mb-6">
                      Your request for Room{" "}
                      {allocationStatus.rejectedRequest.requestedRoom} (Bed{" "}
                      {allocationStatus.rejectedRequest.requestedBed}) was
                      rejected by the admin
                    </p>
                    <div className="bg-base-200 rounded-lg p-4 max-w-md mx-auto">
                      <div className="grid grid-cols-2 gap-4 text-left mb-4">
                        <div>
                          <div className="text-sm text-base-content/70">
                            Request Date:
                          </div>
                          <div className="font-medium">
                            {new Date(
                              allocationStatus.rejectedRequest.requestDate
                            ).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-base-content/70">
                            Rejection Date:
                          </div>
                          <div className="font-medium">
                            {allocationStatus.rejectedRequest.rejectionDate
                              ? new Date(
                                  allocationStatus.rejectedRequest.rejectionDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                      {allocationStatus.rejectedRequest.adminNotes && (
                        <div className="p-3 bg-error/10 rounded-lg border border-error/20">
                          <p className="text-sm font-medium text-error mb-2">
                            Reason for Rejection:
                          </p>
                          <p className="text-sm text-base-content/80">
                            {allocationStatus.rejectedRequest.adminNotes}
                          </p>
                        </div>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={openApplicationModal}
                      className="btn btn-lg btn-primary"
                    >
                      Apply Again
                    </motion.button>
                  </div>
                )}

              {/* Cancelled Status */}
              {allocationStatus.currentStatus === "cancelled" &&
                allocationStatus.cancelledRequest && (
                  <div className="space-y-4">
                    <div className="badge badge-warning badge-lg">
                      ⚠️ Room Allocation Cancelled
                    </div>
                    <div className="bg-base-200 rounded-lg p-6 max-w-md mx-auto">
                      <h3 className="text-xl font-semibold mb-4 text-warning">
                        Previous Allocation Cancelled
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-left mb-4">
                        <div>
                          <span className="font-medium text-base-content/70">
                            Previous Room:
                          </span>
                          <p className="text-lg font-bold text-base-content">
                            {allocationStatus.cancelledRequest.previousRoom}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-base-content/70">
                            Previous Bed:
                          </span>
                          <p className="text-lg font-bold text-base-content">
                            {allocationStatus.cancelledRequest.previousBed}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-base-content/70">
                            Cancelled On:
                          </span>
                          <p className="text-sm text-base-content/70">
                            {allocationStatus.cancelledRequest.cancellationDate
                              ? new Date(
                                  allocationStatus.cancelledRequest.cancellationDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      {allocationStatus.cancelledRequest.adminNotes && (
                        <div className="mt-4 p-3 bg-warning/10 rounded-lg">
                          <p className="text-sm font-medium text-warning">
                            Admin Notes:
                          </p>
                          <p className="text-sm text-base-content/80">
                            {allocationStatus.cancelledRequest.adminNotes}
                          </p>
                        </div>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={openApplicationModal}
                      className="btn btn-lg btn-primary"
                    >
                      Apply for New Room
                    </motion.button>
                  </div>
                )}

              {/* No Status (First time user) */}
              {allocationStatus.currentStatus === "none" && (
                <div className="space-y-4">
                  <div className="badge badge-neutral badge-lg">
                    Not Allocated
                  </div>
                  <p className="text-base-content/70 mb-6">
                    You are not currently allocated to any room
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openApplicationModal}
                    className="btn btn-lg btn-primary"
                  >
                    Apply for Room Allocation
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Room Application Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
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
                    {isEditMode
                      ? allocationStatus.pendingRequest?.isRoomChange
                        ? "Edit Room Change Request"
                        : "Edit Room Request"
                      : allocationStatus.currentStatus === "approved" ||
                        allocationStatus.currentStatus ===
                          "approved_with_pending_change"
                      ? "Request Room Change"
                      : "Apply for Room"}
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
              preSelectedBed={
                isEditMode &&
                allocationStatus.pendingRequest &&
                selectedRoomForLayout ===
                  allocationStatus.pendingRequest.requestedRoom.split("/")[0] &&
                selectedBlock ===
                  allocationStatus.pendingRequest.requestedRoom.split("/")[1]
                  ? allocationStatus.pendingRequest.requestedBed
                  : null
              }
              isEditMode={isEditMode}
            />
          )}
        </AnimatePresence>

        {/* Student Notes Modal */}
        <AnimatePresence>
          {showNotesModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => {
                setShowNotesModal(false);
                setStudentNotes("");
                setSelectedBed(null);
              }}
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
                    Add Request Notes
                  </h3>
                  <button
                    onClick={() => {
                      setShowNotesModal(false);
                      setStudentNotes("");
                      setSelectedBed(null);
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

                <div className="space-y-4">
                  <div className="bg-base-200 p-4 rounded-lg">
                    <h4 className="font-bold text-lg mb-2">
                      Selected Room & Bed
                    </h4>
                    <p className="text-base-content">
                      Room {selectedRoomForLayout}/{selectedBlock} - Bed{" "}
                      {selectedBed}
                    </p>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium">
                        Reason for Request{" "}
                        <span className="text-base-content/60">(Optional)</span>
                      </span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered w-full h-32 resize-none"
                      placeholder="Please provide a reason for your room request (e.g., medical needs, academic requirements, personal circumstances, etc.)"
                      value={studentNotes}
                      onChange={(e) => setStudentNotes(e.target.value)}
                      maxLength={500}
                    />
                    <div className="text-xs text-base-content/60 mt-1">
                      {studentNotes.length}/500 characters
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowNotesModal(false);
                        setStudentNotes("");
                        setSelectedBed(null);
                      }}
                      className="btn btn-ghost flex-1"
                      disabled={applying}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitWithNotes}
                      className="btn btn-primary flex-1"
                      disabled={applying}
                    >
                      {applying ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Submitting...
                        </>
                      ) : isEditMode ? (
                        "Update Request"
                      ) : allocationStatus.currentStatus === "approved" ? (
                        "Submit Room Change"
                      ) : (
                        "Submit Application"
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roommate Information Modal */}
        <AnimatePresence>
          {showRoommateModal && selectedRoommate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => {
                setShowRoommateModal(false);
                setSelectedRoommate(null);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-base-100 rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-primary">
                    Roommate Information
                  </h3>
                  <button
                    onClick={() => {
                      setShowRoommateModal(false);
                      setSelectedRoommate(null);
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

                <div className="space-y-6">
                  {/* Profile Image */}
                  <div className="flex justify-center">
                    <img
                      src={
                        selectedRoommate.profileImageUrl ||
                        "/images/user_icon.png"
                      }
                      alt={selectedRoommate.studentName}
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                      onError={(e) => {
                        e.target.src = "/images/user_icon.png";
                      }}
                    />
                  </div>

                  {/* Basic Information */}
                  <div className="bg-base-200 p-6 rounded-lg">
                    <h4 className="font-bold text-xl mb-4 text-center text-primary">
                      {selectedRoommate.studentName}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-base-content/70 block">
                            Student ID:
                          </span>
                          <p className="font-bold text-primary text-lg">
                            {selectedRoommate.studentNumber ||
                              selectedRoommate.studentId ||
                              "N/A"}
                          </p>
                        </div>

                        <div>
                          <span className="font-medium text-base-content/70 block">
                            Department:
                          </span>
                          <p className="font-bold">
                            {selectedRoommate.department || "N/A"}
                          </p>
                        </div>

                        <div>
                          <span className="font-medium text-base-content/70 block">
                            Year:
                          </span>
                          <p className="font-bold">
                            {selectedRoommate.year
                              ? `${selectedRoommate.year}${
                                  selectedRoommate.year === 1
                                    ? "st"
                                    : selectedRoommate.year === 2
                                    ? "nd"
                                    : selectedRoommate.year === 3
                                    ? "rd"
                                    : "th"
                                } Year`
                              : "N/A"}
                          </p>
                        </div>

                        <div>
                          <span className="font-medium text-base-content/70 block">
                            Session:
                          </span>
                          <p className="font-bold">
                            {selectedRoommate.session || "Not specified"}
                          </p>
                        </div>

                        <div>
                          <span className="font-medium text-base-content/70 block">
                            Bed Number:
                          </span>
                          <p className="font-bold text-primary">
                            Bed {selectedRoommate.bedNo}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-base-content/70 block">
                            Blood Group:
                          </span>
                          <p className="font-bold text-error">
                            {selectedRoommate.bloodGroup || "Not specified"}
                          </p>
                        </div>

                        <div>
                          <span className="font-medium text-base-content/70 block">
                            Email:
                          </span>
                          <p className="font-medium text-info break-all">
                            {selectedRoommate.email || "Not available"}
                          </p>
                        </div>

                        <div>
                          <span className="font-medium text-base-content/70 block">
                            Phone:
                          </span>
                          <p className="font-medium text-success">
                            {selectedRoommate.phoneNumber ||
                              selectedRoommate.phone ||
                              "Not available"}
                          </p>
                        </div>

                        <div>
                          <span className="font-medium text-base-content/70 block">
                            Registration:
                          </span>
                          <p className="text-sm">
                            {selectedRoommate.registrationDate
                              ? new Date(
                                  selectedRoommate.registrationDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  {selectedRoommate.address && (
                    <div className="bg-base-200 p-4 rounded-lg">
                      <h5 className="font-medium text-base-content/70 mb-2">
                        Home Address:
                      </h5>
                      <p className="text-sm">{selectedRoommate.address}</p>
                    </div>
                  )}

                  {/* Emergency Contact Information */}
                  <div className="bg-success/10 p-4 rounded-lg border border-success/20">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-success mt-0.5 mr-2 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        ></path>
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-success">
                          Emergency Contact
                        </p>
                        <p className="text-xs text-base-content/70 mt-1">
                          In case of emergency, you can contact your roommate
                          using the information above. Please respect privacy
                          and use only when necessary.
                        </p>
                        {(selectedRoommate.phoneNumber ||
                          selectedRoommate.phone) && (
                          <div className="mt-2">
                            <a
                              href={`tel:${
                                selectedRoommate.phoneNumber ||
                                selectedRoommate.phone
                              }`}
                              className="btn btn-success btn-sm"
                            >
                              📞 Call{" "}
                              {selectedRoommate.phoneNumber ||
                                selectedRoommate.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Room Information */}
                  <div className="bg-info/10 p-4 rounded-lg border border-info/20">
                    <h5 className="font-medium text-info mb-2">
                      Shared Room Details
                    </h5>
                    <div className="text-sm text-base-content/80 space-y-1">
                      <p>
                        Room {currentRoomLayout?.roomNumber}/
                        {currentRoomLayout?.block}
                      </p>
                      <p>Floor {currentRoomLayout?.floor}</p>
                      <p>
                        Occupancy: {currentRoomLayout?.currentOccupancy}/
                        {currentRoomLayout?.capacity} students
                      </p>
                      <p className="text-xs text-base-content/60 mt-2">
                        As roommates, please maintain mutual respect,
                        cleanliness, and follow hall rules for a harmonious
                        living environment.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowRoommateModal(false);
                      setSelectedRoommate(null);
                    }}
                    className="btn btn-primary"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
