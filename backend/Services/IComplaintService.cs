using HallManagementSystem.Models;

namespace HallManagementSystem.Services
{
    public interface IComplaintService
    {
        Task<IEnumerable<Complaint>> GetAllComplaintsAsync();
        Task<Complaint?> GetComplaintByIdAsync(int id);
        Task<IEnumerable<Complaint>> GetComplaintsByStudentIdAsync(int studentId);
        Task<IEnumerable<Complaint>> GetComplaintsByStatusAsync(string status);
        Task<Complaint> CreateComplaintAsync(Complaint complaint);
        Task<Complaint?> UpdateComplaintAsync(int id, Complaint complaint);
        Task<Complaint?> UpdateComplaintStatusAsync(int id, string status, string? adminResponse = null);
        Task<bool> DeleteComplaintAsync(int id);
    }
}
