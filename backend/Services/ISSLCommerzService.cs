using HallManagementSystem.Models;

namespace HallManagementSystem.Services
{
    public interface ISSLCommerzService
    {
        Task<(bool Success, string TransactionId, string SessionKey, string GatewayPageURL, string ErrorMessage)> InitiatePaymentAsync(
            int studentId, 
            int duesPeriodId, 
            decimal amount, 
            string studentName, 
            string studentEmail, 
            string studentPhone);
        
        Task<(bool Success, string Status, string Message, PaymentValidationData Data)> ValidatePaymentAsync(string validationId);
    }

    public class PaymentValidationData
    {
        public string Status { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public string BankTransactionId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string CardType { get; set; } = string.Empty;
        public string CardNumber { get; set; } = string.Empty;
        public DateTime TransactionDate { get; set; }
    }
}
