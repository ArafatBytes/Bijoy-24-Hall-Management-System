using System.ComponentModel.DataAnnotations;

namespace HallManagementSystem.Models
{
    public class DuesPeriod
    {
        public int Id { get; set; }
        
        public int StudentId { get; set; }
        
        public DateTime PeriodStart { get; set; }
        
        public DateTime PeriodEnd { get; set; }
        
        public decimal Amount { get; set; } = 1320; // 6 months dues
        
        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Paid, Overdue
        
        public DateTime? PaidDate { get; set; }
        
        public int? PaymentId { get; set; }

        // Navigation properties
        public Student Student { get; set; } = null!;
        public Payment? Payment { get; set; }
    }
}
