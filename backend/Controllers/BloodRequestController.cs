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
    public class BloodRequestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public BloodRequestController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost]
        public async Task<ActionResult> CreateBloodRequest([FromBody] BloodRequestDto request)
        {
            try
            {
                // Get current student ID from JWT token
                var studentIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(studentIdClaim))
                {
                    return Unauthorized("Invalid student token");
                }

                // Get requester details using StudentId (not database ID)
                var requester = await _context.Students
                    .FirstOrDefaultAsync(s => s.StudentId == studentIdClaim && s.IsActive);
                if (requester == null)
                {
                    return NotFound("Student not found");
                }

                // Create blood request
                var bloodRequest = new BloodRequest
                {
                    RequesterId = requester.Id, // Use database ID for foreign key
                    BloodGroupNeeded = request.BloodGroupNeeded,
                    Place = request.Place,
                    Time = request.Time,
                    SpecialNotes = request.SpecialNotes,
                    RequestDate = DateTime.UtcNow,
                    IsActive = true
                };

                _context.BloodRequests.Add(bloodRequest);
                await _context.SaveChangesAsync();

                // Find potential donors with matching blood group
                var potentialDonors = await _context.Students
                    .Where(s => s.BloodGroup == request.BloodGroupNeeded && 
                               s.Id != requester.Id && 
                               s.IsActive &&
                               !string.IsNullOrEmpty(s.Email))
                    .ToListAsync();

                // Send emails to potential donors
                await SendBloodRequestEmails(potentialDonors, bloodRequest, requester);

                return Ok(new { 
                    message = "Blood request created successfully", 
                    donorsNotified = potentialDonors.Count 
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating blood request: {ex.Message}");
            }
        }

        private async Task SendBloodRequestEmails(List<Student> donors, BloodRequest request, Student requester)
        {
            try
            {
                var smtpClient = new SmtpClient("smtp.gmail.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential("dummytest801@gmail.com", "sqre tshl lhxn qkbq"),
                    EnableSsl = true,
                };

                foreach (var donor in donors)
                {
                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress("dummytest801@gmail.com", "Hall Management System - Blood Bank"),
                        Subject = $"🩸 Urgent Blood Donation Request - {request.BloodGroupNeeded} Blood Needed",
                        Body = GenerateEmailBody(request, requester, donor),
                        IsBodyHtml = true
                    };

                    mailMessage.To.Add(donor.Email);

                    try
                    {
                        await smtpClient.SendMailAsync(mailMessage);
                        Console.WriteLine($"Email sent successfully to {donor.Email}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to send email to {donor.Email}: {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"SMTP configuration error: {ex.Message}");
            }
        }

        private string GenerateEmailBody(BloodRequest request, Student requester, Student donor)
        {
            return $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Blood Donation Request</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #dc2626, #f59e0b); color: white; padding: 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 28px; font-weight: bold; }}
        .header p {{ margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }}
        .content {{ padding: 30px; }}
        .urgent-banner {{ background-color: #fef2f2; border-left: 5px solid #dc2626; padding: 15px; margin-bottom: 25px; border-radius: 0 8px 8px 0; }}
        .urgent-banner h2 {{ color: #dc2626; margin: 0 0 10px 0; font-size: 20px; }}
        .request-details {{ background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #e2e8f0; }}
        .request-details h3 {{ color: #1e40af; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #dbeafe; padding-bottom: 10px; }}
        .detail-row {{ display: flex; margin-bottom: 15px; }}
        .detail-label {{ font-weight: bold; color: #374151; min-width: 140px; }}
        .detail-value {{ color: #1f2937; flex: 1; }}
        .blood-group {{ background-color: #dc2626; color: white; padding: 8px 16px; border-radius: 25px; font-weight: bold; font-size: 18px; display: inline-block; }}
        .contact-section {{ background-color: #ecfdf5; border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #10b981; }}
        .contact-section h3 {{ color: #059669; margin: 0 0 20px 0; font-size: 18px; }}
        .contact-info {{ background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #d1fae5; }}
        .contact-row {{ margin-bottom: 12px; }}
        .contact-label {{ font-weight: bold; color: #065f46; display: inline-block; min-width: 100px; }}
        .contact-value {{ color: #047857; }}
        .cta-section {{ text-align: center; margin: 30px 0; }}
        .cta-text {{ font-size: 18px; color: #1f2937; margin-bottom: 20px; font-weight: 500; }}
        .footer {{ background-color: #1f2937; color: #d1d5db; padding: 25px; text-align: center; }}
        .footer p {{ margin: 5px 0; }}
        .highlight {{ background-color: #fef3c7; padding: 2px 6px; border-radius: 4px; }}
        .emoji {{ font-size: 20px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🩸 Blood Donation Request</h1>
            <p>Your help can save a life today</p>
        </div>
        
        <div class='content'>
            <div class='urgent-banner'>
                <h2>🚨 Urgent Blood Donation Needed</h2>
                <p>Dear <strong>{donor.FirstName} {donor.LastName}</strong>, a fellow student needs your help. Your blood group matches their urgent requirement.</p>
            </div>
            
            <div class='request-details'>
                <h3>📋 Request Details</h3>
                <div class='detail-row'>
                    <div class='detail-label'>Blood Group Needed:</div>
                    <div class='detail-value'><span class='blood-group'>{request.BloodGroupNeeded}</span></div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>📍 Location:</div>
                    <div class='detail-value'><strong>{request.Place}</strong></div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>⏰ Time Needed:</div>
                    <div class='detail-value'><strong>{request.Time}</strong></div>
                </div>
                <div class='detail-row'>
                    <div class='detail-label'>📅 Request Date:</div>
                    <div class='detail-value'>{request.RequestDate:MMMM dd, yyyy 'at' hh:mm tt}</div>
                </div>
                {(string.IsNullOrEmpty(request.SpecialNotes) ? "" : $@"
                <div class='detail-row'>
                    <div class='detail-label'>📝 Special Notes:</div>
                    <div class='detail-value'><em>{request.SpecialNotes}</em></div>
                </div>")}
            </div>
            
            <div class='contact-section'>
                <h3>📞 Contact Information</h3>
                <p style='margin-bottom: 15px; color: #065f46;'>If you can help, please contact the requester directly:</p>
                <div class='contact-info'>
                    <div class='contact-row'>
                        <span class='contact-label'>Name:</span>
                        <span class='contact-value'><strong>{requester.FirstName} {requester.LastName}</strong></span>
                    </div>
                    <div class='contact-row'>
                        <span class='contact-label'>Student ID:</span>
                        <span class='contact-value'><strong>{requester.StudentId}</strong></span>
                    </div>
                    <div class='contact-row'>
                        <span class='contact-label'>Department:</span>
                        <span class='contact-value'><strong>{requester.Department}</strong></span>
                    </div>
                    <div class='contact-row'>
                        <span class='contact-label'>Email:</span>
                        <span class='contact-value'><strong>{requester.Email}</strong></span>
                    </div>
                    <div class='contact-row'>
                        <span class='contact-label'>Phone:</span>
                        <span class='contact-value'><strong>{requester.PhoneNumber}</strong></span>
                    </div>
                </div>
            </div>
            
            <div class='cta-section'>
                <p class='cta-text'>
                    <span class='emoji'>❤️</span> <strong>Your donation can save a life!</strong> <span class='emoji'>❤️</span>
                </p>
                <p style='color: #6b7280; font-size: 16px;'>
                    If you're able to donate, please contact <span class='highlight'>{requester.FirstName}</span> immediately using the contact details above.
                    Every minute counts in emergency situations.
                </p>
            </div>
        </div>
        
        <div class='footer'>
            <p><strong>🏥 Hall Management System - Blood Bank</strong></p>
            <p>Connecting students to save lives • Building a caring community</p>
            <p style='font-size: 12px; opacity: 0.8;'>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
        }
    }

    public class BloodRequestDto
    {
        public string BloodGroupNeeded { get; set; } = string.Empty;
        public string Place { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public string? SpecialNotes { get; set; }
    }
}
