using System.ComponentModel.DataAnnotations;

namespace HallManagementSystem.Models
{
    public class BloodRequest
    {
        public int Id { get; set; }
        
        [Required]
        public int RequesterId { get; set; }
        
        [Required]
        [StringLength(5)]
        public string BloodGroupNeeded { get; set; } = string.Empty;
        
        [Required]
        [StringLength(500)]
        public string Place { get; set; } = string.Empty;
        
        [Required]
        [StringLength(200)]
        public string Time { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string? SpecialNotes { get; set; }
        
        public DateTime RequestDate { get; set; } = DateTime.UtcNow;
        
        public bool IsActive { get; set; } = true;
        
        // Navigation property
        public virtual Student Requester { get; set; } = null!;
    }
}
