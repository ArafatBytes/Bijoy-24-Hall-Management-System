using HallManagementSystem.Models;

namespace HallManagementSystem.Services
{
    public interface INoticeService
    {
        Task<Notice> CreateNoticeAsync(Notice notice);
        Task<List<Notice>> GetAllNoticesForAdminAsync(int adminId);
        Task<(List<Notice> Notices, int TotalCount)> GetNoticesForStudentAsync(int studentId, int page, int pageSize);
        Task<Notice?> GetNoticeByIdAsync(int noticeId);
        Task<bool> MarkNoticeAsReadAsync(int noticeId, int studentId);
        Task<bool> HasUnreadNoticesAsync(int studentId);
        Task<int> GetUnreadNoticesCountAsync(int studentId);
        Task<bool> DeleteNoticeAsync(int noticeId);
    }
}
