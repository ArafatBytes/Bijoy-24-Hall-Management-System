using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HallManagementSystem.Models;
using HallManagementSystem.Services;
using HallManagementSystem.Data;
using System.Security.Claims;
using System.Net.Mail;
using System.Net;

namespace HallManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StudentsController : ControllerBase
    {
        private readonly IStudentService _studentService;
        private readonly ApplicationDbContext _context;

        public StudentsController(IStudentService studentService, ApplicationDbContext context)
        {
            _studentService = studentService;
            _context = context;
        }

        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetAllStudentsForAdmin(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string search = "",
            [FromQuery] string department = "",
            [FromQuery] string year = "",
            [FromQuery] string bloodGroup = "",
            [FromQuery] string roomStatus = "", // allocated, not-allocated, all
            [FromQuery] string sortBy = "registrationDate",
            [FromQuery] string sortOrder = "desc"
        )
        {
            try
            {
                var query = _context.Students.AsQueryable();

                // Apply search filter
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(s => 
                        s.StudentId.Contains(search) ||
                        s.FirstName.Contains(search) ||
                        s.LastName.Contains(search) ||
                        s.Email.Contains(search) ||
                        s.Department.Contains(search) ||
                        s.Address.Contains(search) ||
                        (s.Session != null && s.Session.Contains(search)) ||
                        (s.RoomNo != null && s.RoomNo.Contains(search)) ||
                        (s.Block != null && s.Block.Contains(search))
                    );
                }

                // Apply department filter
                if (!string.IsNullOrEmpty(department) && department != "all")
                {
                    query = query.Where(s => s.Department == department);
                }

                // Apply year filter
                if (!string.IsNullOrEmpty(year) && year != "all")
                {
                    if (int.TryParse(year, out int yearInt))
                    {
                        query = query.Where(s => s.Year == yearInt);
                    }
                }

                // Apply blood group filter
                if (!string.IsNullOrEmpty(bloodGroup) && bloodGroup != "all")
                {
                    query = query.Where(s => s.BloodGroup == bloodGroup);
                }

                // Apply room status filter
                if (!string.IsNullOrEmpty(roomStatus) && roomStatus != "all")
                {
                    if (roomStatus == "allocated")
                    {
                        query = query.Where(s => s.Block != null && s.RoomNo != null && s.BedNo.HasValue);
                    }
                    else if (roomStatus == "not-allocated")
                    {
                        query = query.Where(s => s.Block == null || s.RoomNo == null || !s.BedNo.HasValue);
                    }
                }

                // Apply sorting
                switch (sortBy.ToLower())
                {
                    case "name":
                        query = sortOrder == "asc" ? query.OrderBy(s => s.FirstName).ThenBy(s => s.LastName) 
                                                   : query.OrderByDescending(s => s.FirstName).ThenByDescending(s => s.LastName);
                        break;
                    case "studentid":
                        query = sortOrder == "asc" ? query.OrderBy(s => s.StudentId) : query.OrderByDescending(s => s.StudentId);
                        break;
                    case "department":
                        query = sortOrder == "asc" ? query.OrderBy(s => s.Department) : query.OrderByDescending(s => s.Department);
                        break;
                    case "year":
                        query = sortOrder == "asc" ? query.OrderBy(s => s.Year) : query.OrderByDescending(s => s.Year);
                        break;
                    default: // registrationDate
                        query = sortOrder == "asc" ? query.OrderBy(s => s.RegistrationDate) : query.OrderByDescending(s => s.RegistrationDate);
                        break;
                }

                // Get total count for pagination
                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                // Apply pagination
                var students = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(s => new
                    {
                        id = s.Id,
                        studentId = s.StudentId,
                        studentName = $"{s.FirstName} {s.LastName}",
                        firstName = s.FirstName,
                        lastName = s.LastName,
                        email = s.Email,
                        phoneNumber = s.PhoneNumber,
                        guardianPhoneNumber = s.GuardianPhoneNumber,
                        department = s.Department,
                        year = s.Year,
                        session = s.Session,
                        bloodGroup = s.BloodGroup,
                        address = s.Address,
                        registrationDate = s.RegistrationDate,
                        profileImageUrl = s.ProfileImageUrl,
                        isActive = s.IsActive,
                        // Room allocation info
                        block = s.Block,
                        roomNo = s.RoomNo,
                        bedNo = s.BedNo,
                        currentRoom = s.Block != null && s.RoomNo != null ? $"{s.RoomNo}/{s.Block}" : null,
                        roomAllocationDate = s.RoomAllocationDate,
                        isRoomAllocated = s.Block != null && s.RoomNo != null && s.BedNo.HasValue
                    })
                    .ToListAsync();

                // Get filter options for dropdowns
                var departments = await _context.Students
                    .Where(s => !string.IsNullOrEmpty(s.Department))
                    .Select(s => s.Department)
                    .Distinct()
                    .OrderBy(d => d)
                    .ToListAsync();

                var bloodGroups = await _context.Students
                    .Where(s => !string.IsNullOrEmpty(s.BloodGroup))
                    .Select(s => s.BloodGroup)
                    .Distinct()
                    .OrderBy(bg => bg)
                    .ToListAsync();

                var years = await _context.Students
                    .Select(s => s.Year)
                    .Distinct()
                    .OrderBy(y => y)
                    .ToListAsync();

                return Ok(new
                {
                    students = students,
                    pagination = new
                    {
                        currentPage = page,
                        pageSize = pageSize,
                        totalCount = totalCount,
                        totalPages = totalPages,
                        hasNextPage = page < totalPages,
                        hasPreviousPage = page > 1
                    },
                    filters = new
                    {
                        departments = departments,
                        bloodGroups = bloodGroups,
                        years = years
                    },
                    summary = new
                    {
                        totalStudents = totalCount,
                        allocatedStudents = await _context.Students.CountAsync(s => s.Block != null && s.RoomNo != null && s.BedNo.HasValue),
                        activeStudents = await _context.Students.CountAsync(s => s.IsActive)
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAllStudentsForAdmin: {ex.Message}");
                return BadRequest($"Error getting students: {ex.Message}");
            }
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<Student>>> GetStudents()
        {
            var students = await _studentService.GetAllStudentsAsync();
            return Ok(students);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Student>> GetStudent(int id)
        {
            var student = await _studentService.GetStudentByIdAsync(id);
            
            if (student == null)
                return NotFound();

            return Ok(student);
        }

        [HttpGet("by-student-id/{studentId}")]
        public async Task<ActionResult<Student>> GetStudentByStudentId(string studentId)
        {
            var student = await _studentService.GetStudentByStudentIdAsync(studentId);
            
            if (student == null)
                return NotFound();

            return Ok(student);
        }

        [HttpGet("current")]
        public async Task<ActionResult<Student>> GetCurrentStudent()
        {
            // Get student ID from JWT token
            var studentId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(studentId))
                return Unauthorized("Invalid token");

            var student = await _studentService.GetStudentByStudentIdAsync(studentId);
            
            if (student == null)
                return NotFound("Student not found");

            return Ok(student);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStudent(int id, Student student)
        {
            var updatedStudent = await _studentService.UpdateStudentAsync(id, student);
            
            if (updatedStudent == null)
                return NotFound();

            return Ok(updatedStudent);
        }

        [HttpPut("{id}/profile")]
        public async Task<IActionResult> UpdateStudentProfile(int id, [FromBody] UpdateProfileRequest request)
        {
            var student = await _studentService.GetStudentByIdAsync(id);
            if (student == null)
                return NotFound();

            student.FirstName = request.FirstName;
            student.LastName = request.LastName;
            student.Email = request.Email;
            student.PhoneNumber = request.PhoneNumber;
            student.GuardianPhoneNumber = request.GuardianPhoneNumber;
            student.Address = request.Address;
            student.Department = request.Department;
            student.Year = request.Year;
            student.Session = request.Session;
            student.BloodGroup = request.BloodGroup;
            student.DateOfBirth = request.DateOfBirth;
            
            if (!string.IsNullOrEmpty(request.ProfileImageUrl))
            {
                student.ProfileImageUrl = request.ProfileImageUrl;
            }

            var updatedStudent = await _studentService.UpdateStudentAsync(id, student);
            
            if (updatedStudent == null)
                return BadRequest("Failed to update profile");

            return Ok(new { 
                message = "Profile updated successfully",
                student = new {
                    updatedStudent.Id,
                    updatedStudent.StudentId,
                    updatedStudent.FirstName,
                    updatedStudent.LastName,
                    updatedStudent.Email,
                    updatedStudent.PhoneNumber,
                    updatedStudent.GuardianPhoneNumber,
                    updatedStudent.Address,
                    updatedStudent.Department,
                    updatedStudent.Year,
                    updatedStudent.Session,
                    updatedStudent.BloodGroup,
                    updatedStudent.ProfileImageUrl,
                    updatedStudent.DateOfBirth
                }
            });
        }

        [HttpPost("{id}/cancel-room")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CancelStudentRoomAllocation(int id)
        {
            try
            {
                var student = await _context.Students.FindAsync(id);
                if (student == null)
                    return NotFound("Student not found");

                if (student.Block == null || student.RoomNo == null || !student.BedNo.HasValue)
                    return BadRequest("Student does not have a room allocation");

                // Store room info before clearing
                var cancelledBlock = student.Block;
                var cancelledRoomNo = student.RoomNo;
                var cancelledBedNo = student.BedNo.Value;

                // Get the room to update its allocation data
                var room = await _context.Rooms
                    .FirstOrDefaultAsync(r => r.Block == student.Block && r.RoomNumber == student.RoomNo);

                if (room != null)
                {
                    // Get current allocated data
                    var allocatedStudentIds = room.GetAllocatedStudentIds();
                    var allocatedBedNumbers = room.GetAllocatedBedNumbers();

                    // Remove student from room allocation
                    allocatedStudentIds.Remove(student.Id);
                    allocatedBedNumbers.Remove(student.BedNo.Value);

                    // Update room data
                    room.SetAllocatedStudentIds(allocatedStudentIds);
                    room.SetAllocatedBedNumbers(allocatedBedNumbers);
                    room.CurrentOccupancy = allocatedStudentIds.Count;
                }

                // Clear student's room allocation
                student.Block = null;
                student.RoomNo = null;
                student.BedNo = null;
                student.RoomAllocationDate = null;

                // Update RoomAllotments table - mark ALL existing allocations as inactive
                var allAllocations = await _context.RoomAllotments
                    .Where(ra => ra.StudentNumber == student.StudentId && ra.IsActive)
                    .ToListAsync();

                foreach (var allocation in allAllocations)
                {
                    allocation.IsActive = false;
                    allocation.AdminActionDate = DateTime.Now;
                    allocation.AdminNotes = (allocation.AdminNotes ?? "") + 
                        (string.IsNullOrEmpty(allocation.AdminNotes) ? "" : " | ") + 
                        "Room allocation cancelled by admin on " + DateTime.Now.ToString("yyyy-MM-dd HH:mm");
                    
                    Console.WriteLine($"Marked RoomAllotment {allocation.Id} as inactive for student {student.StudentId}");
                }

                await _context.SaveChangesAsync();

                // Send email notification to student
                await SendRoomDeallocationEmail(student, cancelledBlock, cancelledRoomNo, cancelledBedNo);

                return Ok(new { message = "Room allocation cancelled successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error cancelling room allocation: {ex.Message}");
                return BadRequest($"Error cancelling room allocation: {ex.Message}");
            }
        }

        [HttpDelete("{id}/admin-delete")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminDeleteStudent(int id)
        {
            try
            {
                var student = await _context.Students.FindAsync(id);
                if (student == null)
                    return NotFound("Student not found");

                // If student has room allocation, remove from room first
                if (student.Block != null && student.RoomNo != null && student.BedNo.HasValue)
                {
                    var room = await _context.Rooms
                        .FirstOrDefaultAsync(r => r.Block == student.Block && r.RoomNumber == student.RoomNo);

                    if (room != null)
                    {
                        // Get current allocated data
                        var allocatedStudentIds = room.GetAllocatedStudentIds();
                        var allocatedBedNumbers = room.GetAllocatedBedNumbers();

                        // Remove student from room allocation
                        allocatedStudentIds.Remove(student.Id);
                        allocatedBedNumbers.Remove(student.BedNo.Value);

                        // Update room data
                        room.SetAllocatedStudentIds(allocatedStudentIds);
                        room.SetAllocatedBedNumbers(allocatedBedNumbers);
                        room.CurrentOccupancy = allocatedStudentIds.Count;
                    }
                }

                // Remove student completely from database
                _context.Students.Remove(student);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Student account deleted successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting student: {ex.Message}");
                return BadRequest($"Error deleting student: {ex.Message}");
            }
        }

        [HttpPost("admin/bulk-delete")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> BulkDeleteStudents([FromBody] BulkDeleteRequest request)
        {
            try
            {
                if (request.StudentIds == null || request.StudentIds.Count == 0)
                    return BadRequest("No student IDs provided");

                var deletedCount = 0;
                var failedStudents = new List<string>();

                foreach (var studentId in request.StudentIds)
                {
                    try
                    {
                        var student = await _context.Students
                            .FirstOrDefaultAsync(s => s.StudentId == studentId);

                        if (student == null)
                        {
                            failedStudents.Add($"{studentId} (not found)");
                            continue;
                        }

                        // If student has room allocation, remove from room first
                        if (student.Block != null && student.RoomNo != null && student.BedNo.HasValue)
                        {
                            var room = await _context.Rooms
                                .FirstOrDefaultAsync(r => r.Block == student.Block && r.RoomNumber == student.RoomNo);

                            if (room != null)
                            {
                                // Get current allocated data
                                var allocatedStudentIds = room.GetAllocatedStudentIds();
                                var allocatedBedNumbers = room.GetAllocatedBedNumbers();

                                // Remove student from room allocation
                                allocatedStudentIds.Remove(student.Id);
                                if (student.BedNo.HasValue)
                                {
                                    allocatedBedNumbers.Remove(student.BedNo.Value);
                                }

                                // Update room data
                                room.SetAllocatedStudentIds(allocatedStudentIds);
                                room.SetAllocatedBedNumbers(allocatedBedNumbers);
                                room.CurrentOccupancy = allocatedStudentIds.Count;
                            }
                        }

                        // Mark all room allotments as inactive
                        var roomAllotments = await _context.RoomAllotments
                            .Where(ra => ra.StudentNumber == studentId && ra.IsActive)
                            .ToListAsync();

                        foreach (var allotment in roomAllotments)
                        {
                            allotment.IsActive = false;
                        }

                        // Remove student completely from database
                        _context.Students.Remove(student);
                        deletedCount++;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error deleting student {studentId}: {ex.Message}");
                        failedStudents.Add($"{studentId} (error: {ex.Message})");
                    }
                }

                // Save all changes at once
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Bulk delete completed. {deletedCount} student(s) deleted successfully.",
                    deletedCount = deletedCount,
                    failedCount = failedStudents.Count,
                    failedStudents = failedStudents
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in bulk delete: {ex.Message}");
                return BadRequest($"Error during bulk delete: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            var result = await _studentService.DeleteStudentAsync(id);
            
            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpPost("{id}/admin-allocate-room")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminAllocateRoom(int id, [FromBody] AdminDirectAllocationRequest request)
        {
            try
            {
                var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminId))
                    return Unauthorized("Invalid token");

                Console.WriteLine($"=== ADMIN DIRECT ALLOCATION ===");
                Console.WriteLine($"Student ID: {id}, Block: {request.Block}, Room: {request.RoomNo}, Bed: {request.BedNo}");

                var student = await _context.Students.FindAsync(id);
                if (student == null)
                    return NotFound("Student not found");

                // Track if this is a room change (student already has a room)
                var isRoomChange = !string.IsNullOrEmpty(student.Block) && !string.IsNullOrEmpty(student.RoomNo);

                // Find the admin-selected room (same as AdminAction method)
                var room = await _context.Rooms
                    .FirstOrDefaultAsync(r => r.Block == request.Block && r.RoomNumber == request.RoomNo);
                
                if (room == null)
                    return BadRequest($"Room {request.RoomNo}/{request.Block} not found");

                // Handle room change - remove from previous room if student has existing allocation (exact copy from AdminAction)
                if (isRoomChange)
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
                
                // Update student details (exact copy from AdminAction)
                student.Block = request.Block;
                student.RoomNo = request.RoomNo;
                student.BedNo = request.BedNo;
                student.RoomAllocationDate = DateTime.Now;
                
                // Use the helper methods to get existing allocations (exact copy from AdminAction)
                var allocatedBeds = room.GetAllocatedBedNumbers();
                var allocatedStudentIds = room.GetAllocatedStudentIds();
                
                // Check if bed is already taken (exact copy from AdminAction)
                if (allocatedBeds.Contains(request.BedNo))
                    return BadRequest($"Bed {request.BedNo} in room {request.RoomNo}/{request.Block} is already occupied");
                
                // Add new allocation (exact copy from AdminAction)
                allocatedBeds.Add(request.BedNo);
                allocatedStudentIds.Add(student.Id); // Use student primary key (int), not StudentId (string)
                
                // Update room fields using helper methods (exact copy from AdminAction)
                room.SetAllocatedBedNumbers(allocatedBeds);
                room.SetAllocatedStudentIds(allocatedStudentIds);
                room.CurrentOccupancy = allocatedBeds.Count; // This will automatically update AvailableBeds and IsFull computed properties
                
                Console.WriteLine($"Added student {student.Id} to new room {request.RoomNo}/{request.Block}, bed {request.BedNo}");

                // Create or update RoomAllotment record
                var existingAllocation = await _context.RoomAllotments
                    .Where(ra => ra.StudentNumber == student.StudentId && ra.IsActive)
                    .OrderByDescending(ra => ra.AdminActionDate ?? ra.RequestDate)
                    .FirstOrDefaultAsync();

                if (existingAllocation != null)
                {
                    // Update existing allocation
                    existingAllocation.Status = AllotmentStatus.Approved;
                    existingAllocation.RoomId = room.Id; // Set the foreign key
                    existingAllocation.StudentId = student.Id; // Set the foreign key
                    existingAllocation.RequestedBlock = request.Block;
                    existingAllocation.RequestedRoomNo = request.RoomNo;
                    existingAllocation.RequestedBedNo = request.BedNo;
                    existingAllocation.AdminActionDate = DateTime.Now;
                    existingAllocation.AdminNotes = request.AdminNotes ?? "Room allocated directly by admin";
                    existingAllocation.ApprovedByAdminId = adminId;
                    existingAllocation.IsRoomChange = isRoomChange;
                    
                    Console.WriteLine($"Updated existing RoomAllotment {existingAllocation.Id}");
                }
                else
                {
                    // Create new allocation record
                    var newAllocation = new RoomAllotment
                    {
                        StudentId = student.Id, // Set the foreign key
                        StudentNumber = student.StudentId,
                        RoomId = room.Id, // Set the foreign key
                        RequestedBlock = request.Block,
                        RequestedRoomNo = request.RoomNo,
                        RequestedBedNo = request.BedNo,
                        Status = AllotmentStatus.Approved,
                        RequestDate = DateTime.Now,
                        AdminActionDate = DateTime.Now,
                        AdminNotes = request.AdminNotes ?? "Room allocated directly by admin",
                        ApprovedByAdminId = adminId,
                        StudentNotes = "Direct allocation by admin",
                        IsActive = true,
                        IsRoomChange = isRoomChange
                    };
                    
                    _context.RoomAllotments.Add(newAllocation);
                    Console.WriteLine($"Created new RoomAllotment for student {student.StudentId}");
                }

                await _context.SaveChangesAsync();

                // Send email notification to student
                await SendAdminRoomAllocationEmail(student, request.Block, request.RoomNo, request.BedNo, isRoomChange, request.AdminNotes ?? "");

                Console.WriteLine($"Successfully allocated student {student.Id} to room {request.RoomNo}/{request.Block}, bed {request.BedNo}");

                return Ok(new { 
                    message = "Room allocated successfully",
                    allocatedRoom = $"{request.RoomNo}/{request.Block}",
                    allocatedBed = request.BedNo,
                    student = new {
                        id = student.Id,
                        name = $"{student.FirstName} {student.LastName}",
                        studentId = student.StudentId
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in admin direct allocation: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return BadRequest(new { 
                    message = $"Error allocating room: {ex.Message}",
                    details = ex.InnerException?.Message ?? "No additional details"
                });
            }
        }

        public class UpdateProfileRequest
        {
            public string FirstName { get; set; } = string.Empty;
            public string LastName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string PhoneNumber { get; set; } = string.Empty;
            public string? GuardianPhoneNumber { get; set; }
            public string Address { get; set; } = string.Empty;
            public string Department { get; set; } = string.Empty;
            public int Year { get; set; }
            public string Session { get; set; } = string.Empty;
            public string BloodGroup { get; set; } = string.Empty;
            public string ProfileImageUrl { get; set; } = string.Empty;
            public DateTime DateOfBirth { get; set; }
        }

        public class AdminDirectAllocationRequest
        {
            public string Block { get; set; } = string.Empty;
            public string RoomNo { get; set; } = string.Empty;
            public int BedNo { get; set; }
            public string AdminNotes { get; set; } = string.Empty;
        }

        public class StudentUpdateRequest
        {
            public string FirstName { get; set; } = string.Empty;
            public string LastName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string PhoneNumber { get; set; } = string.Empty;
            public string Address { get; set; } = string.Empty;
            public string Department { get; set; } = string.Empty;
            public int Year { get; set; }
            public string BloodGroup { get; set; } = string.Empty;
            public string ProfileImageUrl { get; set; } = string.Empty;
            public DateTime DateOfBirth { get; set; }
        }

        [HttpPost("{id}/change-password")]
        public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordRequest model)
        {
            if (model == null || string.IsNullOrEmpty(model.OldPassword) || string.IsNullOrEmpty(model.NewPassword))
                return BadRequest("Invalid request");

            var student = await _studentService.GetStudentByIdAsync(id);
            if (student == null) return NotFound("Student not found");

            // Verify old password using BCrypt
            if (!BCrypt.Net.BCrypt.Verify(model.OldPassword, student.PasswordHash))
            {
                return BadRequest("Old password is incorrect");
            }

            // Update password hash using BCrypt
            student.PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);
            var updated = await _studentService.UpdateStudentAsync(id, student);
            if (updated == null) return BadRequest("Failed to change password");

            return Ok(new { message = "Password changed successfully" });
        }

        public class ChangePasswordRequest
        {
            public string OldPassword { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

        // Email notification methods
        private async Task SendRoomDeallocationEmail(Student student, string block, string roomNo, int bedNo)
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
                    Subject = "🚨 Room Allocation Cancelled - Hall Management System",
                    Body = GenerateRoomDeallocationEmailBody(student, block, roomNo, bedNo),
                    IsBodyHtml = true
                };

                mailMessage.To.Add(student.Email);

                await smtpClient.SendMailAsync(mailMessage);
                Console.WriteLine($"Room deallocation email sent to {student.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send room deallocation email: {ex.Message}");
            }
        }

        private string GenerateRoomDeallocationEmailBody(Student student, string block, string roomNo, int bedNo)
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
        .action-section {{ background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #3b82f6; }}
        .action-section h3 {{ color: #1e40af; margin: 0 0 15px 0; font-size: 18px; }}
        .action-section ul {{ margin: 10px 0; padding-left: 25px; }}
        .action-section li {{ margin: 8px 0; color: #1f2937; }}
        .footer {{ background-color: #1f2937; color: #d1d5db; padding: 25px; text-align: center; }}
        .button {{ display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🚨 Room Allocation Cancelled</h1>
            <p>Important Update Regarding Your Room</p>
        </div>
        <div class='content'>
            <div class='alert-banner'>
                <h2>⚠️ Your Room Has Been Deallocated</h2>
                <p>Your room allocation has been cancelled by the hall administration.</p>
            </div>

            <p>Dear <strong>{student.FirstName} {student.LastName}</strong>,</p>
            
            <p>We are writing to inform you that your room allocation has been cancelled by the hall administration.</p>

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
                    <div class='detail-label'>Cancellation Date:</div>
                    <div class='detail-value'>{DateTime.Now:MMMM dd, yyyy - hh:mm tt}</div>
                </div>
            </div>

            <div class='action-section'>
                <h3>📌 What to Do Next</h3>
                <ul>
                    <li><strong>Apply for a New Room:</strong> You can now apply for a new room through the hall management system.</li>
                    <li><strong>Contact Administration:</strong> If you have any questions or concerns, please contact the hall administration office.</li>
                    <li><strong>Check Your Account:</strong> Log in to your account to view available rooms and submit a new application.</li>
                </ul>
            </div>

            <p style='margin-top: 25px;'>If you believe this cancellation was made in error or if you need clarification, please contact the hall administration immediately.</p>

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

        private async Task SendAdminRoomAllocationEmail(Student student, string block, string roomNo, int bedNo, bool isRoomChange, string adminNotes)
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
                    Subject = isRoomChange ? "🔄 Room Changed Successfully - Hall Management System" : "✅ Room Allocated Successfully - Hall Management System",
                    Body = GenerateAdminRoomAllocationEmailBody(student, block, roomNo, bedNo, isRoomChange, adminNotes),
                    IsBodyHtml = true
                };

                mailMessage.To.Add(student.Email);

                await smtpClient.SendMailAsync(mailMessage);
                Console.WriteLine($"Admin room allocation email sent to {student.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send admin room allocation email: {ex.Message}");
            }
        }

        private string GenerateAdminRoomAllocationEmailBody(Student student, string block, string roomNo, int bedNo, bool isRoomChange, string adminNotes)
        {
            var actionText = isRoomChange ? "Room Change" : "Room Allocation";
            var actionIcon = isRoomChange ? "🔄" : "✅";
            var actionVerb = isRoomChange ? "changed" : "allocated";
            
            return $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>{actionText} Successful</title>
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
        .highlight {{ background-color: #fef3c7; padding: 3px 8px; border-radius: 4px; font-weight: bold; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>{actionIcon} {actionText} Successful!</h1>
            <p>Admin Direct Allocation</p>
        </div>
        <div class='content'>
            <div class='success-banner'>
                <h2>🎉 Your Room Has Been {actionVerb.ToUpper()}!</h2>
                <p>The hall administration has {actionVerb} a room for you directly.</p>
            </div>

            <p>Dear <strong>{student.FirstName} {student.LastName}</strong>,</p>
            
            <p>We are pleased to inform you that the hall administration has {actionVerb} a room for you!</p>

            <div class='room-details'>
                <h3>🏠 Your {(isRoomChange ? "New" : "")} Room Details</h3>
                <div class='detail-row'>
                    <div class='detail-label'>Student ID:</div>
                    <div class='detail-value'>{student.StudentId}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Student Name:</div>
                    <div class='detail-value'>{student.FirstName} {student.LastName}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>{(isRoomChange ? "New" : "")} Room:</div>
                    <div class='detail-value'><strong class='highlight'>Room {roomNo}, Block {block}</strong></div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>{(isRoomChange ? "New" : "")} Bed Number:</div>
                    <div class='detail-value'><strong class='highlight'>Bed {bedNo}</strong></div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Allocation Date:</div>
                    <div class='detail-value'>{DateTime.Now:MMMM dd, yyyy - hh:mm tt}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Allocation Type:</div>
                    <div class='detail-value'>{(isRoomChange ? "Room Change by Admin" : "Direct Allocation by Admin")}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Status:</div>
                    <div class='detail-value'><span class='status-badge'>✓ ALLOCATED</span></div>
                </div>
            </div>

            {(string.IsNullOrEmpty(adminNotes) ? "" : $@"
            <div class='admin-notes'>
                <strong>📝 Admin Notes:</strong><br>
                {adminNotes}
            </div>
            ")}

            <div class='action-section'>
                <h3>📌 Important Information</h3>
                <ul>
                    <li><strong>Direct Allocation:</strong> This room was allocated directly by the hall administration without a prior request from you.</li>
                    {(isRoomChange ? "<li><strong>Room Change:</strong> Your previous room allocation has been cancelled and you have been moved to this new room.</li>" : "")}
                    <li><strong>View Details:</strong> Log in to your account to view complete room details and facilities.</li>
                    <li><strong>Check Roommates:</strong> You can see your roommate information in the system.</li>
                    <li><strong>Follow Rules:</strong> Please ensure you comply with all hall rules and regulations.</li>
                    <li><strong>Need Help?</strong> Contact the hall administration office if you have any questions.</li>
                </ul>
            </div>

            <p style='margin-top: 25px;'>We hope you have a comfortable stay in your {(isRoomChange ? "new" : "")} room!</p>

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

    public class BulkDeleteRequest
    {
        public List<string> StudentIds { get; set; } = new List<string>();
    }
}
