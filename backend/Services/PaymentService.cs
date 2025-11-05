using Microsoft.EntityFrameworkCore;
using HallManagementSystem.Data;
using HallManagementSystem.Models;

namespace HallManagementSystem.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly ApplicationDbContext _context;

        public PaymentService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Payment>> GetAllPaymentsAsync()
        {
            return await _context.Payments
                .Include(p => p.Student)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();
        }

        public async Task<Payment?> GetPaymentByIdAsync(int id)
        {
            return await _context.Payments
                .Include(p => p.Student)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<IEnumerable<Payment>> GetPaymentsByStudentIdAsync(int studentId)
        {
            return await _context.Payments
                .Where(p => p.StudentId == studentId)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Payment>> GetPaymentsByStatusAsync(string status)
        {
            return await _context.Payments
                .Include(p => p.Student)
                .Where(p => p.Status == status)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Payment>> GetOverduePaymentsAsync()
        {
            var today = DateTime.Today;
            return await _context.Payments
                .Include(p => p.Student)
                .Where(p => p.Status == "Pending" && p.DueDate < today)
                .OrderBy(p => p.DueDate)
                .ToListAsync();
        }

        public async Task<Payment> CreatePaymentAsync(Payment payment)
        {
            if (string.IsNullOrEmpty(payment.ReceiptNumber))
            {
                payment.ReceiptNumber = await GenerateReceiptNumberAsync();
            }

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();
            return payment;
        }

        public async Task<Payment?> UpdatePaymentAsync(int id, Payment payment)
        {
            var existingPayment = await _context.Payments.FindAsync(id);
            if (existingPayment == null)
                return null;

            existingPayment.PaymentType = payment.PaymentType;
            existingPayment.Amount = payment.Amount;
            existingPayment.DueDate = payment.DueDate;
            existingPayment.Status = payment.Status;
            existingPayment.Description = payment.Description;

            await _context.SaveChangesAsync();
            return existingPayment;
        }

        public async Task<Payment?> ProcessPaymentAsync(int id, string transactionId, string paymentMethod)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
                return null;

            payment.Status = "Paid";
            payment.TransactionId = transactionId;
            payment.PaymentMethod = paymentMethod;
            payment.PaidDate = DateTime.Now;

            if (string.IsNullOrEmpty(payment.ReceiptNumber))
            {
                payment.ReceiptNumber = await GenerateReceiptNumberAsync();
            }

            await _context.SaveChangesAsync();
            return payment;
        }

        public async Task<bool> DeletePaymentAsync(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
                return false;

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<string> GenerateReceiptNumberAsync()
        {
            var today = DateTime.Today;
            var prefix = $"RCP{today:yyyyMMdd}";
            
            var lastReceipt = await _context.Payments
                .Where(p => p.ReceiptNumber.StartsWith(prefix))
                .OrderByDescending(p => p.ReceiptNumber)
                .FirstOrDefaultAsync();

            int sequenceNumber = 1;
            if (lastReceipt != null && !string.IsNullOrEmpty(lastReceipt.ReceiptNumber))
            {
                var lastSequence = lastReceipt.ReceiptNumber.Substring(prefix.Length);
                if (int.TryParse(lastSequence, out int lastNumber))
                {
                    sequenceNumber = lastNumber + 1;
                }
            }

            return $"{prefix}{sequenceNumber:D4}";
        }
    }
}
