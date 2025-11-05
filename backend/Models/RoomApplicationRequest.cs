using System.ComponentModel.DataAnnotations;

namespace HallManagementSystem.Models
{
    public class RoomApplicationRequest
    {
        [Required]
        [StringLength(1)]
        public string Block { get; set; } = string.Empty; // A or B
        
        [Required]
        [StringLength(3)]
        public string RoomNo { get; set; } = string.Empty; // 101-115, etc.
        
        [Required]
        [Range(1, 4)]
        public int BedNo { get; set; } // 1, 2, 3, or 4
        
        [StringLength(500)]
        public string Notes { get; set; } = string.Empty; // Optional student notes
    }
}
