using Microsoft.AspNetCore.Mvc;
using HallManagementSystem.Models;
using HallManagementSystem.Services;
using HallManagementSystem.Data;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;
using System.Net;

namespace HallManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ApplicationDbContext _context;
        private static Dictionary<string, OtpData> _otpStore = new Dictionary<string, OtpData>();

        public AuthController(IAuthService authService, ApplicationDbContext context)
        {
            _authService = authService;
            _context = context;
        }

        [HttpPost("student/login")]
        public async Task<IActionResult> StudentLogin([FromBody] LoginRequest request)
        {
            var token = await _authService.AuthenticateStudentAsync(request.UserId, request.Password);
            
            if (token == null)
                return Unauthorized(new { message = "Invalid credentials" });

            return Ok(new { token, userType = "Student" });
        }

        [HttpPost("admin/login")]
        public async Task<IActionResult> AdminLogin([FromBody] LoginRequest request)
        {
            var token = await _authService.AuthenticateAdminAsync(request.UserId, request.Password);
            
            if (token == null)
                return Unauthorized(new { message = "Invalid credentials" });

            return Ok(new { token, userType = "Admin" });
        }

        [HttpPost("student/register")]
        public async Task<IActionResult> StudentRegister([FromBody] StudentRegistrationRequest request)
        {
            var student = new Student
            {
                StudentId = request.StudentId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                GuardianPhoneNumber = request.GuardianPhoneNumber,
                Address = request.Address,
                DateOfBirth = request.DateOfBirth,
                Department = request.Department,
                Year = request.Year,
                Session = request.Session,
                BloodGroup = request.BloodGroup
            };

            var registeredStudent = await _authService.RegisterStudentAsync(student, request.Password);
            
            if (registeredStudent == null)
                return BadRequest(new { message = "Student ID or email already exists" });

            var token = await _authService.AuthenticateStudentAsync(student.StudentId, request.Password);
            
            return Ok(new { 
                message = "Registration successful", 
                token,
                userType = "Student",
                student = new {
                    registeredStudent.Id,
                    registeredStudent.StudentId,
                    registeredStudent.FirstName,
                    registeredStudent.LastName,
                    registeredStudent.Email
                }
            });
        }

        [HttpPost("forgot-password/send-otp")]
        public async Task<IActionResult> SendPasswordResetOTP([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                var student = await _context.Students.FirstOrDefaultAsync(s => s.StudentId == request.StudentId);
                
                if (student == null)
                    return NotFound(new { message = "Student ID not found" });

                // Generate 6-digit OTP
                var random = new Random();
                var otp = random.Next(100000, 999999).ToString();
                
                // Store OTP with expiration (5 minutes)
                var otpData = new OtpData 
                { 
                    Otp = otp, 
                    ExpiresAt = DateTime.UtcNow.AddMinutes(5),
                    Email = student.Email
                };
                
                _otpStore[request.StudentId] = otpData;

                // Send OTP via email
                await SendOtpEmail(student.Email, student.FirstName, otp);

                return Ok(new { message = "OTP sent to your registered email", email = MaskEmail(student.Email) });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error sending OTP: {ex.Message}" });
            }
        }

        [HttpPost("forgot-password/verify-otp")]
        public IActionResult VerifyOTP([FromBody] VerifyOtpRequest request)
        {
            try
            {
                if (!_otpStore.ContainsKey(request.StudentId))
                    return BadRequest(new { message = "No OTP request found. Please request a new OTP." });

                var otpData = _otpStore[request.StudentId];

                // Check if OTP expired
                if (DateTime.UtcNow > otpData.ExpiresAt)
                {
                    _otpStore.Remove(request.StudentId);
                    return BadRequest(new { message = "OTP has expired. Please request a new one." });
                }

                // Verify OTP
                if (otpData.Otp != request.Otp)
                    return BadRequest(new { message = "Invalid OTP. Please try again." });

                // OTP is valid
                return Ok(new { message = "OTP verified successfully", verified = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error verifying OTP: {ex.Message}" });
            }
        }

        [HttpPost("forgot-password/reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                if (!_otpStore.ContainsKey(request.StudentId))
                    return BadRequest(new { message = "Session expired. Please start the password reset process again." });

                var otpData = _otpStore[request.StudentId];

                // Verify OTP one more time
                if (otpData.Otp != request.Otp || DateTime.UtcNow > otpData.ExpiresAt)
                {
                    _otpStore.Remove(request.StudentId);
                    return BadRequest(new { message = "Invalid or expired session." });
                }

                var student = await _context.Students.FirstOrDefaultAsync(s => s.StudentId == request.StudentId);
                
                if (student == null)
                    return NotFound(new { message = "Student not found" });

                // Update password
                student.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                await _context.SaveChangesAsync();

                // Remove OTP from store
                _otpStore.Remove(request.StudentId);

                return Ok(new { message = "Password reset successfully. You can now login with your new password." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error resetting password: {ex.Message}" });
            }
        }

        private async Task SendOtpEmail(string email, string firstName, string otp)
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
                    From = new MailAddress("dummytest801@gmail.com", "Bijoy 24 Hall Management"),
                    Subject = "🔐 Password Reset OTP - Bijoy 24 Hall",
                    Body = GenerateOtpEmailBody(firstName, otp),
                    IsBodyHtml = true
                };

                mailMessage.To.Add(email);

                await smtpClient.SendMailAsync(mailMessage);
                Console.WriteLine($"OTP email sent to {email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send OTP email: {ex.Message}");
                throw;
            }
        }

        private string GenerateOtpEmailBody(string firstName, string otp)
        {
            return $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Password Reset OTP</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #7c2d12, #991b1b); color: white; padding: 40px 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 28px; font-weight: bold; }}
        .header p {{ margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }}
        .content {{ padding: 40px 30px; }}
        .otp-container {{ background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center; border: 3px dashed #f59e0b; }}
        .otp-code {{ font-size: 48px; font-weight: bold; color: #7c2d12; letter-spacing: 8px; margin: 20px 0; font-family: 'Courier New', monospace; text-shadow: 2px 2px 4px rgba(0,0,0,0.1); }}
        .warning-box {{ background-color: #fef2f2; border-left: 5px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }}
        .warning-box h3 {{ color: #991b1b; margin: 0 0 10px 0; font-size: 18px; }}
        .info-text {{ color: #64748b; font-size: 14px; margin: 20px 0; }}
        .footer {{ background-color: #1f2937; color: #d1d5db; padding: 25px; text-align: center; }}
        .footer p {{ margin: 5px 0; font-size: 14px; }}
        .highlight {{ background-color: #fef3c7; padding: 2px 6px; border-radius: 4px; font-weight: bold; }}
        .timer {{ background-color: #dbeafe; color: #1e40af; padding: 12px 20px; border-radius: 8px; display: inline-block; margin: 15px 0; font-weight: bold; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🔐 Password Reset Request</h1>
            <p>One-Time Password for Account Security</p>
        </div>
        
        <div class='content'>
            <p style='font-size: 18px; margin-bottom: 10px;'>Dear <strong>{firstName}</strong>,</p>
            <p>We received a request to reset your password for your Bijoy 24 Hall Management account. Please use the OTP below to proceed with resetting your password.</p>
            
            <div class='otp-container'>
                <p style='margin: 0; font-size: 16px; color: #92400e;'>Your One-Time Password</p>
                <div class='otp-code'>{otp}</div>
                <div class='timer'>⏱️ Valid for 5 minutes</div>
            </div>
            
            <div class='warning-box'>
                <h3>⚠️ Security Notice</h3>
                <ul style='margin: 10px 0; padding-left: 20px;'>
                    <li>Do not share this OTP with anyone</li>
                    <li>This OTP will expire in <span class='highlight'>5 minutes</span></li>
                    <li>If you didn't request this, please ignore this email</li>
                </ul>
            </div>
            
            <p class='info-text'>
                💡 <strong>Tip:</strong> Make sure to create a strong password with a combination of uppercase, lowercase, numbers, and special characters.
            </p>
            
            <p style='margin-top: 30px; color: #64748b;'>
                If you have any questions or concerns, please contact the hall administration.
            </p>
        </div>
        
        <div class='footer'>
            <p><strong>Bijoy 24 Hall Management System</strong></p>
            <p>Patuakhali Science and Technology University</p>
            <p style='margin-top: 15px; font-size: 12px; opacity: 0.8;'>
                This is an automated email. Please do not reply to this message.
            </p>
        </div>
    </div>
</body>
</html>";
        }

        private string MaskEmail(string email)
        {
            var parts = email.Split('@');
            if (parts.Length != 2) return email;
            
            var username = parts[0];
            var domain = parts[1];
            
            if (username.Length <= 2)
                return $"{username[0]}***@{domain}";
            
            return $"{username.Substring(0, 2)}***@{domain}";
        }
    }

    public class OtpData
    {
        public string Otp { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public string Email { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class StudentRegistrationRequest
    {
        public string StudentId { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? GuardianPhoneNumber { get; set; }
        public string Address { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string Department { get; set; } = string.Empty;
        public int Year { get; set; }
        public string Session { get; set; } = string.Empty;
        public string BloodGroup { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class ForgotPasswordRequest
    {
        public string StudentId { get; set; } = string.Empty;
    }

    public class VerifyOtpRequest
    {
        public string StudentId { get; set; } = string.Empty;
        public string Otp { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        public string StudentId { get; set; } = string.Empty;
        public string Otp { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
