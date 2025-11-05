using System.ComponentModel.DataAnnotations;

namespace HallManagementSystem.Models
{
    public class Payment
    {
        public int Id { get; set; }
        
        public int StudentId { get; set; }
        
        [Required]
        [StringLength(50)]
        public string PaymentType { get; set; } = string.Empty; // Semester Dues, Room Rent, Mess Fee, Security Deposit, Fine
        
        public decimal Amount { get; set; }
        
        public DateTime PaymentDate { get; set; } = DateTime.Now;
        
        public DateTime DueDate { get; set; }
        
        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Paid, Failed, Cancelled
        
        [StringLength(100)]
        public string TransactionId { get; set; } = string.Empty;
        
        [StringLength(50)]
        public string PaymentMethod { get; set; } = "SSLCommerz"; // SSLCommerz, Cash, Bank Transfer
        
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;
        
        public DateTime? PaidDate { get; set; }
        
        [StringLength(100)]
        public string ReceiptNumber { get; set; } = string.Empty;

        // SSLCommerz specific fields
        [StringLength(200)]
        public string SessionKey { get; set; } = string.Empty;
        
        [StringLength(200)]
        public string GatewayPageURL { get; set; } = string.Empty;
        
        [StringLength(50)]
        public string BankTransactionId { get; set; } = string.Empty;
        
        [StringLength(50)]
        public string CardType { get; set; } = string.Empty;
        
        [StringLength(50)]
        public string CardNumber { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string Currency { get; set; } = "BDT";
        
        public DateTime? ValidatedDate { get; set; }
        
        [StringLength(50)]
        public string ValidationStatus { get; set; } = string.Empty; // VALID, INVALID, VALIDATED

        // Dues Period Reference
        public int? DuesPeriodId { get; set; }

        // Navigation properties
        public Student Student { get; set; } = null!;
        public DuesPeriod? DuesPeriod { get; set; }
    }
}
