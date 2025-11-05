using HallManagementSystem.Models;

namespace HallManagementSystem.Services
{
    public interface IAuthService
    {
        Task<string?> AuthenticateStudentAsync(string studentId, string password);
        Task<string?> AuthenticateAdminAsync(string adminId, string password);
        Task<Student?> RegisterStudentAsync(Student student, string password);
        Task<Admin?> RegisterAdminAsync(Admin admin, string password);
        string HashPassword(string password);
        bool VerifyPassword(string password, string hashedPassword);
        string GenerateJwtToken(string userId, string userType, string email);
    }
}
