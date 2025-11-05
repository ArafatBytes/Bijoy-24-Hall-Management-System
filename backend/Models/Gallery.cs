using System.ComponentModel.DataAnnotations;

namespace HallManagementSystem.Models
{
    public class Gallery
    {
        public int Id { get; set; }
        
        public int StudentId { get; set; }
        
        [Required]
        [StringLength(500)]
        public string ImageUrl { get; set; } = string.Empty; // Cloudinary URL
        
        [Required]
        [StringLength(1000)]
        public string ShortDescription { get; set; } = string.Empty;
        
        [Required]
        [StringLength(200)]
        public string TimeOfEvent { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        
        public DateTime SubmittedDate { get; set; } = DateTime.UtcNow;
        
        public DateTime? ReviewedDate { get; set; }
        
        [StringLength(1000)]
        public string AdminResponse { get; set; } = string.Empty;
        
        public int? ReviewedByAdminId { get; set; }

        // Navigation properties
        public Student Student { get; set; } = null!;
        public Admin? ReviewedByAdmin { get; set; }
    }
}
