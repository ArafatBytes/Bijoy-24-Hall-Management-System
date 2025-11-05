using System.ComponentModel.DataAnnotations;

namespace HallManagementSystem.Models
{
    public class NoticeRead
    {
        public int Id { get; set; }
        
        public int NoticeId { get; set; }
        
        public int StudentId { get; set; }
        
        public DateTime ReadDate { get; set; } = DateTime.Now;

        // Navigation properties
        public Notice Notice { get; set; } = null!;
        public Student Student { get; set; } = null!;
    }
}
