using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HallManagementSystem.Services;
using HallManagementSystem.Data;
using HallManagementSystem.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Net.Mail;
using System.Net;

namespace HallManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RoomAllocationController : ControllerBase
    {
        private readonly IRoomService _roomService;
        private readonly IStudentService _studentService;
        private readonly ApplicationDbContext _context;

        public RoomAllocationController(IRoomService roomService, IStudentService studentService, ApplicationDbContext context)
        {
            _roomService = roomService;
            _studentService = studentService;
            _context = context;
        }

        [HttpGet("debug/rooms/{floor}/{block}")]
        public async Task<ActionResult> GetRoomsDebug(int floor, string block)
        {
            try
            {
                var rooms = await _context.Rooms
                    .Where(r => r.Floor == floor && r.Block == block)
                    .Select(r => new { 
                        r.RoomNumber, 
                        r.Capacity, 
                        r.CurrentOccupancy, 
                        Available = r.Capacity - r.CurrentOccupancy,
                        r.AllocatedBedNumbers,
                        r.AllocatedStudentIds
                    })
                    .ToListAsync();
                
                return Ok(new { 
                    floor = floor,
                    block = block,
                    roomCount = rooms.Count,
                    rooms = rooms
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting rooms debug: {ex.Message}");
            }
        }

        [HttpGet("debug/room-students/{block}/{roomNo}")]
        public async Task<ActionResult> GetRoomStudentsDebug(string block, string roomNo)
        {
            try
            {
                var students = await _context.Students
                    .Where(s => s.Block == block && s.RoomNo == roomNo && s.BedNo.HasValue)
                    .Select(s => new {
                        s.Id,
                        s.StudentId,
                        s.FirstName,
                        s.LastName,
                        s.Email,
                        s.PhoneNumber,
                        s.BloodGroup,
                        s.Department,
                        s.Year,
                        s.Address,
                        s.RegistrationDate,
                        s.ProfileImageUrl,
                        s.BedNo,
                        s.Block,
                        s.RoomNo
                    })
                    .ToListAsync();

                return Ok(new
                {
                    message = "Raw student data from database",
                    roomInfo = $"Room {roomNo}/{block}",
                    studentCount = students.Count,
                    students = students
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error: {ex.Message}");
            }
        }

        [HttpGet("debug/student/{studentId}")]
        public async Task<ActionResult> GetStudentDebugInfo(string studentId)
        {
            try
            {
                var student = await _context.Students
                    .FirstOrDefaultAsync(s => s.StudentId == studentId);
                
                if (student == null)
                    return NotFound($"Student {studentId} not found");

                return Ok(new
                {
                    id = student.Id,
                    studentId = student.StudentId,
                    firstName = student.FirstName,
                    lastName = student.LastName,
                    email = student.Email,
                    phoneNumber = student.PhoneNumber,
                    bloodGroup = student.BloodGroup,
                    department = student.Department,
                    year = student.Year,
                    address = student.Address,
                    registrationDate = student.RegistrationDate,
                    profileImageUrl = student.ProfileImageUrl,
                    block = student.Block,
                    roomNo = student.RoomNo,
                    bedNo = student.BedNo,
                    isRoomAllocated = student.IsRoomAllocated
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting student debug info: {ex.Message}");
            }
        }

        [HttpGet("debug/rooms")]
        public async Task<ActionResult> GetAllRooms()
        {
            try
            {
                var rooms = await _context.Rooms
                    .Select(r => new { r.Id, r.RoomNumber, r.Block, r.Floor, r.CurrentOccupancy, r.Capacity })
                    .ToListAsync();
                return Ok(rooms);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting rooms: {ex.Message}");
            }
        }

        [HttpGet("room-layout/{block}/{roomNo}")]
        public async Task<ActionResult> GetRoomLayout(string block, string roomNo)
        {
            try
            {
                var room = await _context.Rooms
                    .FirstOrDefaultAsync(r => r.Block == block && r.RoomNumber == roomNo);
                
                if (room == null)
                    return NotFound($"Room {roomNo}/{block} not found");

                // Query students directly who are allocated to this room
                var allocatedStudents = await _context.Students
                    .Where(s => s.Block == block && s.RoomNo == roomNo && s.BedNo.HasValue)
                    .Select(s => new {
                        s.Id,
                        s.StudentId,
                        s.FirstName,
                        s.LastName,
                        s.Email,
                        s.PhoneNumber,
                        s.BloodGroup,
                        s.Department,
                        s.Year,
                        s.Session,
                        s.Address,
                        s.RegistrationDate,
                        s.ProfileImageUrl,
                        s.BedNo
                    })
                    .ToListAsync();

                Console.WriteLine($"=== UPDATED API VERSION 2.0 - Found {allocatedStudents.Count} students allocated to room {roomNo}/{block} ===");

                var roommates = new List<object>();
                var allocatedBeds = new List<int>();

                foreach (var student in allocatedStudents)
                {
                    if (student.BedNo.HasValue)
                    {
                        allocatedBeds.Add(student.BedNo.Value);
                        
                        // Debug: Print all student properties
                        Console.WriteLine($"=== Student Debug Info ===");
                        Console.WriteLine($"StudentId: {student.StudentId}");
                        Console.WriteLine($"Name: {student.FirstName} {student.LastName}");
                        Console.WriteLine($"Email: '{student.Email}' (IsNull: {student.Email == null}, IsEmpty: {string.IsNullOrEmpty(student.Email)})");
                        Console.WriteLine($"PhoneNumber: '{student.PhoneNumber}' (IsNull: {student.PhoneNumber == null}, IsEmpty: {string.IsNullOrEmpty(student.PhoneNumber)})");
                        Console.WriteLine($"BloodGroup: '{student.BloodGroup}' (IsNull: {student.BloodGroup == null}, IsEmpty: {string.IsNullOrEmpty(student.BloodGroup)})");
                        Console.WriteLine($"RegistrationDate: {student.RegistrationDate}");
                        Console.WriteLine($"Department: '{student.Department}'");
                        Console.WriteLine($"Year: {student.Year}");
                        Console.WriteLine($"Address: '{student.Address}' (IsNull: {student.Address == null}, IsEmpty: {string.IsNullOrEmpty(student.Address)})");
                        Console.WriteLine($"========================");
                        
                        var roommateData = new
                        {
                            bedNo = student.BedNo.Value,
                            studentId = student.StudentId ?? "",
                            studentNumber = student.StudentId ?? "",
                            studentName = $"{student.FirstName ?? ""} {student.LastName ?? ""}".Trim(),
                            department = !string.IsNullOrEmpty(student.Department) ? student.Department : "N/A",
                            year = student.Year,
                            session = !string.IsNullOrEmpty(student.Session) ? student.Session : "Not specified",
                            bloodGroup = !string.IsNullOrEmpty(student.BloodGroup) ? student.BloodGroup : "Not specified",
                            email = !string.IsNullOrEmpty(student.Email) ? student.Email : "Not available",
                            phoneNumber = !string.IsNullOrEmpty(student.PhoneNumber) ? student.PhoneNumber : "Not available", 
                            address = !string.IsNullOrEmpty(student.Address) ? student.Address : "Not available",
                            registrationDate = student.RegistrationDate.ToString("yyyy-MM-dd"),
                            profileImageUrl = !string.IsNullOrEmpty(student.ProfileImageUrl) ? student.ProfileImageUrl : "/images/user_icon.png"
                        };
                        
                        roommates.Add(roommateData);
                        
                        Console.WriteLine($"Final roommate object: {System.Text.Json.JsonSerializer.Serialize(roommateData)}");
                        
                        Console.WriteLine($"Added roommate: StudentId={student.StudentId}, Name={student.FirstName} {student.LastName}, Bed={student.BedNo}, Email={student.Email}, Phone={student.PhoneNumber}, BloodGroup={student.BloodGroup}");
                    }
                }

                return Ok(new
                {
                    roomNumber = room.RoomNumber,
                    block = room.Block,
                    floor = room.Floor,
                    capacity = room.Capacity,
                    currentOccupancy = allocatedStudents.Count,
                    availableBeds = room.Capacity - allocatedStudents.Count,
                    allocatedBeds = allocatedBeds.OrderBy(b => b).ToList(),
                    roommates = roommates.OrderBy(r => ((dynamic)r).bedNo).ToList(),
                    bedStatus = new
                    {
                        bed1 = allocatedBeds.Contains(1) ? "occupied" : "available",
                        bed2 = allocatedBeds.Contains(2) ? "occupied" : "available",
                        bed3 = allocatedBeds.Contains(3) ? "occupied" : "available",
                        bed4 = allocatedBeds.Contains(4) ? "occupied" : "available"
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetRoomLayout: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return BadRequest($"Error getting room layout: {ex.Message}");
            }
        }

        [HttpGet("availability/{floor}/{block}")]
        public async Task<ActionResult<Dictionary<string, object>>> GetRoomAvailability(int floor, string block)
        {
            try
            {
                var availability = await _roomService.GetRoomAvailabilityAsync(floor, block);
                
                var result = new Dictionary<string, object>();
                foreach (var room in availability)
                {
                    result[room.Key] = new
                    {
                        availableBeds = room.Value,
                        status = room.Value > 2 ? "available" : room.Value > 0 ? "limited" : "full"
                    };
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting room availability: {ex.Message}");
            }
        }

        [HttpGet("student-status")]
        public async Task<ActionResult> GetStudentAllocationStatus()
        {
            try
            {
                var studentId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(studentId))
                    return Unauthorized("Invalid token");

                // Get student
                var student = await _studentService.GetStudentByStudentIdAsync(studentId);
                if (student == null)
                    return NotFound("Student not found");

                // Get the most recent request for this student
                var latestRequest = await _context.RoomAllotments
                    .Where(ra => ra.StudentNumber == studentId && ra.IsActive)
                    .OrderByDescending(ra => ra.RequestDate)
                    .FirstOrDefaultAsync();

                // Separate requests by status for easier handling
                var pendingRequest = await _context.RoomAllotments
                    .Where(ra => ra.StudentNumber == studentId && ra.Status == AllotmentStatus.Pending && ra.IsActive)
                    .OrderByDescending(ra => ra.RequestDate)
                    .FirstOrDefaultAsync();

                var approvedRequest = await _context.RoomAllotments
                    .Where(ra => ra.StudentNumber == studentId && ra.Status == AllotmentStatus.Approved && ra.IsActive)
                    .OrderByDescending(ra => ra.AdminActionDate)
                    .FirstOrDefaultAsync();

                var cancelledRequest = await _context.RoomAllotments
                    .Where(ra => ra.StudentNumber == studentId && ra.Status == AllotmentStatus.Cancelled && ra.IsActive)
                    .OrderByDescending(ra => ra.AdminActionDate)
                    .FirstOrDefaultAsync();

                var rejectedRequest = await _context.RoomAllotments
                    .Where(ra => ra.StudentNumber == studentId && ra.Status == AllotmentStatus.Rejected && ra.IsActive)
                    .OrderByDescending(ra => ra.AdminActionDate)
                    .FirstOrDefaultAsync();

                // Determine current status based on most recent request
                string currentStatus = "none";
                bool hasRoomChangeRequest = pendingRequest?.IsRoomChange == true;
                
                // Check if the most recent action was a cancellation
                if (cancelledRequest != null && 
                    (approvedRequest == null || cancelledRequest.AdminActionDate > approvedRequest.AdminActionDate))
                {
                    currentStatus = "cancelled";
                }
                else if (approvedRequest != null && pendingRequest == null)
                    currentStatus = "approved";
                else if (approvedRequest != null && hasRoomChangeRequest)
                    currentStatus = "approved_with_pending_change"; // Has room but also pending change request
                else if (pendingRequest != null && approvedRequest == null)
                    currentStatus = "pending";
                else if (rejectedRequest != null && approvedRequest == null && pendingRequest == null)
                    currentStatus = "rejected";

                return Ok(new
                {
                    currentStatus = currentStatus,
                    isAllocated = approvedRequest != null && currentStatus != "cancelled",
                    hasPendingRequest = pendingRequest != null,
                    hasRejectedRequest = rejectedRequest != null,
                    hasCancelledRequest = cancelledRequest != null,
                    
                    // Pending request details
                    pendingRequest = pendingRequest != null ? new
                    {
                        id = pendingRequest.Id,
                        requestedRoom = $"{pendingRequest.RequestedRoomNo}/{pendingRequest.RequestedBlock}",
                        requestedBed = pendingRequest.RequestedBedNo,
                        requestDate = pendingRequest.RequestDate,
                        status = pendingRequest.Status.ToString(),
                        studentNotes = pendingRequest.StudentNotes,
                        isRoomChange = pendingRequest.IsRoomChange
                    } : null,
                    
                    // Approved allocation details
                    currentAllocation = approvedRequest != null ? new
                    {
                        id = approvedRequest.Id,
                        room = $"{approvedRequest.RequestedRoomNo}/{approvedRequest.RequestedBlock}",
                        bed = approvedRequest.RequestedBedNo,
                        allotmentDate = approvedRequest.AdminActionDate,
                        checkInDate = approvedRequest.CheckInDate,
                        status = approvedRequest.Status.ToString(),
                        adminNotes = approvedRequest.AdminNotes,
                        approvedBy = approvedRequest.ApprovedByAdminId
                    } : null,
                    
                    // Rejected request details
                    rejectedRequest = rejectedRequest != null ? new
                    {
                        id = rejectedRequest.Id,
                        requestedRoom = $"{rejectedRequest.RequestedRoomNo}/{rejectedRequest.RequestedBlock}",
                        requestedBed = rejectedRequest.RequestedBedNo,
                        requestDate = rejectedRequest.RequestDate,
                        rejectionDate = rejectedRequest.AdminActionDate,
                        status = rejectedRequest.Status.ToString(),
                        adminNotes = rejectedRequest.AdminNotes,
                        rejectedBy = rejectedRequest.ApprovedByAdminId,
                        studentNotes = rejectedRequest.StudentNotes
                    } : null,
                    
                    // Cancelled request details
                    cancelledRequest = cancelledRequest != null ? new
                    {
                        id = cancelledRequest.Id,
                        previousRoom = $"{cancelledRequest.RequestedRoomNo}/{cancelledRequest.RequestedBlock}",
                        previousBed = cancelledRequest.RequestedBedNo,
                        originalRequestDate = cancelledRequest.RequestDate,
                        cancellationDate = cancelledRequest.AdminActionDate,
                        status = cancelledRequest.Status.ToString(),
                        adminNotes = cancelledRequest.AdminNotes,
                        cancelledBy = cancelledRequest.ApprovedByAdminId
                    } : null
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting student allocation status: {ex.Message}");
            }
        }

        [HttpGet("bed-status/{block}/{roomNo}")]
        public async Task<ActionResult> GetBedStatus(string block, string roomNo)
        {
            try
            {
                // Find the room
                var room = await _context.Rooms
                    .FirstOrDefaultAsync(r => r.Block == block && r.RoomNumber == roomNo);
                
                if (room == null)
                    return NotFound("Room not found");

                // Create bed status object
                var bedStatus = new Dictionary<int, object>();
                
                // Initialize all beds as available based on room capacity
                for (int i = 1; i <= room.Capacity; i++)
                {
                    bedStatus[i] = new { occupied = false, student = (object?)null };
                }

                // Get students directly from Students table for accurate data
                var studentsInRoom = await _context.Students
                    .Where(s => s.Block == block && s.RoomNo == roomNo && s.IsActive && s.BedNo.HasValue)
                    .Select(s => new {
                        s.Id,
                        s.StudentId,
                        s.FirstName,
                        s.LastName,
                        s.ProfileImageUrl,
                        BedNo = s.BedNo.Value
                    })
                    .ToListAsync();

                // Mark occupied beds based on actual student data
                foreach (var student in studentsInRoom)
                {
                    if (student.BedNo >= 1 && student.BedNo <= room.Capacity)
                    {
                        bedStatus[student.BedNo] = new
                        {
                            occupied = true,
                            student = new
                            {
                                id = student.Id,
                                studentId = student.StudentId,
                                name = $"{student.FirstName} {student.LastName}",
                                profilePicture = student.ProfileImageUrl ?? "/default-avatar.png"
                            }
                        };
                    }
                }

                return Ok(new { 
                    beds = bedStatus,
                    capacity = room.Capacity,
                    roomId = room.Id
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting bed status: {ex.Message}");
            }
        }

        [HttpPost("edit-request/{requestId}")]
        public async Task<ActionResult> EditRoomRequest(int requestId, [FromBody] RoomApplicationRequest request)
        {
            try
            {
                Console.WriteLine($"EditRoomRequest called - RequestId: {requestId}, Request: {System.Text.Json.JsonSerializer.Serialize(request)}");
                
                var studentId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(studentId))
                    return Unauthorized("Invalid token");

                // Find the existing request
                var existingRequest = await _context.RoomAllotments
                    .FirstOrDefaultAsync(ra => ra.Id == requestId && ra.StudentNumber == studentId && ra.Status == AllotmentStatus.Pending);

                if (existingRequest == null)
                    return NotFound("Room allocation request not found or cannot be edited");

                // Update the request
                existingRequest.RequestedBlock = request.Block;
                existingRequest.RequestedRoomNo = request.RoomNo;
                existingRequest.RequestedBedNo = request.BedNo;
                existingRequest.StudentNotes = request.Notes ?? "";
                existingRequest.RequestDate = DateTime.Now; // Update request date

                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Room allocation request updated successfully", 
                    requestId = existingRequest.Id,
                    block = request.Block,
                    roomNo = request.RoomNo,
                    bedNo = request.BedNo,
                    status = "Pending"
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error updating room allocation request: {ex.Message}");
            }
        }

        [HttpPost("apply")]
        public async Task<ActionResult> ApplyForRoom([FromBody] RoomApplicationRequest request)
        {
            try
            {
                var studentId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(studentId))
                    return Unauthorized("Invalid token");

                // Check if student exists
                var student = await _studentService.GetStudentByStudentIdAsync(studentId);
                if (student == null)
                    return NotFound("Student not found");

                // Check for existing approved allocation
                var approvedRequest = await _context.RoomAllotments
                    .FirstOrDefaultAsync(ra => ra.StudentNumber == studentId && ra.Status == AllotmentStatus.Approved && ra.IsActive);
                
                if (approvedRequest != null)
                    return BadRequest("You already have an approved room allocation");

                // Check for existing pending requests
                var existingPendingRequest = await _context.RoomAllotments
                    .FirstOrDefaultAsync(ra => ra.StudentNumber == studentId && ra.Status == AllotmentStatus.Pending && ra.IsActive);
                
                if (existingPendingRequest != null)
                    return BadRequest("You already have a pending room allocation request. Please edit your existing request or wait for admin approval.");

                // Find the room
                var room = await _context.Rooms
                    .FirstOrDefaultAsync(r => r.Block == request.Block && r.RoomNumber == request.RoomNo);
                
                if (room == null)
                    return NotFound("Room not found");

                // Check room availability
                if (room.IsFull)
                    return BadRequest("Room is full");

                // Validate selected bed number
                if (request.BedNo < 1 || request.BedNo > 4)
                    return BadRequest("Invalid bed number. Must be between 1 and 4.");

                // Check if the selected bed is available
                var occupiedBedNumbers = room.GetAllocatedBedNumbers();
                if (occupiedBedNumbers.Contains(request.BedNo))
                    return BadRequest($"Bed {request.BedNo} is already occupied.");

                // Create pending room allocation request
                var roomAllotment = new RoomAllotment
                {
                    StudentId = student.Id, // Use the primary key
                    StudentNumber = studentId, // Store the actual student ID
                    RoomId = room.Id,
                    RequestedBlock = request.Block,
                    RequestedRoomNo = request.RoomNo,
                    RequestedBedNo = request.BedNo, // Use selected bed number
                    Status = AllotmentStatus.Pending,
                    RequestDate = DateTime.Now,
                    StudentNotes = request.Notes ?? string.Empty,
                    IsActive = true
                };

                _context.RoomAllotments.Add(roomAllotment);
                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Room allocation request submitted successfully. Please wait for admin approval.", 
                    requestId = roomAllotment.Id,
                    block = request.Block,
                    roomNo = request.RoomNo,
                    bedNo = request.BedNo,
                    status = "Pending"
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error updating room allocation request: {ex.Message}");
            }
        }

        [HttpPost("change")]
        public async Task<ActionResult> RequestRoomChange([FromBody] RoomApplicationRequest request)
        {
            try
            {
                var studentId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(studentId))
                    return Unauthorized("Invalid token");

                Console.WriteLine($"Room change request - StudentId: {studentId}, Block: {request.Block}, RoomNo: {request.RoomNo}, BedNo: {request.BedNo}");

                // Check if student exists and has a current room
                var student = await _studentService.GetStudentByStudentIdAsync(studentId);
                if (student == null)
                    return NotFound("Student not found");

                Console.WriteLine($"Student found - Current allocation: Block={student.Block}, RoomNo={student.RoomNo}, BedNo={student.BedNo}, IsRoomAllocated={student.IsRoomAllocated}");

                if (!student.IsRoomAllocated)
                    return BadRequest("Student does not have a current room allocation");

                // Check if requesting the same room and bed
                if (student.Block == request.Block && student.RoomNo == request.RoomNo && student.BedNo == request.BedNo)
                    return BadRequest("You are already allocated to this room and bed");

                // Check for existing pending room change requests
                var existingRequest = await _context.RoomAllotments
                    .FirstOrDefaultAsync(ra => ra.StudentNumber == studentId && ra.Status == AllotmentStatus.Pending && ra.IsActive);
                
                if (existingRequest != null)
                    return BadRequest("You already have a pending room change request. Please edit your existing request or wait for admin approval.");

                // Find the room to validate it exists first
                Console.WriteLine($"Looking for room: Block={request.Block}, RoomNumber={request.RoomNo}");
                var room = await _context.Rooms
                    .FirstOrDefaultAsync(r => r.Block == request.Block && r.RoomNumber == request.RoomNo);
                
                if (room == null)
                {
                    // Debug: List available rooms
                    var availableRooms = await _context.Rooms.Select(r => new { r.Block, r.RoomNumber, r.Id }).ToListAsync();
                    Console.WriteLine($"Available rooms: {string.Join(", ", availableRooms.Select(r => $"{r.RoomNumber}/{r.Block} (ID:{r.Id})"))}");
                    return BadRequest($"Requested room {request.RoomNo}/{request.Block} does not exist");
                }
                
                Console.WriteLine($"Found room: ID={room.Id}, Block={room.Block}, RoomNumber={room.RoomNumber}");

                // Validate the requested bed is available
                var occupiedBedNumbers = await GetOccupiedBedNumbers(request.Block, request.RoomNo);
                if (occupiedBedNumbers.Contains(request.BedNo))
                    return BadRequest($"Bed {request.BedNo} is already occupied in room {request.RoomNo}/{request.Block}");

                // Create room change request (similar to new application but marked as change)
                Console.WriteLine($"Creating room change request: StudentId={student.Id}, StudentNumber={studentId}, RoomId={room.Id}");
                var roomChangeRequest = new RoomAllotment
                {
                    StudentId = student.Id, // Use the primary key
                    StudentNumber = studentId,
                    RoomId = room.Id, // Reference to the requested room
                    RequestedBlock = request.Block,
                    RequestedRoomNo = request.RoomNo,
                    RequestedBedNo = request.BedNo,
                    StudentNotes = request.Notes ?? "",
                    Status = AllotmentStatus.Pending,
                    // Priority = "Medium", // Room changes get medium priority - removed as field doesn't exist
                    RequestDate = DateTime.Now,
                    IsActive = true,
                    IsRoomChange = true // New field to identify room change requests
                };

                _context.RoomAllotments.Add(roomChangeRequest);
                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Room change request submitted successfully. Please wait for admin approval.",
                    requestId = roomChangeRequest.Id,
                    requestedRoom = $"{request.RoomNo}/{request.Block}",
                    requestedBed = request.BedNo
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error submitting room change request: {ex.Message}");
            }
        }

        [HttpDelete("deallocate")]
        public async Task<ActionResult> DeallocateRoom()
        {
            try
            {
                var studentId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(studentId))
                    return Unauthorized("Invalid token");

                var success = await _roomService.DeallocateRoomAsync(studentId);
                
                if (success)
                    return Ok(new { message = "Room deallocated successfully" });
                else
                    return BadRequest("Failed to deallocate room");
            }
            catch (Exception ex)
            {
                return BadRequest($"Error deallocating room: {ex.Message}");
            }
        }

        [HttpPost("admin/bulk-deallocate")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> BulkDeallocateRooms([FromBody] BulkDeallocateRequest request)
        {
            try
            {
                if (request.StudentIds == null || !request.StudentIds.Any())
                    return BadRequest("No student IDs provided");

                var deallocatedCount = 0;
                var failedStudents = new List<string>();
                var affectedRooms = new HashSet<string>(); // Track affected room keys
                var cancelledAllotments = new List<int>(); // Track cancelled allotment IDs
                var deallocatedStudents = new List<(Student student, string block, string roomNo, int bedNo)>(); // Track for emails

                foreach (var studentId in request.StudentIds)
                {
                    try
                    {
                        var student = await _context.Students.FirstOrDefaultAsync(s => s.StudentId == studentId);
                        if (student == null)
                        {
                            failedStudents.Add($"{studentId} (not found)");
                            continue;
                        }

                        if (!student.IsRoomAllocated)
                        {
                            failedStudents.Add($"{studentId} (no room allocated)");
                            continue;
                        }

                        // Store student info before deallocating (for email)
                        var studentBlock = student.Block!;
                        var studentRoomNo = student.RoomNo!;
                        var studentBedNo = student.BedNo!.Value;

                        // Track the room before deallocating
                        var roomKey = $"{student.Block}-{student.RoomNo}";
                        affectedRooms.Add(roomKey);

                        // Update RoomAllotments table - mark ALL existing allocations as inactive
                        var allAllocations = await _context.RoomAllotments
                            .Where(ra => ra.StudentNumber == studentId && ra.IsActive)
                            .ToListAsync();

                        foreach (var allocation in allAllocations)
                        {
                            allocation.IsActive = false;
                            allocation.AdminActionDate = DateTime.Now;
                            allocation.AdminNotes = (allocation.AdminNotes ?? "") + 
                                (string.IsNullOrEmpty(allocation.AdminNotes) ? "" : " | ") + 
                                "Room allocation cancelled by admin (bulk deallocation) on " + DateTime.Now.ToString("yyyy-MM-dd HH:mm");
                            
                            cancelledAllotments.Add(allocation.Id);
                        }

                        // Deallocate the room from student
                        student.Block = null;
                        student.RoomNo = null;
                        student.BedNo = null;
                        student.RoomAllocationDate = null;

                        // Track for email notification
                        deallocatedStudents.Add((student, studentBlock, studentRoomNo, studentBedNo));

                        deallocatedCount++;
                    }
                    catch (Exception ex)
                    {
                        failedStudents.Add($"{studentId} (error: {ex.Message})");
                    }
                }

                // Save student changes first
                await _context.SaveChangesAsync();

                // Now update all affected rooms by recalculating their allocations
                foreach (var roomKey in affectedRooms)
                {
                    var parts = roomKey.Split('-');
                    var block = parts[0];
                    var roomNo = parts[1];

                    var room = await _context.Rooms.FirstOrDefaultAsync(r => r.Block == block && r.RoomNumber == roomNo);
                    if (room != null)
                    {
                        // Get all students still allocated to this room
                        var remainingStudents = await _context.Students
                            .Where(s => s.Block == block && s.RoomNo == roomNo && s.BedNo.HasValue)
                            .Select(s => new { s.StudentId, s.BedNo })
                            .ToListAsync();

                        // Rebuild the arrays from remaining students
                        if (remainingStudents.Any())
                        {
                            room.AllocatedStudentIds = string.Join(",", remainingStudents.Select(s => s.StudentId));
                            room.AllocatedBedNumbers = string.Join(",", remainingStudents.Select(s => s.BedNo.Value));
                            room.CurrentOccupancy = remainingStudents.Count;
                        }
                        else
                        {
                            // Room is now empty
                            room.AllocatedStudentIds = "";
                            room.AllocatedBedNumbers = "";
                            room.CurrentOccupancy = 0;
                        }
                    }
                }

                await _context.SaveChangesAsync();

                // Send email notifications to all deallocated students
                foreach (var (student, block, roomNo, bedNo) in deallocatedStudents)
                {
                    await SendBulkRoomDeallocationEmail(student, block, roomNo, bedNo);
                }

                return Ok(new
                {
                    message = $"Successfully deallocated {deallocatedCount} student(s), updated {affectedRooms.Count} room(s), and cancelled {cancelledAllotments.Count} allocation record(s)",
                    deallocatedCount = deallocatedCount,
                    totalRequested = request.StudentIds.Count,
                    affectedRoomsCount = affectedRooms.Count,
                    cancelledAllocationsCount = cancelledAllotments.Count,
                    cancelledAllotmentIds = cancelledAllotments,
                    failedStudents = failedStudents
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error in bulk deallocation: {ex.Message}");
            }
        }

        private async Task<List<int>> GetOccupiedBedNumbers(string block, string roomNo)
        {
            // This would need to be implemented in the service layer
            // For now, we'll use a simple approach
            var students = await _studentService.GetAllStudentsAsync();
            return students
                .Where(s => s.Block == block && s.RoomNo == roomNo && s.BedNo.HasValue && s.IsActive)
                .Select(s => s.BedNo!.Value)
                .ToList();
        }

        private int GetNextAvailableBedNumber(List<int> occupiedBeds)
        {
            for (int bed = 1; bed <= 4; bed++)
            {
                if (!occupiedBeds.Contains(bed))
                    return bed;
            }
            return 1; // Fallback, should not happen if room availability is checked first
        }

        [HttpPost("update-capacity/{block}/{roomNo}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> UpdateRoomCapacity(string block, string roomNo, [FromBody] UpdateCapacityRequest request)
        {
            try
            {
                var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminId))
                    return Unauthorized("Invalid token");

                // Find the room
                var room = await _context.Rooms
                    .FirstOrDefaultAsync(r => r.Block == block && r.RoomNumber == roomNo);
                
                if (room == null)
                    return NotFound("Room not found");

                // Validate new capacity
                if (request.NewCapacity < 1 || request.NewCapacity > 6)
                    return BadRequest("Room capacity must be between 1 and 6");

                // Get current allocated beds
                var allocatedBeds = room.GetAllocatedBedNumbers();
                var allocatedStudentIds = room.GetAllocatedStudentIds();

                // If reducing capacity, check if any occupied beds would be removed
                if (request.NewCapacity < room.Capacity)
                {
                    var bedsToRemove = allocatedBeds.Where(bed => bed > request.NewCapacity).ToList();
                    if (bedsToRemove.Any())
                    {
                        return BadRequest($"Cannot reduce capacity to {request.NewCapacity}. Beds {string.Join(", ", bedsToRemove)} are currently occupied.");
                    }
                }

                // Save old capacity before updating
                var oldCapacity = room.Capacity;

                // Update room capacity
                room.Capacity = request.NewCapacity;
                
                // If increasing capacity, no need to modify allocated beds/students
                // If decreasing capacity, the validation above ensures no occupied beds are affected
                
                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Room capacity updated successfully",
                    roomNumber = roomNo,
                    block = block,
                    oldCapacity = oldCapacity,
                    newCapacity = request.NewCapacity
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error updating room capacity: {ex.Message}");
            }
        }

        [HttpGet("admin/requests")]
        public async Task<ActionResult> GetAllRoomRequests()
        {
            try
            {
                var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminId))
                    return Unauthorized("Invalid token");

                var requests = await _context.RoomAllotments
                    .Include(ra => ra.Student)
                    .OrderBy(ra => ra.RequestDate) // Earlier requests first (higher priority)
                    .Select(ra => new
                    {
                        id = ra.Id,
                        studentId = ra.StudentNumber,
                        studentName = ra.Student.FirstName + " " + ra.Student.LastName,
                        firstName = ra.Student.FirstName,
                        lastName = ra.Student.LastName,
                        email = ra.Student.Email,
                        phone = ra.Student.PhoneNumber,
                        address = ra.Student.Address,
                        department = ra.Student.Department,
                        year = ra.Student.Year,
                        session = ra.Student.Session,
                        bloodGroup = ra.Student.BloodGroup,
                        profileImageUrl = ra.Student.ProfileImageUrl,
                        registrationDate = ra.Student.RegistrationDate,
                        requestedRoom = ra.RequestedRoomNo,
                        requestedBlock = ra.RequestedBlock,
                        requestedBed = ra.RequestedBedNo,
                        status = ra.Status.ToString(),
                        requestDate = ra.RequestDate,
                        studentNotes = ra.StudentNotes,
                        adminNotes = ra.AdminNotes,
                        priority = "Normal", // You can add priority logic later
                        isRoomChange = ra.IsRoomChange,
                        currentRoom = ra.IsRoomChange ? $"{ra.Student.RoomNo}/{ra.Student.Block}" : null,
                        currentBedNo = ra.IsRoomChange ? ra.Student.BedNo : null
                    })
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting room requests: {ex.Message}");
            }
        }

        [HttpGet("test-admin-allocate")]
        public ActionResult TestAdminAllocate()
        {
            return Ok(new { message = "Admin allocate endpoint is working", timestamp = DateTime.Now });
        }

        [HttpPost("allocate-by-admin/{requestId:int}")]
        public async Task<ActionResult> AdminAllocate(int requestId, [FromBody] AdminAllocationRequest request)
        {
            try
            {
                Console.WriteLine("=== ADMIN ALLOCATION ENDPOINT HIT ===");
                Console.WriteLine($"AdminAllocate called with requestId: {requestId}");
                Console.WriteLine($"Request body: Block={request?.Block}, RoomNo={request?.RoomNo}, BedNo={request?.BedNo}, AdminNotes={request?.AdminNotes}");
                // For admin allocation, we need to handle different scenarios:
                // 1. Pending request - admin allocating different room than requested
                // 2. Approved request - admin changing existing allocation
                var roomAllotment = await _context.RoomAllotments
                    .Include(ra => ra.Student)
                    .FirstOrDefaultAsync(ra => ra.Id == requestId && ra.IsActive);

                if (roomAllotment == null)
                    return NotFound("Room allocation request not found");

                Console.WriteLine($"Found RoomAllotment: ID={roomAllotment.Id}, Status={roomAllotment.Status}, StudentNumber={roomAllotment.StudentNumber}");
                Console.WriteLine($"Original request: {roomAllotment.RequestedRoomNo}/{roomAllotment.RequestedBlock}, Bed {roomAllotment.RequestedBedNo}");
                Console.WriteLine($"Admin wants to allocate: {request.RoomNo}/{request.Block}, Bed {request.BedNo}");

                // Find the admin-selected room
                var room = await _context.Rooms
                    .FirstOrDefaultAsync(r => r.Block == request.Block && r.RoomNumber == request.RoomNo);
                
                if (room == null)
                    return BadRequest($"Room {request.RoomNo}/{request.Block} not found");

                // Get student first
                var student = await _context.Students
                    .FirstOrDefaultAsync(s => s.StudentId == roomAllotment.StudentNumber);
                
                if (student == null)
                    return BadRequest($"Student with ID {roomAllotment.StudentNumber} not found");

                Console.WriteLine($"Found student: ID={student.Id}, StudentId={student.StudentId}, Name={student.FirstName} {student.LastName}");
                Console.WriteLine($"Student current allocation: {student.RoomNo}/{student.Block}, Bed {student.BedNo}");

                // Track if this is a room change (student already has a room)
                bool isRoomChange = !string.IsNullOrEmpty(student.Block) && !string.IsNullOrEmpty(student.RoomNo);

                // IMPORTANT: Store original requested room details BEFORE updating the roomAllotment
                string originalRequestedRoomNo = roomAllotment.RequestedRoomNo;
                string originalRequestedBlock = roomAllotment.RequestedBlock;
                int originalRequestedBedNo = roomAllotment.RequestedBedNo;

                // Get current allocated beds
                var allocatedBeds = room.GetAllocatedBedNumbers();
                var allocatedStudentIds = room.GetAllocatedStudentIds();

                // Handle room/bed change - remove from previous allocation if student already has one
                if (isRoomChange)
                {
                    // Check if this is the same room but different bed, or different room entirely
                    bool isSameRoom = (student.Block == request.Block && student.RoomNo == request.RoomNo);
                    bool isDifferentBed = (student.BedNo != request.BedNo);
                    
                    if (isSameRoom && isDifferentBed)
                    {
                        // Same room, different bed - remove old bed allocation from the same room
                        Console.WriteLine($"Admin allocation: Same room bed change - removing bed {student.BedNo} and adding bed {request.BedNo} in room {request.RoomNo}/{request.Block}");
                        
                        if (student.BedNo.HasValue)
                        {
                            allocatedBeds.Remove(student.BedNo.Value);
                            Console.WriteLine($"Admin allocation: Removed old bed {student.BedNo} from current room allocation");
                        }
                        // Remove student ID as well, will be re-added later
                        allocatedStudentIds.Remove(student.Id);
                    }
                    else if (!isSameRoom)
                    {
                        // Different room - remove from previous room entirely
                        var previousRoom = await _context.Rooms
                            .FirstOrDefaultAsync(r => r.Block == student.Block && r.RoomNumber == student.RoomNo);
                        
                        if (previousRoom != null)
                        {
                            var prevAllocatedBeds = previousRoom.GetAllocatedBedNumbers();
                            var prevAllocatedStudentIds = previousRoom.GetAllocatedStudentIds();
                            
                            // Remove student from previous room
                            if (student.BedNo.HasValue)
                            {
                                prevAllocatedBeds.Remove(student.BedNo.Value);
                            }
                            prevAllocatedStudentIds.Remove(student.Id);
                            
                            // Update previous room
                            previousRoom.SetAllocatedBedNumbers(prevAllocatedBeds);
                            previousRoom.SetAllocatedStudentIds(prevAllocatedStudentIds);
                            previousRoom.CurrentOccupancy = prevAllocatedBeds.Count;
                            
                            Console.WriteLine($"Admin allocation: Removed student {student.Id} from previous room {student.RoomNo}/{student.Block}, bed {student.BedNo}");
                        }
                    }
                }

                // Now check if the target bed is available (after removing current student's old bed)
                if (allocatedBeds.Contains(request.BedNo))
                    return BadRequest($"Bed {request.BedNo} in room {request.RoomNo}/{request.Block} is already occupied");

                // Update RoomAllotment status with admin-selected room
                // Handle both pending and already approved requests
                if (roomAllotment.Status == AllotmentStatus.Pending)
                {
                    Console.WriteLine("Approving pending request with admin's room choice");
                    roomAllotment.Status = AllotmentStatus.Approved;
                }
                else if (roomAllotment.Status == AllotmentStatus.Approved)
                {
                    Console.WriteLine("Modifying existing approved allocation with admin's new choice");
                    // Status remains approved, but we're changing the allocation
                }
                else
                {
                    return BadRequest($"Cannot modify room allocation with status: {roomAllotment.Status}");
                }
                
                roomAllotment.AdminActionDate = DateTime.Now;
                roomAllotment.AdminNotes = request.AdminNotes ?? "";
                roomAllotment.RequestedBlock = request.Block; // Update to admin's choice
                roomAllotment.RequestedRoomNo = request.RoomNo; // Update to admin's choice
                roomAllotment.RequestedBedNo = request.BedNo; // Update to admin's choice
                
                // Update student details with admin-selected room
                student.Block = request.Block;
                student.RoomNo = request.RoomNo;
                student.BedNo = request.BedNo;
                student.RoomAllocationDate = DateTime.Now;
                
                // Add to admin-selected room (use the allocatedStudentIds we already have)
                allocatedBeds.Add(request.BedNo);
                allocatedStudentIds.Add(student.Id);
                
                // Update room fields
                room.SetAllocatedBedNumbers(allocatedBeds);
                room.SetAllocatedStudentIds(allocatedStudentIds);
                room.CurrentOccupancy = allocatedBeds.Count;
                
                Console.WriteLine($"Admin allocation: Added student {student.Id} to new room {request.RoomNo}/{request.Block}, bed {request.BedNo}");
                
                await _context.SaveChangesAsync();

                // Send email notification to student
                try
                {
                    await SendAdminDifferentRoomAllocationEmail(student, request.Block, request.RoomNo, request.BedNo, isRoomChange, request.AdminNotes ?? "", originalRequestedRoomNo, originalRequestedBlock, originalRequestedBedNo);
                }
                catch (Exception emailEx)
                {
                    Console.WriteLine($"Failed to send email notification: {emailEx.Message}");
                    // Don't fail the whole operation if email fails
                }
                
                return Ok(new { 
                    message = "Room allocated successfully by admin",
                    allocatedRoom = $"{request.RoomNo}/{request.Block}",
                    allocatedBed = request.BedNo
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error during admin allocation: {ex.Message}");
            }
        }

        [HttpPost("admin-action/{requestId:int}")]
        public async Task<ActionResult> AdminAction(int requestId, [FromBody] AdminActionRequest request)
        {
            try
            {
                var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminId))
                    return Unauthorized("Invalid token");

                // Find the room allocation request
                var roomAllotment = await _context.RoomAllotments
                    .Include(ra => ra.Student)
                    .FirstOrDefaultAsync(ra => ra.Id == requestId && ra.Status == AllotmentStatus.Pending && ra.IsActive);

                if (roomAllotment == null)
                    return NotFound("Room allocation request not found or already processed");

                var student = roomAllotment.Student;
                var isApproved = false;

                // Update the request based on action
                if (request.action.ToLower() == "approve")
                {
                    try
                    {
                        isApproved = true;

                        // Update RoomAllotment status
                        roomAllotment.Status = AllotmentStatus.Approved;
                        roomAllotment.AdminActionDate = DateTime.Now;
                        
                        // Update Student table with room allocation details
                        if (student == null)
                            return BadRequest($"Student with ID {roomAllotment.StudentNumber} not found");

                        // Handle room change - remove from previous room if this is a room change request
                        if (roomAllotment.IsRoomChange && !string.IsNullOrEmpty(student.Block) && !string.IsNullOrEmpty(student.RoomNo))
                        {
                            var previousRoom = await _context.Rooms
                                .FirstOrDefaultAsync(r => r.Block == student.Block && r.RoomNumber == student.RoomNo);
                            
                            if (previousRoom != null)
                            {
                                var prevAllocatedBeds = previousRoom.GetAllocatedBedNumbers();
                                var prevAllocatedStudentIds = previousRoom.GetAllocatedStudentIds();
                                
                                // Remove student from previous room
                                if (student.BedNo.HasValue)
                                {
                                    prevAllocatedBeds.Remove(student.BedNo.Value);
                                }
                                prevAllocatedStudentIds.Remove(student.Id);
                                
                                // Update previous room
                                previousRoom.SetAllocatedBedNumbers(prevAllocatedBeds);
                                previousRoom.SetAllocatedStudentIds(prevAllocatedStudentIds);
                                previousRoom.CurrentOccupancy = prevAllocatedBeds.Count;
                                
                                Console.WriteLine($"Removed student {student.Id} from previous room {student.RoomNo}/{student.Block}, bed {student.BedNo}");
                            }
                        }
                        
                        // Update student details
                        student.Block = roomAllotment.RequestedBlock;
                        student.RoomNo = roomAllotment.RequestedRoomNo;
                        student.BedNo = roomAllotment.RequestedBedNo;
                        student.RoomAllocationDate = DateTime.Now;
                        
                        // Update new Room table with allocated bed and student
                        var room = await _context.Rooms
                            .FirstOrDefaultAsync(r => r.Block == roomAllotment.RequestedBlock && 
                                                     r.RoomNumber == roomAllotment.RequestedRoomNo);
                        
                        if (room == null)
                            return BadRequest($"Room {roomAllotment.RequestedRoomNo}/{roomAllotment.RequestedBlock} not found");
                        
                        // Use the helper methods to get existing allocations (JSON format)
                        var allocatedBeds = room.GetAllocatedBedNumbers();
                        var allocatedStudentIds = room.GetAllocatedStudentIds();
                        
                        // Check if bed is already taken
                        if (allocatedBeds.Contains(roomAllotment.RequestedBedNo))
                            return BadRequest($"Bed {roomAllotment.RequestedBedNo} in room {roomAllotment.RequestedRoomNo}/{roomAllotment.RequestedBlock} is already occupied");
                        
                        // Add new allocation
                        allocatedBeds.Add(roomAllotment.RequestedBedNo);
                        allocatedStudentIds.Add(student.Id); // Use student primary key (int), not StudentId (string)
                        
                        // Update room fields using helper methods (JSON format)
                        room.SetAllocatedBedNumbers(allocatedBeds);
                        room.SetAllocatedStudentIds(allocatedStudentIds);
                        room.CurrentOccupancy = allocatedBeds.Count; // This will automatically update AvailableBeds and IsFull computed properties
                        
                        Console.WriteLine($"Added student {student.Id} to new room {roomAllotment.RequestedRoomNo}/{roomAllotment.RequestedBlock}, bed {roomAllotment.RequestedBedNo}");
                    }
                    catch (Exception approvalEx)
                    {
                        return BadRequest($"Error during approval process: {approvalEx.Message}");
                    }
                }
                else if (request.action.ToLower() == "reject")
                {
                    roomAllotment.Status = AllotmentStatus.Rejected;
                }
                else
                {
                    return BadRequest("Invalid action. Use 'approve' or 'reject'");
                }

                roomAllotment.AdminNotes = request.adminNotes ?? "";
                roomAllotment.ApprovedByAdminId = adminId;
                roomAllotment.AdminActionDate = DateTime.Now;

                await _context.SaveChangesAsync();

                // Send email notification to student
                if (isApproved)
                {
                    await SendRoomRequestApprovedEmail(student, roomAllotment, request.adminNotes ?? "");
                }
                else
                {
                    await SendRoomRequestRejectedEmail(student, roomAllotment, request.adminNotes ?? "");
                }

                return Ok(new
                {
                    message = $"Room allocation request {request.action.ToLower()}d successfully",
                    requestId = roomAllotment.Id,
                    status = roomAllotment.Status.ToString(),
                    adminNotes = roomAllotment.AdminNotes
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error processing admin action: {ex.Message}");
            }
        }

        // Email notification methods
        private async Task SendRoomRequestApprovedEmail(Student student, RoomAllotment roomAllotment, string adminNotes)
        {
            try
            {
                var smtpClient = new SmtpClient("smtp.gmail.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential("dummytest801@gmail.com", "sqre tshl lhxn qkbq"),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress("dummytest801@gmail.com", "Hall Management System"),
                    Subject = "✅ Room Request Approved - Hall Management System",
                    Body = GenerateRoomRequestApprovedEmailBody(student, roomAllotment, adminNotes),
                    IsBodyHtml = true
                };

                mailMessage.To.Add(student.Email);

                await smtpClient.SendMailAsync(mailMessage);
                Console.WriteLine($"Room request approved email sent to {student.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send room request approved email: {ex.Message}");
            }
        }

        private async Task SendRoomRequestRejectedEmail(Student student, RoomAllotment roomAllotment, string adminNotes)
        {
            try
            {
                var smtpClient = new SmtpClient("smtp.gmail.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential("dummytest801@gmail.com", "sqre tshl lhxn qkbq"),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress("dummytest801@gmail.com", "Hall Management System"),
                    Subject = "❌ Room Request Rejected - Hall Management System",
                    Body = GenerateRoomRequestRejectedEmailBody(student, roomAllotment, adminNotes),
                    IsBodyHtml = true
                };

                mailMessage.To.Add(student.Email);

                await smtpClient.SendMailAsync(mailMessage);
                Console.WriteLine($"Room request rejected email sent to {student.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send room request rejected email: {ex.Message}");
            }
        }

        private async Task SendBulkRoomDeallocationEmail(Student student, string block, string roomNo, int bedNo)
        {
            try
            {
                var smtpClient = new SmtpClient("smtp.gmail.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential("dummytest801@gmail.com", "sqre tshl lhxn qkbq"),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress("dummytest801@gmail.com", "Hall Management System"),
                    Subject = "🚨 Room Allocation Cancelled - Bulk Deallocation",
                    Body = GenerateBulkRoomDeallocationEmailBody(student, block, roomNo, bedNo),
                    IsBodyHtml = true
                };

                mailMessage.To.Add(student.Email);

                await smtpClient.SendMailAsync(mailMessage);
                Console.WriteLine($"Bulk deallocation email sent to {student.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send bulk deallocation email to {student.Email}: {ex.Message}");
            }
        }

        private string GenerateBulkRoomDeallocationEmailBody(Student student, string block, string roomNo, int bedNo)
        {
            return $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Room Allocation Cancelled</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 28px; font-weight: bold; }}
        .header p {{ margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }}
        .content {{ padding: 30px; }}
        .alert-banner {{ background-color: #fef3c7; border-left: 5px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 0 8px 8px 0; }}
        .alert-banner h2 {{ color: #d97706; margin: 0 0 10px 0; font-size: 20px; }}
        .room-details {{ background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #e2e8f0; }}
        .room-details h3 {{ color: #1e40af; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #dbeafe; padding-bottom: 10px; }}
        .detail-row {{ display: flex; margin-bottom: 15px; }}
        .detail-label {{ font-weight: bold; color: #374151; min-width: 140px; }}
        .detail-value {{ color: #1f2937; flex: 1; }}
        .action-section {{ background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #3b82f6; }}
        .action-section h3 {{ color: #1e40af; margin: 0 0 15px 0; font-size: 18px; }}
        .action-section ul {{ margin: 10px 0; padding-left: 25px; }}
        .action-section li {{ margin: 8px 0; color: #1f2937; }}
        .footer {{ background-color: #1f2937; color: #d1d5db; padding: 25px; text-align: center; }}
        .info-box {{ background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🚨 Room Allocation Cancelled</h1>
            <p>Bulk Deallocation Notice</p>
        </div>
        <div class='content'>
            <div class='alert-banner'>
                <h2>⚠️ Your Room Has Been Deallocated</h2>
                <p>Your room allocation has been cancelled as part of a bulk deallocation process by the hall administration.</p>
            </div>

            <p>Dear <strong>{student.FirstName} {student.LastName}</strong>,</p>
            
            <p>We are writing to inform you that your room allocation has been cancelled by the hall administration as part of a bulk room reallocation process.</p>

            <div class='room-details'>
                <h3>📋 Cancelled Room Details</h3>
                <div class='detail-row'>
                    <div class='detail-label'>Student ID:</div>
                    <div class='detail-value'>{student.StudentId}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Previous Room:</div>
                    <div class='detail-value'>Room {roomNo}, Block {block}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Previous Bed:</div>
                    <div class='detail-value'>Bed {bedNo}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Deallocation Date:</div>
                    <div class='detail-value'>{DateTime.Now:MMMM dd, yyyy - hh:mm tt}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Process Type:</div>
                    <div class='detail-value'><strong>Bulk Deallocation</strong></div>
                </div>
            </div>

            <div class='info-box'>
                <p style='margin: 0;'><strong>ℹ️ Note:</strong> This deallocation was performed as part of a bulk administrative action affecting multiple students.</p>
            </div>

            <div class='action-section'>
                <h3>📌 What to Do Next</h3>
                <ul>
                    <li><strong>Apply for a New Room:</strong> You can now apply for a new room through the hall management system.</li>
                    <li><strong>Contact Administration:</strong> If you have any questions or concerns about this bulk deallocation, please contact the hall administration office.</li>
                    <li><strong>Check Your Account:</strong> Log in to your account to view available rooms and submit a new application.</li>
                    <li><strong>Update Your Information:</strong> Ensure your contact details are up to date for future communications.</li>
                </ul>
            </div>

            <p style='margin-top: 25px;'>If you believe this deallocation was made in error or if you need clarification about the bulk deallocation process, please contact the hall administration immediately.</p>

            <p style='margin-top: 20px;'><strong>Best regards,</strong><br>Hall Administration<br>Hall Management System</p>
        </div>
        <div class='footer'>
            <p style='margin: 0; font-size: 14px;'>Hall Management System</p>
            <p style='margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;'>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string GenerateRoomRequestApprovedEmailBody(Student student, RoomAllotment roomAllotment, string adminNotes)
        {
            return $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Room Request Approved</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 28px; font-weight: bold; }}
        .header p {{ margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }}
        .content {{ padding: 30px; }}
        .success-banner {{ background-color: #f0fdf4; border-left: 5px solid #10b981; padding: 15px; margin-bottom: 25px; border-radius: 0 8px 8px 0; }}
        .success-banner h2 {{ color: #059669; margin: 0 0 10px 0; font-size: 20px; }}
        .room-details {{ background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #e2e8f0; }}
        .room-details h3 {{ color: #1e40af; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #dbeafe; padding-bottom: 10px; }}
        .detail-row {{ display: flex; margin-bottom: 15px; }}
        .detail-label {{ font-weight: bold; color: #374151; min-width: 140px; }}
        .detail-value {{ color: #1f2937; flex: 1; }}
        .status-badge {{ background-color: #10b981; color: white; padding: 8px 16px; border-radius: 25px; font-weight: bold; font-size: 14px; display: inline-block; }}
        .admin-notes {{ background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
        .action-section {{ background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #3b82f6; }}
        .action-section h3 {{ color: #1e40af; margin: 0 0 15px 0; font-size: 18px; }}
        .action-section ul {{ margin: 10px 0; padding-left: 25px; }}
        .action-section li {{ margin: 8px 0; color: #1f2937; }}
        .footer {{ background-color: #1f2937; color: #d1d5db; padding: 25px; text-align: center; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>✅ Congratulations!</h1>
            <p>Your Room Request Has Been Approved</p>
        </div>
        <div class='content'>
            <div class='success-banner'>
                <h2>🎉 Room Allocation Approved!</h2>
                <p>Great news! Your room allocation request has been approved by the hall administration.</p>
            </div>

            <p>Dear <strong>{student.FirstName} {student.LastName}</strong>,</p>
            
            <p>We are pleased to inform you that your room allocation request has been <strong>approved</strong>!</p>

            <div class='room-details'>
                <h3>🏠 Your Allocated Room Details</h3>
                <div class='detail-row'>
                    <div class='detail-label'>Student ID:</div>
                    <div class='detail-value'>{student.StudentId}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Student Name:</div>
                    <div class='detail-value'>{student.FirstName} {student.LastName}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Allocated Room:</div>
                    <div class='detail-value'><strong>Room {roomAllotment.RequestedRoomNo}, Block {roomAllotment.RequestedBlock}</strong></div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Bed Number:</div>
                    <div class='detail-value'><strong>Bed {roomAllotment.RequestedBedNo}</strong></div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Approval Date:</div>
                    <div class='detail-value'>{DateTime.Now:MMMM dd, yyyy - hh:mm tt}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Request Type:</div>
                    <div class='detail-value'>{(roomAllotment.IsRoomChange ? "Room Change Request" : "New Room Application")}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Status:</div>
                    <div class='detail-value'><span class='status-badge'>✓ APPROVED</span></div>
                </div>
            </div>

            {(string.IsNullOrEmpty(adminNotes) ? "" : $@"
            <div class='admin-notes'>
                <strong>📝 Admin Notes:</strong><br>
                {adminNotes}
            </div>
            ")}

            <div class='action-section'>
                <h3>📌 Next Steps</h3>
                <ul>
                    <li><strong>Check In:</strong> You can now move into your allocated room.</li>
                    <li><strong>View Room Details:</strong> Log in to your account to view your roommates and room facilities.</li>
                    <li><strong>Follow Hall Rules:</strong> Please ensure you comply with all hall rules and regulations.</li>
                    <li><strong>Contact for Support:</strong> If you have any questions, contact the hall administration office.</li>
                </ul>
            </div>

            <p style='margin-top: 25px;'>We hope you have a comfortable stay at the hall!</p>

            <p style='margin-top: 20px;'><strong>Best regards,</strong><br>Hall Administration<br>Hall Management System</p>
        </div>
        <div class='footer'>
            <p style='margin: 0; font-size: 14px;'>Hall Management System</p>
            <p style='margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;'>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string GenerateRoomRequestRejectedEmailBody(Student student, RoomAllotment roomAllotment, string adminNotes)
        {
            return $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Room Request Rejected</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 28px; font-weight: bold; }}
        .header p {{ margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }}
        .content {{ padding: 30px; }}
        .alert-banner {{ background-color: #fef2f2; border-left: 5px solid #ef4444; padding: 15px; margin-bottom: 25px; border-radius: 0 8px 8px 0; }}
        .alert-banner h2 {{ color: #dc2626; margin: 0 0 10px 0; font-size: 20px; }}
        .room-details {{ background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #e2e8f0; }}
        .room-details h3 {{ color: #1e40af; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #dbeafe; padding-bottom: 10px; }}
        .detail-row {{ display: flex; margin-bottom: 15px; }}
        .detail-label {{ font-weight: bold; color: #374151; min-width: 140px; }}
        .detail-value {{ color: #1f2937; flex: 1; }}
        .status-badge {{ background-color: #ef4444; color: white; padding: 8px 16px; border-radius: 25px; font-weight: bold; font-size: 14px; display: inline-block; }}
        .admin-notes {{ background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
        .action-section {{ background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #3b82f6; }}
        .action-section h3 {{ color: #1e40af; margin: 0 0 15px 0; font-size: 18px; }}
        .action-section ul {{ margin: 10px 0; padding-left: 25px; }}
        .action-section li {{ margin: 8px 0; color: #1f2937; }}
        .footer {{ background-color: #1f2937; color: #d1d5db; padding: 25px; text-align: center; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>❌ Room Request Status</h1>
            <p>Application Update Notification</p>
        </div>
        <div class='content'>
            <div class='alert-banner'>
                <h2>⚠️ Room Request Rejected</h2>
                <p>We regret to inform you that your room allocation request has been rejected.</p>
            </div>

            <p>Dear <strong>{student.FirstName} {student.LastName}</strong>,</p>
            
            <p>After careful consideration, we regret to inform you that your room allocation request has been <strong>rejected</strong> by the hall administration.</p>

            <div class='room-details'>
                <h3>📋 Request Details</h3>
                <div class='detail-row'>
                    <div class='detail-label'>Student ID:</div>
                    <div class='detail-value'>{student.StudentId}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Student Name:</div>
                    <div class='detail-value'>{student.FirstName} {student.LastName}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Requested Room:</div>
                    <div class='detail-value'>Room {roomAllotment.RequestedRoomNo}, Block {roomAllotment.RequestedBlock}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Requested Bed:</div>
                    <div class='detail-value'>Bed {roomAllotment.RequestedBedNo}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Request Date:</div>
                    <div class='detail-value'>{roomAllotment.RequestDate:MMMM dd, yyyy}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Rejection Date:</div>
                    <div class='detail-value'>{DateTime.Now:MMMM dd, yyyy - hh:mm tt}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Request Type:</div>
                    <div class='detail-value'>{(roomAllotment.IsRoomChange ? "Room Change Request" : "New Room Application")}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Status:</div>
                    <div class='detail-value'><span class='status-badge'>✗ REJECTED</span></div>
                </div>
            </div>

            {(string.IsNullOrEmpty(adminNotes) ? "" : $@"
            <div class='admin-notes'>
                <strong>📝 Reason for Rejection:</strong><br>
                {adminNotes}
            </div>
            ")}

            <div class='action-section'>
                <h3>📌 What to Do Next</h3>
                <ul>
                    <li><strong>Review Admin Notes:</strong> Please read the reason provided by the administration carefully.</li>
                    <li><strong>Apply for Different Room:</strong> You can submit a new application for a different room if available.</li>
                    <li><strong>Contact Administration:</strong> If you have questions about this rejection, please contact the hall administration office.</li>
                    <li><strong>Check Available Rooms:</strong> Log in to your account to view currently available rooms.</li>
                </ul>
            </div>

            <p style='margin-top: 25px;'>We understand this may be disappointing. If you have any concerns or need clarification, please don't hesitate to contact us.</p>

            <p style='margin-top: 20px;'><strong>Best regards,</strong><br>Hall Administration<br>Hall Management System</p>
        </div>
        <div class='footer'>
            <p style='margin: 0; font-size: 14px;'>Hall Management System</p>
            <p style='margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;'>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
        }

        private async Task SendAdminDifferentRoomAllocationEmail(Student student, string allocatedBlock, string allocatedRoomNo, int allocatedBedNo, bool isRoomChange, string adminNotes, string requestedRoomNo, string requestedBlock, int requestedBedNo)
        {
            try
            {
                var smtpClient = new SmtpClient("smtp.gmail.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential("dummytest801@gmail.com", "sqre tshl lhxn qkbq"),
                    EnableSsl = true,
                };

                var subject = isRoomChange 
                    ? "🔄 Room Changed to Different Room - Hall Management System" 
                    : "✅ Different Room Allocated - Hall Management System";

                var mailMessage = new MailMessage
                {
                    From = new MailAddress("dummytest801@gmail.com", "Hall Management System"),
                    Subject = subject,
                    Body = GenerateAdminDifferentRoomAllocationEmailBody(student, allocatedBlock, allocatedRoomNo, allocatedBedNo, isRoomChange, adminNotes, requestedRoomNo, requestedBlock, requestedBedNo),
                    IsBodyHtml = true
                };

                mailMessage.To.Add(student.Email);

                await smtpClient.SendMailAsync(mailMessage);
                Console.WriteLine($"Admin different room allocation email sent to {student.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send admin different room allocation email: {ex.Message}");
            }
        }

        private string GenerateAdminDifferentRoomAllocationEmailBody(Student student, string allocatedBlock, string allocatedRoomNo, int allocatedBedNo, bool isRoomChange, string adminNotes, string requestedRoomNo, string requestedBlock, int requestedBedNo)
        {
            var actionText = isRoomChange ? "Room Changed" : "Room Allocated";
            var actionIcon = isRoomChange ? "🔄" : "✅";
            
            return $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>{actionText} - Different Room</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 28px; font-weight: bold; }}
        .header p {{ margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }}
        .content {{ padding: 30px; }}
        .info-banner {{ background-color: #eff6ff; border-left: 5px solid #3b82f6; padding: 15px; margin-bottom: 25px; border-radius: 0 8px 8px 0; }}
        .info-banner h2 {{ color: #1d4ed8; margin: 0 0 10px 0; font-size: 20px; }}
        .notice-box {{ background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 25px 0; }}
        .notice-box h3 {{ color: #b45309; margin: 0 0 10px 0; font-size: 18px; }}
        .notice-box p {{ color: #78350f; margin: 5px 0; font-size: 15px; }}
        .room-details {{ background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #e2e8f0; }}
        .room-details h3 {{ color: #1e40af; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #dbeafe; padding-bottom: 10px; }}
        .detail-row {{ display: flex; margin-bottom: 15px; }}
        .detail-label {{ font-weight: bold; color: #374151; min-width: 160px; }}
        .detail-value {{ color: #1f2937; flex: 1; }}
        .status-badge {{ background-color: #3b82f6; color: white; padding: 8px 16px; border-radius: 25px; font-weight: bold; font-size: 14px; display: inline-block; }}
        .admin-notes {{ background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
        .action-section {{ background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #3b82f6; }}
        .action-section h3 {{ color: #1e40af; margin: 0 0 15px 0; font-size: 18px; }}
        .action-section ul {{ margin: 10px 0; padding-left: 25px; }}
        .action-section li {{ margin: 8px 0; color: #1f2937; }}
        .footer {{ background-color: #1f2937; color: #d1d5db; padding: 25px; text-align: center; }}
        .highlight {{ background-color: #fef3c7; padding: 3px 8px; border-radius: 4px; font-weight: bold; }}
        .requested-room {{ background-color: #fee2e2; padding: 3px 8px; border-radius: 4px; text-decoration: line-through; color: #991b1b; }}
        .allocated-room {{ background-color: #d1fae5; padding: 3px 8px; border-radius: 4px; color: #065f46; font-weight: bold; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>{actionIcon} {actionText}!</h1>
            <p>Admin Allocated Different Room</p>
        </div>
        <div class='content'>
            <div class='info-banner'>
                <h2>🏠 You've Been Allocated a Different Room</h2>
                <p>The administration has allocated a different room than what you requested.</p>
            </div>

            <div class='notice-box'>
                <h3>⚠️ Important Notice</h3>
                <p><strong>Your requested room:</strong> <span class='requested-room'>Room {requestedRoomNo}, Block {requestedBlock}, Bed {requestedBedNo}</span></p>
                <p><strong>Admin allocated room:</strong> <span class='allocated-room'>Room {allocatedRoomNo}, Block {allocatedBlock}, Bed {allocatedBedNo}</span></p>
                <p style='margin-top: 15px;'>The administration has allocated you a different room based on availability and administrative requirements.</p>
            </div>

            <p>Dear <strong>{student.FirstName} {student.LastName}</strong>,</p>
            
            <p>We are writing to inform you about your room allocation. While your request was for a different room, the administration has allocated you the following room:</p>

            <div class='room-details'>
                <h3>🏠 Your {(isRoomChange ? "New" : "")} Allocated Room Details</h3>
                <div class='detail-row'>
                    <div class='detail-label'>Student ID:</div>
                    <div class='detail-value'>{student.StudentId}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Student Name:</div>
                    <div class='detail-value'>{student.FirstName} {student.LastName}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>{(isRoomChange ? "New" : "")} Allocated Room:</div>
                    <div class='detail-value'><strong class='highlight'>Room {allocatedRoomNo}, Block {allocatedBlock}</strong></div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>{(isRoomChange ? "New" : "")} Bed Number:</div>
                    <div class='detail-value'><strong class='highlight'>Bed {allocatedBedNo}</strong></div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Requested Room:</div>
                    <div class='detail-value'>Room {requestedRoomNo}, Block {requestedBlock}, Bed {requestedBedNo}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Allocation Date:</div>
                    <div class='detail-value'>{DateTime.Now:MMMM dd, yyyy - hh:mm tt}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Allocation Type:</div>
                    <div class='detail-value'>{(isRoomChange ? "Room Change - Different Room by Admin" : "Different Room Allocation by Admin")}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Status:</div>
                    <div class='detail-value'><span class='status-badge'>✓ ALLOCATED</span></div>
                </div>
            </div>

            {(string.IsNullOrEmpty(adminNotes) ? "" : $@"
            <div class='admin-notes'>
                <strong>📝 Admin Notes / Reason for Different Room:</strong><br>
                {adminNotes}
            </div>
            ")}

            <div class='action-section'>
                <h3>📌 What This Means</h3>
                <ul>
                    <li><strong>Different Room Allocated:</strong> You have been allocated a different room than what you originally requested.</li>
                    <li><strong>Administrative Decision:</strong> This allocation was made by the hall administration based on availability, capacity, or other administrative requirements.</li>
                    {(isRoomChange ? "<li><strong>Previous Room Cancelled:</strong> Your previous room allocation has been cancelled and you've been moved to this new room.</li>" : "")}
                    <li><strong>Room is Ready:</strong> You can move into your allocated room at your convenience.</li>
                    <li><strong>View Details:</strong> Log in to your account to view complete room details and facilities.</li>
                    <li><strong>Check Roommates:</strong> You can see your roommate information in the system.</li>
                    <li><strong>Questions?</strong> If you have any questions about why you were allocated a different room, please check the admin notes above or contact the hall administration office.</li>
                </ul>
            </div>

            <p style='margin-top: 25px;'>We hope you have a comfortable stay in your allocated room!</p>

            <p style='margin-top: 20px;'><strong>Best regards,</strong><br>Hall Administration<br>Hall Management System</p>
        </div>
        <div class='footer'>
            <p style='margin: 0; font-size: 14px;'>Hall Management System</p>
            <p style='margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;'>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
        }
    }


    public class AdminActionRequest
    {
        public string action { get; set; } = string.Empty;
        public string adminNotes { get; set; } = string.Empty;
    }

    public class AdminAllocationRequest
    {
        public string Block { get; set; } = string.Empty;
        public string RoomNo { get; set; } = string.Empty;
        public int BedNo { get; set; }
        public string AdminNotes { get; set; } = string.Empty;
    }

    public class UpdateCapacityRequest
    {
        public int NewCapacity { get; set; }
    }

    public class BulkDeallocateRequest
    {
        public List<string> StudentIds { get; set; } = new List<string>();
    }
}
