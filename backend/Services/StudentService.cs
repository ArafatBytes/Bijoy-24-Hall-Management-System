using Microsoft.EntityFrameworkCore;
using HallManagementSystem.Data;
using HallManagementSystem.Models;

namespace HallManagementSystem.Services
{
    public class StudentService : IStudentService
    {
        private readonly ApplicationDbContext _context;

        public StudentService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Student>> GetAllStudentsAsync()
        {
            return await _context.Students
                .Where(s => s.IsActive)
                .OrderBy(s => s.FirstName)
                .ToListAsync();
        }

        public async Task<Student?> GetStudentByIdAsync(int id)
        {
            return await _context.Students
                .Include(s => s.RoomAllotments)
                .ThenInclude(ra => ra.Room)
                .Include(s => s.Complaints)
                .Include(s => s.Payments)
                .FirstOrDefaultAsync(s => s.Id == id && s.IsActive);
        }

        public async Task<Student?> GetStudentByStudentIdAsync(string studentId)
        {
            return await _context.Students
                .FirstOrDefaultAsync(s => s.StudentId == studentId && s.IsActive);
        }

        public async Task<Student?> GetStudentByEmailAsync(string email)
        {
            return await _context.Students
                .FirstOrDefaultAsync(s => s.Email == email && s.IsActive);
        }

        public async Task<Student> CreateStudentAsync(Student student)
        {
            _context.Students.Add(student);
            await _context.SaveChangesAsync();
            return student;
        }

        public async Task<Student?> UpdateStudentAsync(int id, Student student)
        {
            var existingStudent = await _context.Students.FindAsync(id);
            if (existingStudent == null || !existingStudent.IsActive)
                return null;

            existingStudent.FirstName = student.FirstName;
            existingStudent.LastName = student.LastName;
            existingStudent.Email = student.Email;
            existingStudent.PhoneNumber = student.PhoneNumber;
            existingStudent.Address = student.Address;
            existingStudent.Department = student.Department;
            existingStudent.Year = student.Year;
            existingStudent.BloodGroup = student.BloodGroup;
            existingStudent.DateOfBirth = student.DateOfBirth;
            
            // Update profile image URL if provided
            if (!string.IsNullOrEmpty(student.ProfileImageUrl))
            {
                existingStudent.ProfileImageUrl = student.ProfileImageUrl;
            }

            await _context.SaveChangesAsync();
            return existingStudent;
        }

        public async Task<bool> DeleteStudentAsync(int id)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null)
                return false;

            student.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> StudentExistsAsync(string studentId)
        {
            return await _context.Students
                .AnyAsync(s => s.StudentId == studentId && s.IsActive);
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _context.Students
                .AnyAsync(s => s.Email == email && s.IsActive);
        }
    }
}
