"use client";

import { motion } from "framer-motion";

const getBedPosition = (bedNumber, capacity, roomData) => {
  // When capacity > 4, use the 6-bed layout with horizontal beds
  if (capacity > 4) {
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

  // When capacity <= 4, use fixed positions based on bed number
  // This ensures consistent layout regardless of which beds are occupied
  const fourBedPositions = {
    1: "top-8 left-8", // Bed 1: Top left
    2: "top-8 right-8", // Bed 2: Top right
    3: "bottom-8 left-8", // Bed 3: Bottom left
    4: "bottom-8 right-8", // Bed 4: Bottom right
  };

  return (
    fourBedPositions[bedNumber] ||
    "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
  );
};

const RoomLayoutDisplay = ({
  roomData,
  onBedClick = null,
  showClickable = false,
  selectedBed = null,
  currentStudentBed = null,
  showRoommateDetails = false,
  currentStudentName = null,
  isAdminView = false,
}) => {
  const BedComponent = ({ bedNumber, position, rotation = 0 }) => {
    const isOccupied = roomData?.allocatedBeds?.includes(bedNumber) || false;
    const isSelected = selectedBed === bedNumber;
    const isCurrentStudent = currentStudentBed === bedNumber;
    const roommate = roomData?.roommates?.find((r) => r.bedNo === bedNumber);

    // In admin view, allow clicking occupied beds to see student details
    // In student view with showRoommateDetails, allow clicking roommate photos
    // In regular student view, only allow clicking unoccupied beds for allocation
    const isClickable =
      showClickable && onBedClick && (isAdminView ? isOccupied : !isOccupied);

    // Separate clickability for roommate photos in student room view
    const isRoommateClickable =
      showRoommateDetails &&
      onBedClick &&
      isOccupied &&
      roommate &&
      !isCurrentStudent;

    // Conditional bed dimensions based on room capacity
    const bedDimensions = roomData?.capacity > 4 ? "w-24 h-16" : "w-16 h-24";

    // Add transform for beds 5 and 6 to center them properly
    const centeringStyle =
      (bedNumber === 5 || bedNumber === 6) && roomData?.capacity > 4
        ? { transform: `rotate(${rotation}deg) translateY(-50%)` }
        : { transform: `rotate(${rotation}deg)` };

    return (
      <motion.div
        className={`absolute ${position} ${
          isClickable ? "cursor-pointer" : "cursor-default"
        }`}
        style={centeringStyle}
        whileHover={isClickable ? { scale: 1.05 } : {}}
        whileTap={isClickable ? { scale: 0.95 } : {}}
        onClick={() => isClickable && onBedClick(bedNumber)}
      >
        <div
          className={`relative ${bedDimensions} rounded-lg border-2 transition-all duration-200 ${
            isCurrentStudent
              ? "bg-primary/20 border-primary shadow-lg"
              : isOccupied
              ? isClickable
                ? "bg-red-100 border-red-300 hover:bg-red-200 hover:border-red-400 cursor-pointer"
                : "bg-red-100 border-red-300"
              : isSelected
              ? "bg-blue-200 border-blue-500 shadow-lg"
              : isClickable
              ? "bg-green-100 border-green-300 hover:bg-green-200 hover:border-green-400"
              : "bg-green-50 border-green-200" // Changed from gray to green for consistency
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
          <div
            className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              isCurrentStudent
                ? "bg-primary text-primary-content"
                : isOccupied
                ? "bg-red-500 text-white"
                : isSelected
                ? "bg-blue-500 text-white"
                : "bg-green-500 text-white" // Changed from gray to green for consistency
            }`}
          >
            {bedNumber}
          </div>

          {/* Current Student Badge */}
          {isCurrentStudent && (
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
              <div className="badge badge-primary badge-xs">
                {isAdminView && currentStudentName
                  ? currentStudentName.split(" ")[0]
                  : "You"}
              </div>
            </div>
          )}

          {/* Student Info for Occupied Beds */}
          {isOccupied && roommate && (
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center">
              <div
                className={`w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg mb-1 bg-gray-300 flex items-center justify-center ${
                  isRoommateClickable
                    ? "cursor-pointer hover:scale-105 transition-transform"
                    : ""
                }`}
                onClick={(e) => {
                  if (isRoommateClickable) {
                    e.stopPropagation();
                    // Pass the roommate object for student view showing roommate details
                    onBedClick(roommate);
                  } else if (isClickable) {
                    e.stopPropagation();
                    // Pass bed number for admin view
                    onBedClick(bedNumber);
                  }
                }}
                title={roommate.studentName || roommate.studentId}
              >
                {roommate.profileImageUrl &&
                roommate.profileImageUrl !== "/images/user_icon.png" ? (
                  <img
                    src={roommate.profileImageUrl}
                    alt={roommate.studentName || roommate.studentId}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      const parent = e.target.parentElement;
                      parent.innerHTML = `
                        <svg class="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      `;
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
                {roommate.studentNumber || roommate.studentId}
              </div>
            </div>
          )}

          {/* Available Badge */}
          {!isOccupied && !isCurrentStudent && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <div
                className={`text-xs px-2 py-1 rounded-full ${
                  isClickable
                    ? "bg-green-500 text-white"
                    : "bg-gray-400 text-white"
                }`}
              >
                {isClickable ? "Available" : "Empty"}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (!roomData) {
    return (
      <div className="text-center py-4 text-base-content/70">
        Unable to load room layout
      </div>
    );
  }

  return (
    <div className="bg-base-200 p-6 rounded-lg max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-lg">
          Room {roomData.roomNumber}/{roomData.block}
        </h4>
        <div className="text-sm text-base-content/70">
          Floor {roomData.floor} • {roomData.currentOccupancy}/
          {roomData.capacity} occupied
        </div>
      </div>

      {/* Room Layout Container */}
      <div
        className="relative bg-gray-50 rounded-xl p-8"
        style={{ minHeight: "350px" }}
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
            Room {roomData.roomNumber}/{roomData.block}
          </div>

          {/* Dynamic Bed Rendering */}
          {Array.from({ length: roomData?.capacity || 4 }, (_, index) => {
            const bedNumber = index + 1;
            const position = getBedPosition(
              bedNumber,
              roomData?.capacity || 4,
              roomData
            );
            return (
              <BedComponent
                key={bedNumber}
                bedNumber={bedNumber}
                position={position}
                rotation={0}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center items-center gap-4 text-xs mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
          <span>Occupied</span>
        </div>
        {currentStudentBed && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary/20 border border-primary rounded"></div>
            <span>
              {isAdminView && currentStudentName
                ? `${currentStudentName.split(" ")[0]}'s bed`
                : "Your bed"}
            </span>
          </div>
        )}
        {selectedBed && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 border border-blue-500 rounded"></div>
            <span>Selected</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomLayoutDisplay;
