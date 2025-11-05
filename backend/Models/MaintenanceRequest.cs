using System.ComponentModel.DataAnnotations;

namespace HallManagementSystem.Models
{
    public class MaintenanceRequest
    {
        public int Id { get; set; }
        
        public int StudentId { get; set; }
        
        public int RoomId { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        [StringLength(50)]
        public string Category { get; set; } = string.Empty; // Electrical, Plumbing, Furniture, Cleaning, Other
        
        [StringLength(20)]
        public string Priority { get; set; } = "Medium"; // Low, Medium, High, Urgent
        
        [StringLength(20)]
        public string Status { get; set; } = "Submitted"; // Submitted, Assigned, InProgress, Completed, Cancelled
        
        public DateTime RequestDate { get; set; } = DateTime.Now;
        
        public DateTime? CompletedDate { get; set; }
        
        [StringLength(1000)]
        public string AdminNotes { get; set; } = string.Empty;
        
        public decimal EstimatedCost { get; set; } = 0;
        
        public decimal ActualCost { get; set; } = 0;

        // Navigation properties
        public Student Student { get; set; } = null!;
        public Room Room { get; set; } = null!;
    }
}
