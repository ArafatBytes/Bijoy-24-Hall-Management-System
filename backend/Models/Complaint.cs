using System.ComponentModel.DataAnnotations;

namespace HallManagementSystem.Models
{
    public class Complaint
    {
        public int Id { get; set; }
        
        public int StudentId { get; set; }
        
        [Required]
        [StringLength(50)]
        public string ComplaintType { get; set; } = string.Empty; // Electrical, Plumber, Repair & Maintenance, Others
        
        [Required]
        [StringLength(1000)]
        public string ShortDescription { get; set; } = string.Empty;
        
        [Required]
        [StringLength(200)]
        public string OccurrenceTime { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string Status { get; set; } = "Unsolved"; // Unsolved, Solved
        
        public DateTime SubmittedDate { get; set; } = DateTime.Now;
        
        public DateTime? ResolvedDate { get; set; }
        
        [StringLength(1000)]
        public string AdminResponse { get; set; } = string.Empty;
        
        public int? ResolvedByAdminId { get; set; }

        // Navigation properties
        public Student Student { get; set; } = null!;
        public Admin? ResolvedByAdmin { get; set; }
    }
}
