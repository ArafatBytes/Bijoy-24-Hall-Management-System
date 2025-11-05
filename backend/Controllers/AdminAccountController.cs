using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HallManagementSystem.Data;
using HallManagementSystem.Models;
using System.Security.Claims;

namespace HallManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminAccountController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminAccountController> _logger;

        public AdminAccountController(ApplicationDbContext context, ILogger<AdminAccountController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("current")]
        public async Task<ActionResult> GetCurrentAdmin()
        {
            try
            {
                // Get admin ID from JWT token
                var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                _logger.LogInformation($"Getting current admin with AdminId: {adminId}");
                
                if (string.IsNullOrEmpty(adminId))
                    return Unauthorized("Invalid token");

                var admin = await _context.Admins
                    .Where(a => a.AdminId == adminId)
                    .FirstOrDefaultAsync();
                
                if (admin == null)
                {
                    _logger.LogWarning($"Admin not found with AdminId: {adminId}");
                    return NotFound("Admin not found");
                }

                _logger.LogInformation($"Admin found: {admin.FirstName} {admin.LastName}");

                return Ok(new
                {
                    admin.Id,
                    admin.AdminId,
                    admin.FirstName,
                    admin.LastName,
                    admin.Email,
                    admin.PhoneNumber,
                    admin.Role,
                    admin.Department,
                    admin.CreatedDate,
                    admin.IsActive
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current admin");
                return StatusCode(500, "Error retrieving admin profile");
            }
        }

        [HttpPut("{id}/profile")]
        public async Task<ActionResult> UpdateAdminProfile(int id, [FromBody] UpdateAdminProfileRequest request)
        {
            try
            {
                // Get admin ID from JWT token
                var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                if (string.IsNullOrEmpty(adminId))
                    return Unauthorized("Invalid token");

                var admin = await _context.Admins
                    .Where(a => a.Id == id && a.AdminId == adminId)
                    .FirstOrDefaultAsync();
                
                if (admin == null)
                    return NotFound("Admin not found or unauthorized");

                // Update profile fields (only firstName, lastName, email, phoneNumber)
                admin.FirstName = request.FirstName;
                admin.LastName = request.LastName;
                admin.Email = request.Email;
                admin.PhoneNumber = request.PhoneNumber;

                await _context.SaveChangesAsync();

                var updatedAdmin = new
                {
                    admin.Id,
                    admin.AdminId,
                    admin.FirstName,
                    admin.LastName,
                    admin.Email,
                    admin.PhoneNumber,
                    admin.Role,
                    admin.Department,
                    admin.CreatedDate,
                    admin.IsActive
                };

                return Ok(new { message = "Profile updated successfully", admin = updatedAdmin });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating admin profile");
                return StatusCode(500, "Error updating admin profile");
            }
        }

        [HttpPost("{id}/change-password")]
        public async Task<ActionResult> ChangePassword(int id, [FromBody] ChangePasswordRequest request)
        {
            try
            {
                // Get admin ID from JWT token
                var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                if (string.IsNullOrEmpty(adminId))
                    return Unauthorized("Invalid token");

                var admin = await _context.Admins
                    .Where(a => a.Id == id && a.AdminId == adminId)
                    .FirstOrDefaultAsync();
                
                if (admin == null)
                    return NotFound("Admin not found or unauthorized");

                // Verify current password
                if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, admin.PasswordHash))
                {
                    return BadRequest(new { message = "Current password is incorrect" });
                }

                // Hash new password
                admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

                await _context.SaveChangesAsync();

                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing admin password");
                return StatusCode(500, "Error changing password");
            }
        }
    }

    public class UpdateAdminProfileRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
