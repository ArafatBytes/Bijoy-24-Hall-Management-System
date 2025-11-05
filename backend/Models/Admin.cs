using System.ComponentModel.DataAnnotations;

namespace HallManagementSystem.Models
{
    public class Admin
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string AdminId { get; set; } = string.Empty;
        
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
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        [StringLength(50)]
        public string Role { get; set; } = "Admin"; // Admin, SuperAdmin, Warden
        
        [StringLength(100)]
        public string Department { get; set; } = string.Empty;
        
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public ICollection<Complaint> ResolvedComplaints { get; set; } = new List<Complaint>();
        public ICollection<Gallery> ReviewedGalleries { get; set; } = new List<Gallery>();
        public ICollection<Notice> Notices { get; set; } = new List<Notice>();
    }
}
