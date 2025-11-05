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
    public class ComplaintsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public ComplaintsController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // Get all complaints for admin
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetAllComplaints()
        {
            try
            {
                var complaints = await _context.Complaints
                    .Include(c => c.Student)
                    .OrderByDescending(c => c.SubmittedDate)
                    .Select(c => new
                    {
                        c.Id,
                        c.ComplaintType,
                        c.ShortDescription,
                        c.OccurrenceTime,
                        c.Status,
                        c.SubmittedDate,
                        c.ResolvedDate,
                        Student = new
                        {
                            c.Student.Id,
                            c.Student.StudentId,
                            c.Student.FirstName,
                            c.Student.LastName,
                            c.Student.Email,
                            c.Student.PhoneNumber,
                            c.Student.Department,
                            c.Student.Year,
                            c.Student.Session,
                            c.Student.RoomNo,
                            c.Student.Block,
                            c.Student.BedNo,
                            c.Student.ProfileImageUrl
                        }
                    })
                    .ToListAsync();

                return Ok(complaints);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error fetching complaints: {ex.Message}");
            }
        }

        // Submit new complaint (Student)
        [HttpPost]
        public async Task<ActionResult> CreateComplaint([FromBody] ComplaintDto request)
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

                // Create complaint
                var complaint = new Complaint
                {
                    StudentId = student.Id, // Use database ID for foreign key
                    ComplaintType = request.ComplaintType,
                    ShortDescription = request.ShortDescription,
                    OccurrenceTime = request.OccurrenceTime,
                    Status = "Unsolved",
                    SubmittedDate = DateTime.UtcNow
                };

                _context.Complaints.Add(complaint);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Complaint submitted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating complaint: {ex.Message}");
            }
        }

        // Get student's complaints with pagination
        [HttpGet("my-complaints")]
        public async Task<ActionResult> GetMyComplaints([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
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

                var totalComplaints = await _context.Complaints
                    .CountAsync(c => c.StudentId == student.Id);

                var complaints = await _context.Complaints
                    .Where(c => c.StudentId == student.Id)
                    .OrderByDescending(c => c.SubmittedDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(c => new
                    {
                        c.Id,
                        c.ComplaintType,
                        c.ShortDescription,
                        c.OccurrenceTime,
                        c.Status,
                        c.SubmittedDate,
                        c.ResolvedDate
                    })
                    .ToListAsync();

                return Ok(new
                {
                    complaints,
                    totalComplaints,
                    currentPage = page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)totalComplaints / pageSize)
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error fetching complaints: {ex.Message}");
            }
        }

        // Get complaint statistics for student
        [HttpGet("stats")]
        public async Task<ActionResult> GetComplaintStats()
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

                var totalComplaints = await _context.Complaints
                    .CountAsync(c => c.StudentId == student.Id);

                var solvedComplaints = await _context.Complaints
                    .CountAsync(c => c.StudentId == student.Id && c.Status == "Solved");

                var unsolvedComplaints = totalComplaints - solvedComplaints;

                var lastComplaint = await _context.Complaints
                    .Where(c => c.StudentId == student.Id)
                    .OrderByDescending(c => c.SubmittedDate)
                    .Select(c => new { c.Status, c.ComplaintType })
                    .FirstOrDefaultAsync();

                return Ok(new
                {
                    totalComplaints,
                    solvedComplaints,
                    unsolvedComplaints,
                    lastComplaint
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error fetching complaint stats: {ex.Message}");
            }
        }

        // Mark complaint as solved (Admin)
        [HttpPut("{id}/mark-solved")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> MarkComplaintAsSolved(int id)
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

                var complaint = await _context.Complaints
                    .Include(c => c.Student)
                    .FirstOrDefaultAsync(c => c.Id == id);
                if (complaint == null)
                {
                    return NotFound("Complaint not found");
                }

                // Update complaint status
                complaint.Status = "Solved";
                complaint.ResolvedDate = DateTime.UtcNow;
                complaint.ResolvedByAdminId = admin.Id;

                await _context.SaveChangesAsync();

                // Send email notification to student
                await SendComplaintResolvedEmail(complaint, admin);

                return Ok(new { message = "Complaint marked as solved and student notified" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error updating complaint: {ex.Message}");
            }
        }

        private async Task SendComplaintResolvedEmail(Complaint complaint, Admin admin)
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
                    Subject = $"✅ Your Complaint Has Been Resolved - {complaint.ComplaintType}",
                    Body = GenerateComplaintResolvedEmailBody(complaint, admin),
                    IsBodyHtml = true
                };

                mailMessage.To.Add(complaint.Student.Email);

                await smtpClient.SendMailAsync(mailMessage);
                Console.WriteLine($"Complaint resolved email sent to {complaint.Student.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send email: {ex.Message}");
            }
        }

        private string GenerateComplaintResolvedEmailBody(Complaint complaint, Admin admin)
        {
            return $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Complaint Resolved</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 28px; font-weight: bold; }}
        .header p {{ margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }}
        .content {{ padding: 30px; }}
        .success-banner {{ background-color: #f0fdf4; border-left: 5px solid #10b981; padding: 15px; margin-bottom: 25px; border-radius: 0 8px 8px 0; }}
        .success-banner h2 {{ color: #059669; margin: 0 0 10px 0; font-size: 20px; }}
        .complaint-details {{ background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #e2e8f0; }}
        .complaint-details h3 {{ color: #1e40af; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #dbeafe; padding-bottom: 10px; }}
        .detail-row {{ display: flex; margin-bottom: 15px; }}
        .detail-label {{ font-weight: bold; color: #374151; min-width: 140px; }}
        .detail-value {{ color: #1f2937; flex: 1; }}
        .status-badge {{ background-color: #10b981; color: white; padding: 8px 16px; border-radius: 25px; font-weight: bold; font-size: 14px; display: inline-block; }}
        .footer {{ background-color: #1f2937; color: #d1d5db; padding: 25px; text-align: center; }}
        .footer p {{ margin: 5px 0; }}
        .highlight {{ background-color: #fef3c7; padding: 2px 6px; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>✅ Complaint Resolved</h1>
            <p>Your issue has been successfully addressed</p>
        </div>
        
        <div class='content'>
            <div class='success-banner'>
                <h2>🎉 Great News!</h2>
                <p>Dear <strong>{complaint.Student.FirstName} {complaint.Student.LastName}</strong>, we're pleased to inform you that your complaint has been resolved.</p>
            </div>
            
            <div class='complaint-details'>
                <h3>📋 Complaint Details</h3>
                <div class='detail-row'>
                    <div class='detail-label'>Complaint Type:</div>
                    <div class='detail-value'><strong>{complaint.ComplaintType}</strong></div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Description:</div>
                    <div class='detail-value'>{complaint.ShortDescription}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Occurrence Time:</div>
                    <div class='detail-value'>{complaint.OccurrenceTime}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Submitted Date:</div>
                    <div class='detail-value'>{complaint.SubmittedDate:MMMM dd, yyyy 'at' hh:mm tt}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Resolved Date:</div>
                    <div class='detail-value'>{complaint.ResolvedDate:MMMM dd, yyyy 'at' hh:mm tt}</div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>Status:</div>
                    <div class='detail-value'><span class='status-badge'>Solved</span></div>
                </div>
            </div>
            
            <div style='text-align: center; margin: 30px 0;'>
                <p style='font-size: 18px; color: #1f2937; margin-bottom: 20px; font-weight: 500;'>
                    Thank you for your patience. We hope the issue has been resolved to your satisfaction.
                </p>
                <p style='color: #6b7280; font-size: 16px;'>
                    If you have any further concerns, please don't hesitate to submit another complaint.
                </p>
            </div>
        </div>
        
        <div class='footer'>
            <p><strong>🏢 Hall Management System</strong></p>
            <p>Committed to providing excellent service • Building a better living experience</p>
            <p style='font-size: 12px; opacity: 0.8;'>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
        }
    }

    public class ComplaintDto
    {
        public string ComplaintType { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string OccurrenceTime { get; set; } = string.Empty;
    }
}
