using System.ComponentModel.DataAnnotations;

namespace HallManagementSystem.Models
{
    public enum AllotmentStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2,
        Cancelled = 3
    }

    public class RoomAllotment
    {
        public int Id { get; set; }
        
        public int StudentId { get; set; } // Foreign key to Student.Id
        
        [Required]
        [StringLength(20)]
        public string StudentNumber { get; set; } = string.Empty; // Actual student ID like "2021001"
        
        public int RoomId { get; set; }
        
        [Required]
        [StringLength(1)]
        public string RequestedBlock { get; set; } = string.Empty; // A or B
        
        [Required]
        [StringLength(3)]
        public string RequestedRoomNo { get; set; } = string.Empty; // 101-115, etc.
        
        public int RequestedBedNo { get; set; } // 1, 2, 3, or 4
        
        public AllotmentStatus Status { get; set; } = AllotmentStatus.Pending;
        
        public DateTime RequestDate { get; set; } = DateTime.Now;
        
        
        public DateTime? CheckInDate { get; set; }
        
        public DateTime? CheckOutDate { get; set; }
        
        public bool IsActive { get; set; } = true; // For soft delete
        
        public bool IsRoomChange { get; set; } = false; // Identifies room change requests vs new applications     
        [StringLength(500)]
        public string StudentNotes { get; set; } = string.Empty; // Student's request notes
        
        [StringLength(500)]
        public string AdminNotes { get; set; } = string.Empty; // Admin's approval/rejection notes
        [StringLength(20)]
        public string? ApprovedByAdminId { get; set; } // Admin who approved/rejected
        
        public DateTime? AdminActionDate { get; set; } // When admin took action

        // Computed properties
        public bool IsPending => Status == AllotmentStatus.Pending;
        public bool IsApproved => Status == AllotmentStatus.Approved;
        public bool IsRejected => Status == AllotmentStatus.Rejected;

        // Navigation properties
        public Student Student { get; set; } = null!;
        public Room Room { get; set; } = null!;
    }
}
