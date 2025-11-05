using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HallManagementSystem.Data;
using HallManagementSystem.Models;

namespace HallManagementSystem.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<string?> AuthenticateStudentAsync(string studentId, string password)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.StudentId == studentId && s.IsActive);

            if (student == null || !VerifyPassword(password, student.PasswordHash))
                return null;

            return GenerateJwtToken(student.StudentId, "Student", student.Email);
        }

        public async Task<string?> AuthenticateAdminAsync(string adminId, string password)
        {
            var admin = await _context.Admins
                .FirstOrDefaultAsync(a => a.AdminId == adminId && a.IsActive);

            if (admin == null || !VerifyPassword(password, admin.PasswordHash))
                return null;

            return GenerateJwtToken(admin.AdminId, "Admin", admin.Email);
        }

        public async Task<Student?> RegisterStudentAsync(Student student, string password)
        {
            // Check if student ID or email already exists
            if (await _context.Students.AnyAsync(s => s.StudentId == student.StudentId && s.IsActive))
                return null;

            if (await _context.Students.AnyAsync(s => s.Email == student.Email && s.IsActive))
                return null;

            student.PasswordHash = HashPassword(password);
            student.RegistrationDate = DateTime.Now;
            student.IsActive = true;

            _context.Students.Add(student);
            await _context.SaveChangesAsync();
            
            // Create first dues period automatically
            var firstDuesPeriod = new DuesPeriod
            {
                StudentId = student.Id,
                PeriodStart = student.RegistrationDate,
                PeriodEnd = student.RegistrationDate.AddMonths(6),
                Amount = 1320,
                Status = "Pending"
            };
            
            _context.DuesPeriods.Add(firstDuesPeriod);
            await _context.SaveChangesAsync();
            
            return student;
        }

        public async Task<Admin?> RegisterAdminAsync(Admin admin, string password)
        {
            // Check if admin ID or email already exists
            if (await _context.Admins.AnyAsync(a => a.AdminId == admin.AdminId && a.IsActive))
                return null;

            if (await _context.Admins.AnyAsync(a => a.Email == admin.Email && a.IsActive))
                return null;

            admin.PasswordHash = HashPassword(password);
            admin.CreatedDate = DateTime.Now;
            admin.IsActive = true;

            _context.Admins.Add(admin);
            await _context.SaveChangesAsync();
            return admin;
        }

        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public bool VerifyPassword(string password, string hashedPassword)
        {
            return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
        }

        public string GenerateJwtToken(string userId, string userType, string email)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, userType),
                new Claim("UserType", userType)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(30), // Token valid for 30 days
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
