using Microsoft.EntityFrameworkCore;
using HallManagementSystem.Data;
using HallManagementSystem.Models;

namespace HallManagementSystem.Services
{
    public class ComplaintService : IComplaintService
    {
        private readonly ApplicationDbContext _context;

        public ComplaintService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Complaint>> GetAllComplaintsAsync()
        {
            return await _context.Complaints
                .Include(c => c.Student)
                .Include(c => c.ResolvedByAdmin)
                .OrderByDescending(c => c.SubmittedDate)
                .ToListAsync();
        }

        public async Task<Complaint?> GetComplaintByIdAsync(int id)
        {
            return await _context.Complaints
                .Include(c => c.Student)
                .Include(c => c.ResolvedByAdmin)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<IEnumerable<Complaint>> GetComplaintsByStudentIdAsync(int studentId)
        {
            return await _context.Complaints
                .Where(c => c.StudentId == studentId)
                .OrderByDescending(c => c.SubmittedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Complaint>> GetComplaintsByStatusAsync(string status)
        {
            return await _context.Complaints
                .Include(c => c.Student)
                .Include(c => c.ResolvedByAdmin)
                .Where(c => c.Status == status)
                .OrderByDescending(c => c.SubmittedDate)
                .ToListAsync();
        }

        public async Task<Complaint> CreateComplaintAsync(Complaint complaint)
        {
            _context.Complaints.Add(complaint);
            await _context.SaveChangesAsync();
            return complaint;
        }

        public async Task<Complaint?> UpdateComplaintAsync(int id, Complaint complaint)
        {
            var existingComplaint = await _context.Complaints.FindAsync(id);
            if (existingComplaint == null)
                return null;

            existingComplaint.ComplaintType = complaint.ComplaintType;
            existingComplaint.ShortDescription = complaint.ShortDescription;
            existingComplaint.OccurrenceTime = complaint.OccurrenceTime;
            existingComplaint.Status = complaint.Status;
            existingComplaint.AdminResponse = complaint.AdminResponse;
            existingComplaint.ResolvedByAdminId = complaint.ResolvedByAdminId;

            if (complaint.Status == "Solved" && existingComplaint.ResolvedDate == null)
            {
                existingComplaint.ResolvedDate = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return existingComplaint;
        }

        public async Task<Complaint?> UpdateComplaintStatusAsync(int id, string status, string? adminResponse = null)
        {
            var complaint = await _context.Complaints.FindAsync(id);
            if (complaint == null)
                return null;

            complaint.Status = status;
            
            if (!string.IsNullOrEmpty(adminResponse))
            {
                complaint.AdminResponse = adminResponse;
            }

            if (status == "Solved" && complaint.ResolvedDate == null)
            {
                complaint.ResolvedDate = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return complaint;
        }

        public async Task<bool> DeleteComplaintAsync(int id)
        {
            var complaint = await _context.Complaints.FindAsync(id);
            if (complaint == null)
                return false;

            _context.Complaints.Remove(complaint);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
