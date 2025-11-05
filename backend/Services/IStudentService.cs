using HallManagementSystem.Models;

namespace HallManagementSystem.Services
{
    public interface IStudentService
    {
        Task<IEnumerable<Student>> GetAllStudentsAsync();
        Task<Student?> GetStudentByIdAsync(int id);
        Task<Student?> GetStudentByStudentIdAsync(string studentId);
        Task<Student?> GetStudentByEmailAsync(string email);
        Task<Student> CreateStudentAsync(Student student);
        Task<Student?> UpdateStudentAsync(int id, Student student);
        Task<bool> DeleteStudentAsync(int id);
        Task<bool> StudentExistsAsync(string studentId);
        Task<bool> EmailExistsAsync(string email);
    }
}
