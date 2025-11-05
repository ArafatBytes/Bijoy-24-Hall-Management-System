using HallManagementSystem.Models;

namespace HallManagementSystem.Services
{
    public interface IPaymentService
    {
        Task<IEnumerable<Payment>> GetAllPaymentsAsync();
        Task<Payment?> GetPaymentByIdAsync(int id);
        Task<IEnumerable<Payment>> GetPaymentsByStudentIdAsync(int studentId);
        Task<IEnumerable<Payment>> GetPaymentsByStatusAsync(string status);
        Task<IEnumerable<Payment>> GetOverduePaymentsAsync();
        Task<Payment> CreatePaymentAsync(Payment payment);
        Task<Payment?> UpdatePaymentAsync(int id, Payment payment);
        Task<Payment?> ProcessPaymentAsync(int id, string transactionId, string paymentMethod);
        Task<bool> DeletePaymentAsync(int id);
        Task<string> GenerateReceiptNumberAsync();
    }
}
