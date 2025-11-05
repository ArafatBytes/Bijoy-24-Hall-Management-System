using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using HallManagementSystem.Services;
using HallManagementSystem.Models;
using HallManagementSystem.Data;
using Microsoft.EntityFrameworkCore;

namespace HallManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NoticesController : ControllerBase
    {
        private readonly INoticeService _noticeService;
        private readonly ApplicationDbContext _context;

        public NoticesController(INoticeService noticeService, ApplicationDbContext context)
        {
            _noticeService = noticeService;
            _context = context;
        }

        // Create new notice (Admin only)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Notice>> CreateNotice([FromBody] CreateNoticeDto request)
        {
            try
            {
                // Get current admin ID from JWT token
                var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminIdClaim))
                {
                    return Unauthorized("Invalid admin token");
                }

                // Get admin details
                var admin = await _context.Admins
                    .FirstOrDefaultAsync(a => a.AdminId == adminIdClaim && a.IsActive);
                if (admin == null)
                {
                    return NotFound("Admin not found");
                }

                var notice = new Notice
                {
                    Subject = request.Subject,
                    Description = request.Description,
                    AttachmentUrl = request.AttachmentUrl,
                    AttachmentFileName = request.AttachmentFileName,
                    AttachmentType = request.AttachmentType,
                    AdminId = admin.Id,
                    CreatedDate = DateTime.Now,
                    IsActive = true
                };

                var createdNotice = await _noticeService.CreateNoticeAsync(notice);
                
                // Return DTO instead of full entity to avoid circular reference
                return Ok(new
                {
                    createdNotice.Id,
                    createdNotice.Subject,
                    createdNotice.Description,
                    createdNotice.AttachmentUrl,
                    createdNotice.AttachmentFileName,
                    createdNotice.AttachmentType,
                    createdNotice.CreatedDate,
                    createdNotice.IsActive
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating notice: {ex.Message}");
            }
        }

        // Get all notices for admin (history)
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetAdminNotices()
        {
            try
            {
                // Get current admin ID from JWT token
                var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminIdClaim))
                {
                    return Unauthorized("Invalid admin token");
                }

                // Get admin details
                var admin = await _context.Admins
                    .FirstOrDefaultAsync(a => a.AdminId == adminIdClaim && a.IsActive);
                if (admin == null)
                {
                    return NotFound("Admin not found");
                }

                var notices = await _noticeService.GetAllNoticesForAdminAsync(admin.Id);
                
                var noticesWithStats = notices.Select(n => new
                {
                    n.Id,
                    n.Subject,
                    n.Description,
                    n.AttachmentUrl,
                    n.AttachmentFileName,
                    n.AttachmentType,
                    n.CreatedDate,
                    TotalReads = n.NoticeReads.Count
                }).ToList();

                return Ok(noticesWithStats);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error fetching notices: {ex.Message}");
            }
        }

        // Get notices for student with pagination
        [HttpGet("student")]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult> GetStudentNotices([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                // Get current student ID from JWT token
                var studentIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(studentIdClaim))
                {
                    return Unauthorized("Invalid student token");
                }

                // Get student details
                var student = await _context.Students
                    .FirstOrDefaultAsync(s => s.StudentId == studentIdClaim && s.IsActive);
                if (student == null)
                {
                    return NotFound("Student not found");
                }

                var (notices, totalCount) = await _noticeService.GetNoticesForStudentAsync(student.Id, page, pageSize);

                var noticesWithReadStatus = notices.Select(n => new
                {
                    n.Id,
                    n.Subject,
                    n.Description,
                    n.AttachmentUrl,
                    n.AttachmentFileName,
                    n.AttachmentType,
                    n.CreatedDate,
                    Admin = new
                    {
                        n.Admin.FirstName,
                        n.Admin.LastName
                    },
                    IsRead = n.NoticeReads.Any(nr => nr.StudentId == student.Id)
                }).ToList();

                return Ok(new
                {
                    Notices = noticesWithReadStatus,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error fetching notices: {ex.Message}");
            }
        }

        // Get notice by ID
        [HttpGet("{id}")]
        public async Task<ActionResult> GetNoticeById(int id)
        {
            try
            {
                var notice = await _noticeService.GetNoticeByIdAsync(id);
                if (notice == null)
                {
                    return NotFound("Notice not found");
                }

                return Ok(new
                {
                    notice.Id,
                    notice.Subject,
                    notice.Description,
                    notice.AttachmentUrl,
                    notice.AttachmentFileName,
                    notice.AttachmentType,
                    notice.CreatedDate,
                    Admin = new
                    {
                        notice.Admin.FirstName,
                        notice.Admin.LastName
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error fetching notice: {ex.Message}");
            }
        }

        // Mark notice as read
        [HttpPost("{id}/read")]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult> MarkNoticeAsRead(int id)
        {
            try
            {
                // Get current student ID from JWT token
                var studentIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(studentIdClaim))
                {
                    return Unauthorized("Invalid student token");
                }

                // Get student details
                var student = await _context.Students
                    .FirstOrDefaultAsync(s => s.StudentId == studentIdClaim && s.IsActive);
                if (student == null)
                {
                    return NotFound("Student not found");
                }

                var result = await _noticeService.MarkNoticeAsReadAsync(id, student.Id);
                if (result)
                {
                    return Ok(new { message = "Notice marked as read" });
                }
                return BadRequest("Failed to mark notice as read");
            }
            catch (Exception ex)
            {
                return BadRequest($"Error marking notice as read: {ex.Message}");
            }
        }

        // Check if student has unread notices
        [HttpGet("student/unread-count")]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult> GetUnreadCount()
        {
            try
            {
                // Get current student ID from JWT token
                var studentIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(studentIdClaim))
                {
                    return Unauthorized("Invalid student token");
                }

                // Get student details
                var student = await _context.Students
                    .FirstOrDefaultAsync(s => s.StudentId == studentIdClaim && s.IsActive);
                if (student == null)
                {
                    return NotFound("Student not found");
                }

                var unreadCount = await _noticeService.GetUnreadNoticesCountAsync(student.Id);
                var hasUnread = unreadCount > 0;

                return Ok(new
                {
                    UnreadCount = unreadCount,
                    HasUnread = hasUnread
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error fetching unread count: {ex.Message}");
            }
        }

        // Delete notice (soft delete)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteNotice(int id)
        {
            try
            {
                var result = await _noticeService.DeleteNoticeAsync(id);
                if (result)
                {
                    return Ok(new { message = "Notice deleted successfully" });
                }
                return NotFound("Notice not found");
            }
            catch (Exception ex)
            {
                return BadRequest($"Error deleting notice: {ex.Message}");
            }
        }
    }

    // DTOs
    public class CreateNoticeDto
    {
        public string Subject { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? AttachmentUrl { get; set; }
        public string? AttachmentFileName { get; set; }
        public string? AttachmentType { get; set; }
    }
}
