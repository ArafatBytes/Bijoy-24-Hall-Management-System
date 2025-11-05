using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Net.Mail;
using System.Net;
using HallManagementSystem.Data;
using HallManagementSystem.Models;

namespace HallManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GalleryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public GalleryController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // Get approved galleries for public display (no authorization required)
        [HttpGet("approved")]
        [AllowAnonymous]
        public async Task<ActionResult> GetApprovedGalleries()
        {
            try
            {
                var approvedGalleries = await _context.Galleries
                    .Include(g => g.Student)
                    .Where(g => g.Status == "Approved")
                    .OrderByDescending(g => g.ReviewedDate)
                    .Select(g => new
                    {
                        g.Id,
                        g.ImageUrl,
                        g.ShortDescription,
                        g.TimeOfEvent,
                        g.Status,
                        g.SubmittedDate,
                        g.ReviewedDate,
                        Student = new
                        {
                            g.Student.StudentId,
                            g.Student.FirstName,
                            g.Student.LastName
                        }
                    })
                    .ToListAsync();

                return Ok(approvedGalleries);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"=== BACKEND ERROR: GetApprovedGalleries ===");
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Internal server error while fetching approved galleries" });
            }
        }

        // Get all gallery requests for admin
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetAllGalleryRequests()
        {
            try
            {
                var galleries = await _context.Galleries
                    .Include(g => g.Student)
                    .OrderByDescending(g => g.SubmittedDate)
                    .Select(g => new
                    {
                        g.Id,
                        g.ImageUrl,
                        g.ShortDescription,
                        g.TimeOfEvent,
                        g.Status,
                        g.SubmittedDate,
                        g.ReviewedDate,
                        g.AdminResponse,
                        Student = new
                        {
                            g.Student.Id,
                            g.Student.StudentId,
                            g.Student.FirstName,
                            g.Student.LastName,
                            g.Student.Email,
                            g.Student.PhoneNumber,
                            g.Student.Department,
                            g.Student.Year,
                            g.Student.Session,
                            g.Student.RoomNo,
                            g.Student.Block,
                            g.Student.BedNo,
                            g.Student.ProfileImageUrl
                        }
                    })
                    .ToListAsync();

                return Ok(galleries);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error fetching gallery requests: {ex.Message}");
            }
        }

        // Submit new gallery request (Student)
        [HttpPost]
        public async Task<ActionResult> CreateGalleryRequest([FromBody] GalleryDto request)
        {
            try
            {
                // Get current student ID from JWT token
                var studentIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(studentIdClaim))
                {
                    return Unauthorized("Invalid student token");
                }

                // Get student details using StudentId (not database ID)
                var student = await _context.Students
                    .FirstOrDefaultAsync(s => s.StudentId == studentIdClaim && s.IsActive);
                if (student == null)
                {
                    return NotFound("Student not found");
                }

                // Create gallery request
                var gallery = new Gallery
                {
                    StudentId = student.Id, // Use database ID for foreign key
                    ImageUrl = request.ImageUrl,
                    ShortDescription = request.ShortDescription,
                    TimeOfEvent = request.TimeOfEvent,
                    Status = "Pending",
                    SubmittedDate = DateTime.UtcNow
                };

                _context.Galleries.Add(gallery);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Gallery request submitted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating gallery request: {ex.Message}");
            }
        }

        // Get student's gallery requests
        [HttpGet("my-galleries")]
        public async Task<ActionResult> GetMyGalleries()
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

                var galleries = await _context.Galleries
                    .Where(g => g.StudentId == student.Id)
                    .OrderByDescending(g => g.SubmittedDate)
                    .Select(g => new
                    {
                        g.Id,
                        g.ImageUrl,
                        g.ShortDescription,
                        g.TimeOfEvent,
                        g.Status,
                        g.SubmittedDate,
                        g.ReviewedDate,
                        g.AdminResponse
                    })
                    .ToListAsync();

                return Ok(galleries);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error fetching gallery requests: {ex.Message}");
            }
        }

        // Approve gallery request (Admin)
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> ApproveGalleryRequest(int id, [FromBody] AdminActionDto action)
        {
            try
            {
                var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminIdClaim))
                {
                    return Unauthorized("Invalid admin token");
                }

                var admin = await _context.Admins
                    .FirstOrDefaultAsync(a => a.AdminId == adminIdClaim && a.IsActive);
                if (admin == null)
                {
                    return NotFound("Admin not found");
                }

                var gallery = await _context.Galleries
                    .Include(g => g.Student)
                    .FirstOrDefaultAsync(g => g.Id == id);
                if (gallery == null)
                {
                    return NotFound("Gallery request not found");
                }

                // Update gallery status
                gallery.Status = "Approved";
                gallery.ReviewedDate = DateTime.UtcNow;
                gallery.ReviewedByAdminId = admin.Id;
                gallery.AdminResponse = action.AdminResponse ?? "Your gallery request has been approved.";

                await _context.SaveChangesAsync();

                // Send email notification to student
                await SendGalleryStatusEmail(gallery, admin, "Approved");

                return Ok(new { message = "Gallery request approved and student notified" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error approving gallery request: {ex.Message}");
            }
        }

        // Reject gallery request (Admin)
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> RejectGalleryRequest(int id, [FromBody] AdminActionDto action)
        {
            try
            {
                var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminIdClaim))
                {
                    return Unauthorized("Invalid admin token");
                }

                var admin = await _context.Admins
                    .FirstOrDefaultAsync(a => a.AdminId == adminIdClaim && a.IsActive);
                if (admin == null)
                {
                    return NotFound("Admin not found");
                }

                var gallery = await _context.Galleries
                    .Include(g => g.Student)
                    .FirstOrDefaultAsync(g => g.Id == id);
                if (gallery == null)
                {
                    return NotFound("Gallery request not found");
                }

                // Update gallery status
                gallery.Status = "Rejected";
                gallery.ReviewedDate = DateTime.UtcNow;
                gallery.ReviewedByAdminId = admin.Id;
                gallery.AdminResponse = action.AdminResponse ?? "Your gallery request has been rejected.";

                await _context.SaveChangesAsync();

                // Send email notification to student
                await SendGalleryStatusEmail(gallery, admin, "Rejected");

                return Ok(new { message = "Gallery request rejected and student notified" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error rejecting gallery request: {ex.Message}");
            }
        }

        // Delete gallery request (Admin)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteGalleryRequest(int id)
        {
            try
            {
                var gallery = await _context.Galleries.FindAsync(id);
                if (gallery == null)
                {
                    return NotFound("Gallery request not found");
                }

                _context.Galleries.Remove(gallery);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Gallery request deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error deleting gallery request: {ex.Message}");
            }
        }

        private async Task SendGalleryStatusEmail(Gallery gallery, Admin admin, string status)
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
                    Subject = $"📸 Gallery Request {status} - Hall Management System",
                    Body = GenerateGalleryStatusEmailBody(gallery, admin, status),
                    IsBodyHtml = true
                };

                mailMessage.To.Add(gallery.Student.Email);

                await smtpClient.SendMailAsync(mailMessage);
                Console.WriteLine($"Gallery status email sent to {gallery.Student.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send email: {ex.Message}");
            }
        }

        private string GenerateGalleryStatusEmailBody(Gallery gallery, Admin admin, string status)
        {
            var statusColor = status == "Approved" ? "#10b981" : "#ef4444";
            var statusIcon = status == "Approved" ? "✅" : "❌";
            var statusMessage = status == "Approved" 
                ? "Great news! Your gallery request has been approved and will be featured in our hall gallery."
                : "We regret to inform you that your gallery request has been rejected.";

            return $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Gallery Request {status}</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, {statusColor}, {statusColor}dd); color: white; padding: 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 28px; font-weight: bold; }}
        .header p {{ margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }}
        .content {{ padding: 30px; }}
        .status-banner {{ background-color: {(status == "Approved" ? "#f0fdf4" : "#fef2f2")}; border-left: 5px solid {statusColor}; padding: 15px; margin-bottom: 25px; border-radius: 0 8px 8px 0; }}
        .status-banner h2 {{ color: {statusColor}; margin: 0 0 10px 0; font-size: 20px; }}
        .gallery-details {{ background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #e2e8f0; }}
        .gallery-details h3 {{ color: #1e40af; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #dbeafe; padding-bottom: 10px; }}
        .detail-row {{ display: flex; margin-bottom: 15px; }}
        .detail-label {{ font-weight: bold; color: #374151; min-width: 140px; }}
        .detail-value {{ color: #1f2937; flex: 1; }}
        .status-badge {{ background-color: {statusColor}; color: white; padding: 8px 16px; border-radius: 25px; font-weight: bold; font-size: 14px; display: inline-block; }}
        .footer {{ background-color: #1f2937; color: #d1d5db; padding: 25px; text-align: center; }}
        .footer p {{ margin: 5px 0; }}
        .image-preview {{ text-align: center; margin: 20px 0; }}
        .image-preview img {{ max-width: 300px; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>{statusIcon} Gallery Request {status}</h1>
            <p>Your submission has been reviewed</p>
        </div>
        
        <div class='content'>
            <div class='status-banner'>
                <h2>📸 {status} Status</h2>
                <p>Dear <strong>{gallery.Student.FirstName} {gallery.Student.LastName}</strong>, {statusMessage}</p>
            </div>
            
            <div class='gallery-details'>
                <h3>📋 Request Details</h3>
                <div class='detail-row'>
                    <div class='detail-label'>Description:</div>
                    <div class='detail-value'>{gallery.ShortDescription}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Time of Event:</div>
                    <div class='detail-value'>{gallery.TimeOfEvent}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Submitted Date:</div>
                    <div class='detail-value'>{gallery.SubmittedDate:MMMM dd, yyyy 'at' hh:mm tt}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Reviewed Date:</div>
                    <div class='detail-value'>{gallery.ReviewedDate:MMMM dd, yyyy 'at' hh:mm tt}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Status:</div>
                    <div class='detail-value'><span class='status-badge'>{status}</span></div>
                </div>
                {(string.IsNullOrEmpty(gallery.AdminResponse) ? "" : $@"
                <div class='detail-row'>
                    <div class='detail-label'>Admin Response:</div>
                    <div class='detail-value'>{gallery.AdminResponse}</div>
                </div>")}
            </div>
            
            <div class='image-preview'>
                <h4>📷 Submitted Image</h4>
                <img src='{gallery.ImageUrl}' alt='Gallery Image' />
            </div>
            
            <div style='text-align: center; margin: 30px 0;'>
                <p style='font-size: 18px; color: #1f2937; margin-bottom: 20px; font-weight: 500;'>
                    {(status == "Approved" ? "Thank you for contributing to our hall gallery!" : "Please feel free to submit another request in the future.")}
                </p>
                <p style='color: #6b7280; font-size: 16px;'>
                    If you have any questions, please contact the hall administration.
                </p>
            </div>
        </div>
        
        <div class='footer'>
            <p><strong>🏢 Hall Management System</strong></p>
            <p>Building memories together • Creating a vibrant community</p>
            <p style='font-size: 12px; opacity: 0.8;'>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
        }
    }

    public class GalleryDto
    {
        public string ImageUrl { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string TimeOfEvent { get; set; } = string.Empty;
    }

    public class AdminActionDto
    {
        public string? AdminResponse { get; set; }
    }
}
