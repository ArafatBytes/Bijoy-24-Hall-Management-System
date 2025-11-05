"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const RoomLayout = ({
  roomNumber,
  block,
  onBedSelect,
  onClose,
  preSelectedBed = null,
  isEditMode = false,
  isAdminMode = false,
}) => {
  const [bedData, setBedData] = useState({
    1: { occupied: false, student: null },
    2: { occupied: false, student: null },
    3: { occupied: false, student: null },
    4: { occupied: false, student: null },
  });
  const [selectedBed, setSelectedBed] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roomCapacity, setRoomCapacity] = useState(4);
  const [originalCapacity, setOriginalCapacity] = useState(4);
  const [capacityChanged, setCapacityChanged] = useState(false);
  const [showCapacityError, setShowCapacityError] = useState(false);
  const [capacityErrorMessage, setCapacityErrorMessage] = useState("");
  const [showCapacitySuccess, setShowCapacitySuccess] = useState(false);
  const [capacitySuccessMessage, setCapacitySuccessMessage] = useState("");

  // Load bed occupancy data
  useEffect(() => {
    loadBedData();
  }, [roomNumber, block]);

  // Pre-select bed in edit mode
  useEffect(() => {
    if (isEditMode && preSelectedBed && !loading) {
      setSelectedBed(preSelectedBed);
      console.log("Pre-selected bed in edit mode:", preSelectedBed);
    }
  }, [isEditMode, preSelectedBed, loading]);

  const loadBedData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/bed-status/${block}/${roomNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Bed data received:", data.beds); // Debug log
        console.log("Room capacity:", data.capacity); // Debug log

        setBedData(
          data.beds || {
            1: { occupied: false, student: null },
            2: { occupied: false, student: null },
            3: { occupied: false, student: null },
            4: { occupied: false, student: null },
          }
        );

        // Set capacity from API response
        setRoomCapacity(data.capacity || 4);
        setOriginalCapacity(data.capacity || 4);
      }
    } catch (error) {
      console.error("Error loading bed data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBedClick = (bedNumber) => {
    if (bedData[bedNumber]?.occupied) return;
    setSelectedBed(bedNumber);
    setShowConfirmation(true);
  };

  const handleConfirmSelection = () => {
    onBedSelect(selectedBed);
    setShowConfirmation(false);
    onClose();
  };

  const handleCancelSelection = () => {
    setSelectedBed(null);
    setShowConfirmation(false);
  };

  const handleCapacityChange = (newCapacity) => {
    if (newCapacity < 1 || newCapacity > 6) return;

    // Check if reducing capacity is possible
    if (newCapacity < roomCapacity) {
      const bedsToRemoveCount = roomCapacity - newCapacity;

      // Get all current beds sorted by number (highest first)
      const allBeds = Object.keys(bedData)
        .map((bedNum) => parseInt(bedNum))
        .filter((bedNum) => bedNum <= roomCapacity)
        .sort((a, b) => b - a); // Sort descending (6, 5, 4, 3, 2, 1)

      // Find unoccupied beds (highest numbers first)
      const unoccupiedBeds = allBeds.filter(
        (bedNum) => !bedData[bedNum]?.occupied
      );

      // Check if we have enough unoccupied beds to remove
      if (unoccupiedBeds.length < bedsToRemoveCount) {
        // Find which occupied beds would need to be removed
        const occupiedBeds = allBeds.filter(
          (bedNum) => bedData[bedNum]?.occupied
        );
        const occupiedBedsToRemove = occupiedBeds.slice(
          0,
          bedsToRemoveCount - unoccupiedBeds.length
        );

        setCapacityErrorMessage(
          `Cannot reduce capacity to ${newCapacity}. Bed${
            occupiedBedsToRemove.length > 1 ? "s" : ""
          } ${occupiedBedsToRemove.join(", ")} ${
            occupiedBedsToRemove.length > 1 ? "are" : "is"
          } currently occupied and would need to be removed.`
        );
        setShowCapacityError(true);
        return;
      }
    }

    setRoomCapacity(newCapacity);
    setCapacityChanged(newCapacity !== originalCapacity);

    // Update bedData to include/exclude beds based on new capacity
    const newBedData = { ...bedData };

    if (newCapacity > roomCapacity) {
      // Add missing beds up to new capacity (don't overwrite existing beds)
      for (let i = 1; i <= newCapacity; i++) {
        if (!newBedData[i]) {
          // Only add bed if it doesn't exist
          newBedData[i] = { occupied: false, student: null };
        }
      }
    } else if (newCapacity < roomCapacity) {
      const bedsToRemoveCount = roomCapacity - newCapacity;

      // Get all current beds sorted by number (highest first)
      const allBeds = Object.keys(bedData)
        .map((bedNum) => parseInt(bedNum))
        .filter((bedNum) => bedNum <= roomCapacity)
        .sort((a, b) => b - a); // Sort descending (6, 5, 4, 3, 2, 1)

      // Remove highest numbered unoccupied beds first
      let removedCount = 0;
      for (const bedNum of allBeds) {
        if (removedCount >= bedsToRemoveCount) break;

        if (!newBedData[bedNum]?.occupied) {
          delete newBedData[bedNum];
          removedCount++;
        }
      }
    }

    setBedData(newBedData);
  };

  const saveCapacityChange = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roomallocation/update-capacity/${block}/${roomNumber}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ NewCapacity: roomCapacity }),
        }
      );

      if (response.ok) {
        setOriginalCapacity(roomCapacity);
        setCapacityChanged(false);
        setCapacitySuccessMessage(
          `Room capacity updated successfully to ${roomCapacity} beds!`
        );
        setShowCapacitySuccess(true);
        // Reload bed data to ensure everything is in sync with the database
        await loadBedData();
      } else {
        const errorData = await response.json();
        setCapacityErrorMessage(
          `Failed to update capacity: ${errorData.message || "Unknown error"}`
        );
        setShowCapacityError(true);
      }
    } catch (error) {
      console.error("Error updating capacity:", error);
      setCapacityErrorMessage(
        "Failed to update room capacity. Please try again."
      );
      setShowCapacityError(true);
    }
  };

  const resetCapacity = () => {
    setRoomCapacity(originalCapacity);
    setCapacityChanged(false);
    // Reload bed data to reset to original state
    loadBedData();
  };

  const getBedPosition = (bedNumber) => {
    // When capacity > 4, use the 6-bed layout with horizontal beds
    if (roomCapacity > 4) {
      const sixBedPositions = {
        1: "top-8 left-4", // Top left (adjusted for wider horizontal beds)
        2: "top-8 right-4", // Top right (adjusted for wider horizontal beds)
        5: "top-1/2 left-4", // Middle left (exactly centered vertically)
        6: "top-1/2 right-4", // Middle right (exactly centered vertically)
        3: "bottom-8 left-4", // Bottom left (adjusted for wider horizontal beds)
        4: "bottom-8 right-4", // Bottom right (adjusted for wider horizontal beds)
      };
      return (
        sixBedPositions[bedNumber] ||
        "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      );
    }

    // When capacity <= 4, rearrange beds to 4-corner layout regardless of bed numbers
    // Get all existing beds (occupied + available) sorted by bed number
    const allBeds = Object.keys(bedData)
      .map(Number)
      .sort((a, b) => a - b);
    const bedIndex = allBeds.indexOf(bedNumber);

    // Map beds to 4-corner positions based on their index, not bed number
    const fourCornerPositions = [
      "top-8 left-8", // Position 0: Top left
      "top-8 right-8", // Position 1: Top right
      "bottom-8 left-8", // Position 2: Bottom left
      "bottom-8 right-8", // Position 3: Bottom right
    ];

    return (
      fourCornerPositions[bedIndex] ||
      "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
    );
  };

  const BedComponent = ({ bedNumber, position }) => {
    const bed = bedData[bedNumber];
    const isOccupied = bed?.occupied;
    const isSelected = selectedBed === bedNumber;

    // Conditional bed dimensions based on room capacity
    const bedDimensions = roomCapacity > 4 ? "w-24 h-16" : "w-16 h-24";

    // Add transform for beds 5 and 6 to center them properly
    const centeringStyle =
      (bedNumber === 5 || bedNumber === 6) && roomCapacity > 4
        ? { transform: "translateY(-50%)" }
        : {};

    // Disable hover animations for beds 5 and 6 to prevent position shifting
    const shouldAnimate = !(
      (bedNumber === 5 || bedNumber === 6) &&
      roomCapacity > 4
    );

    return (
      <motion.div
        className={`absolute ${position} cursor-pointer`}
        style={centeringStyle}
        whileHover={!isOccupied && shouldAnimate ? { scale: 1.05 } : {}}
        whileTap={!isOccupied && shouldAnimate ? { scale: 0.95 } : {}}
        onClick={() => handleBedClick(bedNumber)}
      >
        <div
          className={`relative ${bedDimensions} rounded-lg border-2 transition-all duration-200 ${
            isOccupied
              ? "bg-red-100 border-red-300 cursor-not-allowed"
              : isSelected
              ? "bg-blue-200 border-blue-500 shadow-lg"
              : "bg-green-100 border-green-300 hover:bg-green-200 hover:border-green-400"
          }`}
        >
          {/* Bed Icon */}
          <div className="absolute inset-1 bg-white rounded border flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M7 14c1.66 0 3-1.34 3-3S8.66 8 7 8s-3 1.34-3 3 1.34 3 3 3zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm12-3h-8v8H3V7H1v10h2v2h2v-2h12v2h2v-2h2V9h-2V7z" />
            </svg>
          </div>

          {/* Bed Number */}
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
            {bedNumber}
          </div>

          {/* Student Info for Occupied Beds */}
          {isOccupied && bed.student && (
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-center">
              <div
                className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg mb-1 bg-gray-300 flex items-center justify-center tooltip tooltip-top"
                data-tip={bed.student.name || bed.student.studentId}
                title={bed.student.name || bed.student.studentId}
              >
                {bed.student.profilePicture &&
                bed.student.profilePicture !== "/images/user_icon.png" ? (
                  <img
                    src={bed.student.profilePicture}
                    alt={bed.student.name || bed.student.studentId}
                    className="w-full h-full object-cover object-center"
                    style={{ imageRendering: "auto", filter: "none" }}
                    onError={(e) => {
                      // Fallback to default icon if image fails to load
                      const parent = e.target.parentElement;
                      parent.innerHTML = `
                        <svg class="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      `;
                      parent.setAttribute(
                        "title",
                        bed.student.name || bed.student.studentId
                      );
                    }}
                  />
                ) : (
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </div>
              <div className="text-xs text-gray-700 font-medium bg-white/80 px-1 rounded">
                {bed.student.studentId}
              </div>
            </div>
          )}

          {/* Available Badge */}
          {!isOccupied && (
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Available
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
      >
        <div className="bg-base-100 rounded-2xl p-8 text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p>Loading room layout...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Room Layout Modal */}
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
          className="bg-base-100 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-primary">
                {isEditMode ? "Edit Room Request" : "Room Layout"}
              </h3>
              <p className="text-base-content/70">
                Room {roomNumber}/{block} -{" "}
                {isEditMode ? "Update Your Bed Selection" : "Select Your Bed"}
                {isEditMode && preSelectedBed && (
                  <span className="text-warning ml-2">
                    (Currently: Bed {preSelectedBed})
                  </span>
                )}
              </p>
            </div>
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
                ></path>
              </svg>
            </button>
          </div>

          {/* Capacity Control (Admin Only) */}
          {isAdminMode && (
            <div className="mb-6 p-4 bg-base-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-base-content">
                    Room Capacity Control
                  </h4>
                  <p className="text-sm text-base-content/70">
                    Current capacity: {roomCapacity} beds
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCapacityChange(roomCapacity - 1)}
                    disabled={roomCapacity <= 1}
                    className="btn btn-sm btn-outline btn-error"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 bg-base-100 rounded font-mono text-lg min-w-[3rem] text-center">
                    {roomCapacity}
                  </span>
                  <button
                    onClick={() => handleCapacityChange(roomCapacity + 1)}
                    disabled={roomCapacity >= 6}
                    className="btn btn-sm btn-outline btn-success"
                  >
                    +
                  </button>
                </div>
              </div>

              {capacityChanged && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={saveCapacityChange}
                    className="btn btn-sm btn-primary"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={resetCapacity}
                    className="btn btn-sm btn-outline"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Room Layout Container */}
          <div
            className="relative bg-gray-50 rounded-xl p-8 mb-6"
            style={{ minHeight: "400px" }}
          >
            {/* Room Walls */}
            <div className="absolute inset-4 border-4 border-gray-800 rounded-lg bg-white">
              {/* Door at the front (top center) */}
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-amber-600 rounded-b-lg">
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600">
                  Door
                </div>
              </div>

              {/* Room Title */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-lg font-bold text-gray-700">
                Room {roomNumber}/{block}
              </div>

              {/* Dynamic Bed Rendering */}
              {Object.keys(bedData)
                .map((bedNum) => parseInt(bedNum))
                .sort((a, b) => a - b)
                .map((bedNumber) => (
                  <BedComponent
                    key={bedNumber}
                    bedNumber={bedNumber}
                    position={getBedPosition(bedNumber)}
                  />
                ))}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 border-2 border-blue-500 rounded"></div>
              <span>Selected</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-4 bg-info/10 rounded-lg">
            <p className="text-sm text-info">
              💡 <strong>Instructions:</strong> Click on any available bed
              (green) to select it. Occupied beds (red) show the current
              student&apos;s ID and cannot be selected.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-base-100 rounded-2xl p-6 max-w-md w-full mx-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-primary"
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

                <h3 className="text-xl font-bold mb-2">
                  Confirm Bed Selection
                </h3>
                <p className="text-base-content/70 mb-6">
                  You have selected <strong>Bed {selectedBed}</strong> in Room{" "}
                  <strong>
                    {roomNumber}/{block}
                  </strong>
                  .
                  <br />
                  {isAdminMode
                    ? "Do you want to allocate this bed to the student?"
                    : "Do you want to submit your room allocation request?"}
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleCancelSelection}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSelection}
                    className="btn btn-primary"
                  >
                    {isAdminMode ? "Allocate Bed" : "Confirm Selection"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capacity Error Modal */}
      <AnimatePresence>
        {showCapacityError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]"
            onClick={() => setShowCapacityError(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-base-100 rounded-2xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-error/10 rounded-full flex items-center justify-center">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-base-content mb-2">
                  Cannot Reduce Capacity
                </h3>
                <p className="text-base-content/70 mb-6">
                  {capacityErrorMessage}
                </p>
                <button
                  onClick={() => setShowCapacityError(false)}
                  className="btn btn-primary w-full"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capacity Success Modal */}
      <AnimatePresence>
        {showCapacitySuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]"
            onClick={() => setShowCapacitySuccess(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-base-100 rounded-2xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-success/10 rounded-full flex items-center justify-center">
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
                </div>
                <h3 className="text-xl font-bold text-base-content mb-2">
                  Capacity Updated
                </h3>
                <p className="text-base-content/70 mb-6">
                  {capacitySuccessMessage}
                </p>
                <button
                  onClick={() => setShowCapacitySuccess(false)}
                  className="btn btn-success w-full"
                >
                  Great!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RoomLayout;
