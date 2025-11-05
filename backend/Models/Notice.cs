using System.ComponentModel.DataAnnotations;

namespace HallManagementSystem.Models
{
    public class Notice
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Subject { get; set; } = string.Empty;
        
        [Required]
        [StringLength(5000)]
        public string Description { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? AttachmentUrl { get; set; }
        
        [StringLength(100)]
        public string? AttachmentFileName { get; set; }
        
        [StringLength(50)]
        public string? AttachmentType { get; set; } // image, pdf
        
        public int AdminId { get; set; }
        
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public Admin Admin { get; set; } = null!;
        public ICollection<NoticeRead> NoticeReads { get; set; } = new List<NoticeRead>();
    }
}
