using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HallManagementSystem.Data;
using HallManagementSystem.Models;

namespace HallManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(ApplicationDbContext context, ILogger<DashboardController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("stats")]
        public async Task<ActionResult> GetDashboardStats()
        {
            try
            {
                // Total Students
                var totalStudents = await _context.Students.CountAsync();

                // Pending Room Requests (room allotments with Pending status)
                var pendingRoomRequests = await _context.RoomAllotments
                    .Where(r => r.Status == AllotmentStatus.Pending)
                    .CountAsync();

                // Pending Gallery Requests
                var pendingGalleryRequests = await _context.Galleries
                    .Where(g => g.Status == "Pending")
                    .CountAsync();

                // Unsolved Complaints
                var pendingComplaints = await _context.Complaints
                    .Where(c => c.Status == "Unsolved")
                    .CountAsync();

                var totalPendingRequests = pendingRoomRequests + pendingGalleryRequests + pendingComplaints;

                // Approved Today (Room Requests + Gallery Requests + Solved Complaints)
                var today = DateTime.Today;
                var tomorrow = today.AddDays(1);

                var approvedRoomRequestsToday = await _context.RoomAllotments
                    .Where(r => r.Status == AllotmentStatus.Approved && 
                                r.AdminActionDate.HasValue &&
                                r.AdminActionDate >= today && 
                                r.AdminActionDate < tomorrow)
                    .CountAsync();

                var approvedGalleryRequestsToday = await _context.Galleries
                    .Where(g => g.Status == "Approved" && 
                                g.ReviewedDate.HasValue &&
                                g.ReviewedDate >= today && 
                                g.ReviewedDate < tomorrow)
                    .CountAsync();

                var solvedComplaintsToday = await _context.Complaints
                    .Where(c => c.Status == "Solved" && 
                                c.ResolvedDate.HasValue &&
                                c.ResolvedDate >= today && 
                                c.ResolvedDate < tomorrow)
                    .CountAsync();

                var totalApprovedToday = approvedRoomRequestsToday + approvedGalleryRequestsToday + solvedComplaintsToday;

                // Room Occupancy (out of 90 rooms with 4 capacity each = 360 total capacity)
                var totalRoomCapacity = 90 * 4; // 360
                var allocatedStudents = await _context.Students
                    .Where(s => !string.IsNullOrEmpty(s.RoomNo))
                    .CountAsync();

                var occupancyPercentage = totalRoomCapacity > 0 
                    ? Math.Round((double)allocatedStudents / totalRoomCapacity * 100, 1) 
                    : 0;

                return Ok(new
                {
                    totalStudents,
                    pendingRequests = totalPendingRequests,
                    pendingRoomRequests,
                    pendingGalleryRequests,
                    pendingComplaints,
                    approvedToday = totalApprovedToday,
                    roomOccupancy = occupancyPercentage,
                    allocatedStudents,
                    totalCapacity = totalRoomCapacity,
                    totalRooms = 90
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching dashboard stats");
                return StatusCode(500, "Error fetching dashboard statistics");
            }
        }

        [HttpGet("recent-activities")]
        public async Task<ActionResult> GetRecentActivities()
        {
            try
            {
                var activities = new List<object>();

                // Get recent room requests (last 10)
                var recentRoomRequests = await _context.RoomAllotments
                    .Include(r => r.Student)
                    .OrderByDescending(r => r.AdminActionDate ?? r.RequestDate)
                    .Take(10)
                    .Select(r => new
                    {
                        Type = "room_request",
                        Status = r.Status.ToString(),
                        Message = $"Room request {r.Status.ToString().ToLower()} for {r.Student.FirstName} {r.Student.LastName}",
                        Time = r.AdminActionDate ?? r.RequestDate,
                        Color = r.Status == AllotmentStatus.Approved ? "success" : 
                                r.Status == AllotmentStatus.Rejected ? "error" : "warning"
                    })
                    .ToListAsync();

                activities.AddRange(recentRoomRequests.Cast<object>());

                // Get recent complaints (last 10)
                var recentComplaints = await _context.Complaints
                    .Include(c => c.Student)
                    .OrderByDescending(c => c.ResolvedDate ?? c.SubmittedDate)
                    .Take(10)
                    .Select(c => new
                    {
                        Type = "complaint",
                        Status = c.Status,
                        Message = c.Status == "Solved" 
                            ? $"Complaint resolved: {c.ComplaintType}" 
                            : $"New complaint by {c.Student.FirstName} {c.Student.LastName}: {c.ComplaintType}",
                        Time = c.ResolvedDate ?? c.SubmittedDate,
                        Color = c.Status == "Solved" ? "success" : "warning"
                    })
                    .ToListAsync();

                activities.AddRange(recentComplaints.Cast<object>());

                // Get recent gallery requests (last 10)
                var recentGalleryRequests = await _context.Galleries
                    .OrderByDescending(g => g.ReviewedDate ?? g.SubmittedDate)
                    .Take(10)
                    .Select(g => new
                    {
                        Type = "gallery_request",
                        Status = g.Status,
                        Message = $"Gallery image {g.Status.ToLower()}: {g.TimeOfEvent}",
                        Time = g.ReviewedDate ?? g.SubmittedDate,
                        Color = g.Status == "Approved" ? "success" : 
                                g.Status == "Rejected" ? "error" : "warning"
                    })
                    .ToListAsync();

                activities.AddRange(recentGalleryRequests.Cast<object>());

                // Get recent payments (last 10)
                var recentPayments = await _context.Payments
                    .Include(p => p.Student)
                    .Where(p => p.Status == "Paid")
                    .OrderByDescending(p => p.PaidDate)
                    .Take(10)
                    .Select(p => new
                    {
                        Type = "payment",
                        Status = "Paid",
                        Message = $"Payment received from {p.Student.FirstName} {p.Student.LastName} - ৳{p.Amount}",
                        Time = p.PaidDate.HasValue ? p.PaidDate.Value : p.DueDate,
                        Color = "info"
                    })
                    .ToListAsync();

                activities.AddRange(recentPayments.Cast<object>());

                // Get recent room changes (from room allotments)
                var recentRoomChanges = await _context.RoomAllotments
                    .Include(ra => ra.Student)
                    .Include(ra => ra.Room)
                    .Where(ra => ra.IsRoomChange && ra.Status == AllotmentStatus.Approved)
                    .OrderByDescending(ra => ra.AdminActionDate ?? ra.RequestDate)
                    .Take(10)
                    .Select(ra => new
                    {
                        Type = "room_change",
                        Status = "Completed",
                        Message = $"Room changed for {ra.Student.FirstName} {ra.Student.LastName} to Room {ra.Room.RoomNumber}",
                        Time = ra.AdminActionDate ?? ra.RequestDate,
                        Color = "info"
                    })
                    .ToListAsync();

                activities.AddRange(recentRoomChanges.Cast<object>());

                // Sort all activities by time and take top 4
                var sortedActivities = activities
                    .OrderByDescending(a => ((dynamic)a).Time)
                    .Take(4)
                    .ToList();

                return Ok(sortedActivities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching recent activities");
                return StatusCode(500, "Error fetching recent activities");
            }
        }

        [HttpGet("monthly-overview")]
        public async Task<ActionResult> GetMonthlyOverview()
        {
            try
            {
                var currentMonth = DateTime.Now.Month;
                var currentYear = DateTime.Now.Year;
                var startOfMonth = new DateTime(currentYear, currentMonth, 1);
                var endOfMonth = startOfMonth.AddMonths(1);

                // Get data for last 6 months
                var monthlyData = new List<object>();

                for (int i = 5; i >= 0; i--)
                {
                    var monthStart = startOfMonth.AddMonths(-i);
                    var monthEnd = monthStart.AddMonths(1);

                    var newStudents = await _context.Students
                        .Where(s => s.RegistrationDate >= monthStart && s.RegistrationDate < monthEnd)
                        .CountAsync();

                    var roomRequests = await _context.RoomAllotments
                        .Where(r => r.RequestDate >= monthStart && r.RequestDate < monthEnd)
                        .CountAsync();

                    var complaints = await _context.Complaints
                        .Where(c => c.SubmittedDate >= monthStart && c.SubmittedDate < monthEnd)
                        .CountAsync();

                    var payments = await _context.Payments
                        .Where(p => p.Status == "Paid" && 
                                    p.PaidDate.HasValue && 
                                    p.PaidDate >= monthStart && 
                                    p.PaidDate < monthEnd)
                        .SumAsync(p => (decimal?)p.Amount) ?? 0;

                    monthlyData.Add(new
                    {
                        Month = monthStart.ToString("MMM"),
                        NewStudents = newStudents,
                        RoomRequests = roomRequests,
                        Complaints = complaints,
                        Revenue = payments
                    });
                }

                return Ok(monthlyData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching monthly overview");
                return StatusCode(500, "Error fetching monthly overview");
            }
        }

        [HttpGet("sidebar-counts")]
        public async Task<ActionResult> GetSidebarCounts()
        {
            try
            {
                // Pending Room Allotment Requests
                var pendingRoomRequests = await _context.RoomAllotments
                    .Where(r => r.Status == AllotmentStatus.Pending)
                    .CountAsync();

                // Unsolved Complaints
                var unsolvedComplaints = await _context.Complaints
                    .Where(c => c.Status == "Unsolved")
                    .CountAsync();

                // Pending Gallery Requests
                var pendingGalleryRequests = await _context.Galleries
                    .Where(g => g.Status == "Pending")
                    .CountAsync();

                // Students with no room allocation (checking IsRoomAllocated property)
                var studentsWithoutRoom = await _context.Students
                    .Where(s => string.IsNullOrEmpty(s.Block) || string.IsNullOrEmpty(s.RoomNo) || !s.BedNo.HasValue)
                    .CountAsync();

                // Students with pending dues/payment
                var studentsWithPendingDues = await _context.DuesPeriods
                    .Where(p => p.Status == "Pending")
                    .Select(p => p.StudentId)
                    .Distinct()
                    .CountAsync();

                return Ok(new
                {
                    pendingRoomRequests,
                    unsolvedComplaints,
                    pendingGalleryRequests,
                    studentsWithoutRoom,
                    studentsWithPendingDues
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching sidebar counts");
                return StatusCode(500, "Error fetching sidebar counts");
            }
        }
    }
}
