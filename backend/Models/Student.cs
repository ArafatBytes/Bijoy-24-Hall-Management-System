using System.ComponentModel.DataAnnotations;

namespace HallManagementSystem.Models
{
    public class Student
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string StudentId { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;
        
        [Required]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;
        
        [Phone]
        [StringLength(20)]
        public string? GuardianPhoneNumber { get; set; }
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        [StringLength(200)]
        public string Address { get; set; } = string.Empty;
        
        public DateTime DateOfBirth { get; set; }
        
        [StringLength(50)]
        public string Department { get; set; } = string.Empty;
        
        public int Year { get; set; }
        
        [StringLength(20)]
        public string Session { get; set; } = string.Empty;
        
        [StringLength(5)]
        public string BloodGroup { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string ProfileImageUrl { get; set; } = string.Empty;
        
        public DateTime RegistrationDate { get; set; } = DateTime.Now;
        
        public bool IsActive { get; set; } = true;

        // Room Allocation Fields
        [StringLength(1)]
        public string? Block { get; set; } // A or B
        
        [StringLength(3)]
        public string? RoomNo { get; set; } // 101-115, 201-215, 301-315
        
        public int? BedNo { get; set; } // 1, 2, 3, or 4
        
        public DateTime? RoomAllocationDate { get; set; }
        
        public bool IsRoomAllocated => !string.IsNullOrEmpty(Block) && !string.IsNullOrEmpty(RoomNo) && BedNo.HasValue;

        // Navigation properties
        public ICollection<RoomAllotment> RoomAllotments { get; set; } = new List<RoomAllotment>();
        public ICollection<Complaint> Complaints { get; set; } = new List<Complaint>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
        public ICollection<MaintenanceRequest> MaintenanceRequests { get; set; } = new List<MaintenanceRequest>();
        public ICollection<Gallery> Galleries { get; set; } = new List<Gallery>();
        public ICollection<NoticeRead> NoticeReads { get; set; } = new List<NoticeRead>();
        public ICollection<DuesPeriod> DuesPeriods { get; set; } = new List<DuesPeriod>();
    }
}
