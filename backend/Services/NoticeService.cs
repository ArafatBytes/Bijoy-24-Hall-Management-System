using Microsoft.EntityFrameworkCore;
using HallManagementSystem.Data;
using HallManagementSystem.Models;

namespace HallManagementSystem.Services
{
    public class NoticeService : INoticeService
    {
        private readonly ApplicationDbContext _context;

        public NoticeService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Notice> CreateNoticeAsync(Notice notice)
        {
            _context.Notices.Add(notice);
            await _context.SaveChangesAsync();
            return notice;
        }

        public async Task<List<Notice>> GetAllNoticesForAdminAsync(int adminId)
        {
            return await _context.Notices
                .Where(n => n.AdminId == adminId && n.IsActive)
                .OrderByDescending(n => n.CreatedDate)
                .Include(n => n.NoticeReads)
                .ToListAsync();
        }

        public async Task<(List<Notice> Notices, int TotalCount)> GetNoticesForStudentAsync(int studentId, int page, int pageSize)
        {
            var query = _context.Notices
                .Where(n => n.IsActive)
                .OrderByDescending(n => n.CreatedDate);

            var totalCount = await query.CountAsync();

            var notices = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(n => n.NoticeReads.Where(nr => nr.StudentId == studentId))
                .Include(n => n.Admin)
                .ToListAsync();

            return (notices, totalCount);
        }

        public async Task<Notice?> GetNoticeByIdAsync(int noticeId)
        {
            return await _context.Notices
                .Include(n => n.Admin)
                .FirstOrDefaultAsync(n => n.Id == noticeId && n.IsActive);
        }

        public async Task<bool> MarkNoticeAsReadAsync(int noticeId, int studentId)
        {
            // Check if already read
            var existingRead = await _context.NoticeReads
                .FirstOrDefaultAsync(nr => nr.NoticeId == noticeId && nr.StudentId == studentId);

            if (existingRead != null)
            {
                return true; // Already marked as read
            }

            var noticeRead = new NoticeRead
            {
                NoticeId = noticeId,
                StudentId = studentId,
                ReadDate = DateTime.Now
            };

            _context.NoticeReads.Add(noticeRead);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> HasUnreadNoticesAsync(int studentId)
        {
            var unreadCount = await GetUnreadNoticesCountAsync(studentId);
            return unreadCount > 0;
        }

        public async Task<int> GetUnreadNoticesCountAsync(int studentId)
        {
            var allNoticeIds = await _context.Notices
                .Where(n => n.IsActive)
                .Select(n => n.Id)
                .ToListAsync();

            var readNoticeIds = await _context.NoticeReads
                .Where(nr => nr.StudentId == studentId)
                .Select(nr => nr.NoticeId)
                .ToListAsync();

            return allNoticeIds.Except(readNoticeIds).Count();
        }

        public async Task<bool> DeleteNoticeAsync(int noticeId)
        {
            var notice = await _context.Notices.FindAsync(noticeId);
            if (notice == null)
            {
                return false;
            }

            notice.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
