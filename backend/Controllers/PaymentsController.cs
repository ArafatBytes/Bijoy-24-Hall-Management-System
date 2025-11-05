using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HallManagementSystem.Models;
using HallManagementSystem.Services;
using HallManagementSystem.Data;

namespace HallManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly ISSLCommerzService _sslCommerzService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(
            IPaymentService paymentService,
            ISSLCommerzService sslCommerzService,
            ApplicationDbContext context,
            ILogger<PaymentsController> logger)
        {
            _paymentService = paymentService;
            _sslCommerzService = sslCommerzService;
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<Payment>>> GetPayments()
        {
            var payments = await _paymentService.GetAllPaymentsAsync();
            return Ok(payments);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Payment>> GetPayment(int id)
        {
            var payment = await _paymentService.GetPaymentByIdAsync(id);
            
            if (payment == null)
                return NotFound();

            return Ok(payment);
        }

        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<IEnumerable<Payment>>> GetPaymentsByStudent(int studentId)
        {
            var payments = await _paymentService.GetPaymentsByStudentIdAsync(studentId);
            return Ok(payments);
        }

        [HttpGet("status/{status}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<Payment>>> GetPaymentsByStatus(string status)
        {
            var payments = await _paymentService.GetPaymentsByStatusAsync(status);
            return Ok(payments);
        }

        [HttpGet("overdue")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<Payment>>> GetOverduePayments()
        {
            var payments = await _paymentService.GetOverduePaymentsAsync();
            return Ok(payments);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Payment>> CreatePayment(Payment payment)
        {
            var createdPayment = await _paymentService.CreatePaymentAsync(payment);
            return CreatedAtAction(nameof(GetPayment), new { id = createdPayment.Id }, createdPayment);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePayment(int id, Payment payment)
        {
            var updatedPayment = await _paymentService.UpdatePaymentAsync(id, payment);
            
            if (updatedPayment == null)
                return NotFound();

            return Ok(updatedPayment);
        }

        [HttpPut("{id}/process")]
        public async Task<IActionResult> ProcessPayment(int id, [FromBody] PaymentProcessRequest request)
        {
            var processedPayment = await _paymentService.ProcessPaymentAsync(
                id, request.TransactionId, request.PaymentMethod);
            
            if (processedPayment == null)
                return NotFound();

            return Ok(processedPayment);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePayment(int id)
        {
            var result = await _paymentService.DeletePaymentAsync(id);
            
            if (!result)
                return NotFound();

            return NoContent();
        }

        // New endpoints for SSLCommerz integration
        [HttpGet("dues/current")]
        public async Task<ActionResult> GetCurrentDues()
        {
            var studentIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(studentIdClaim))
                return Unauthorized();

            var student = await _context.Students
                .Include(s => s.DuesPeriods)
                .FirstOrDefaultAsync(s => s.StudentId == studentIdClaim);

            if (student == null)
                return NotFound();

            // Get current unpaid dues period
            var currentDues = student.DuesPeriods
                .Where(d => d.Status == "Pending" && d.PeriodEnd >= DateTime.Now)
                .OrderBy(d => d.PeriodStart)
                .FirstOrDefault();

            if (currentDues == null)
            {
                // Check if we need to create a new period
                var lastPeriod = student.DuesPeriods.OrderByDescending(d => d.PeriodEnd).FirstOrDefault();
                var startDate = lastPeriod?.PeriodEnd.AddDays(1) ?? student.RegistrationDate;
                
                if (startDate <= DateTime.Now)
                {
                    currentDues = new DuesPeriod
                    {
                        StudentId = student.Id,
                        PeriodStart = startDate,
                        PeriodEnd = startDate.AddMonths(6),
                        Amount = 1320,
                        Status = "Pending"
                    };
                    
                    _context.DuesPeriods.Add(currentDues);
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new
            {
                hasDues = currentDues != null,
                duesPeriod = currentDues != null ? new
                {
                    currentDues.Id,
                    currentDues.PeriodStart,
                    currentDues.PeriodEnd,
                    currentDues.Amount,
                    currentDues.Status,
                    currentDues.PaidDate,
                    currentDues.PaymentId
                } : null
            });
        }

        [HttpPost("initiate")]
        public async Task<ActionResult> InitiatePayment([FromBody] InitiatePaymentRequest request)
        {
            var studentIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(studentIdClaim))
                return Unauthorized();

            var student = await _context.Students.FirstOrDefaultAsync(s => s.StudentId == studentIdClaim);
            
            if (student == null)
                return NotFound("Student not found");

            var duesPeriod = await _context.DuesPeriods.FindAsync(request.DuesPeriodId);
            if (duesPeriod == null || duesPeriod.StudentId != student.Id)
                return BadRequest("Invalid dues period");

            if (duesPeriod.Status != "Pending")
                return BadRequest("Dues already paid");

            // Check if a pending payment already exists for this dues period
            var existingPayment = await _context.Payments
                .FirstOrDefaultAsync(p => p.DuesPeriodId == request.DuesPeriodId && p.Status == "Pending");

            string sessionKey;
            string gatewayPageURL;

            if (existingPayment != null)
            {
                // Reuse existing pending payment session
                sessionKey = existingPayment.SessionKey;
                gatewayPageURL = existingPayment.GatewayPageURL;
                
                _logger.LogInformation("Reusing existing payment session for DuesPeriodId: {DuesPeriodId}. SessionKey: {SessionKey}, GatewayURL: {GatewayURL}", 
                    request.DuesPeriodId, sessionKey, gatewayPageURL);
            }
            else
            {
                // Initiate new payment with SSLCommerz
                var result = await _sslCommerzService.InitiatePaymentAsync(
                    student.Id,
                    request.DuesPeriodId,
                    duesPeriod.Amount,
                    $"{student.FirstName} {student.LastName}",
                    student.Email,
                    student.PhoneNumber
                );
                
                var success = result.Success;
                var transactionId = result.TransactionId;
                sessionKey = result.SessionKey;
                gatewayPageURL = result.GatewayPageURL;
                var errorMessage = result.ErrorMessage;

                if (!success)
                {
                    _logger.LogError("SSLCommerz payment initiation failed: {Error}", errorMessage);
                    return BadRequest(new { success = false, message = errorMessage });
                }

                // Validate that we got valid data from SSLCommerz
                if (string.IsNullOrEmpty(sessionKey) || string.IsNullOrEmpty(gatewayPageURL))
                {
                    _logger.LogError("SSLCommerz returned empty sessionKey or gatewayPageURL. SessionKey: {SessionKey}, GatewayURL: {GatewayURL}", 
                        sessionKey, gatewayPageURL);
                    return BadRequest(new { success = false, message = "Payment gateway configuration error. Please contact administrator." });
                }

                // Create new payment record
                existingPayment = new Payment
                {
                    StudentId = student.Id,
                    Amount = duesPeriod.Amount,
                    DueDate = duesPeriod.PeriodEnd,
                    Status = "Pending",
                    PaymentMethod = "SSLCommerz",
                    TransactionId = transactionId, // Store the transaction ID we sent to SSLCommerz
                    SessionKey = sessionKey,
                    GatewayPageURL = gatewayPageURL,
                    DuesPeriodId = duesPeriod.Id,
                    Currency = "BDT"
                };

                _context.Payments.Add(existingPayment);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                success = true,
                sessionKey = sessionKey,
                gatewayPageURL = gatewayPageURL,
                paymentId = existingPayment.Id
            });
        }

        [HttpPost("validate")]
        public async Task<ActionResult> ValidatePayment([FromBody] ValidatePaymentRequest request)
        {
            _logger.LogInformation("Validating payment with val_id: {ValId}", request.ValId);

            var (success, status, message, validationData) = await _sslCommerzService.ValidatePaymentAsync(request.ValId);

            if (!success)
            {
                return BadRequest(new { message = message });
            }

            // Find payment by transaction ID from value_a
            var payment = await _context.Payments
                .Include(p => p.DuesPeriod)
                .FirstOrDefaultAsync(p => p.Id == request.PaymentId);

            if (payment == null)
            {
                return NotFound("Payment not found");
            }

            // Update payment with validation data
            payment.TransactionId = validationData.TransactionId;
            payment.BankTransactionId = validationData.BankTransactionId;
            payment.CardType = validationData.CardType;
            payment.CardNumber = validationData.CardNumber;
            payment.Status = "Paid";
            payment.PaidDate = validationData.TransactionDate;
            payment.ValidatedDate = DateTime.Now;
            payment.ValidationStatus = status;

            // Update dues period
            if (payment.DuesPeriod != null)
            {
                payment.DuesPeriod.Status = "Paid";
                payment.DuesPeriod.PaidDate = validationData.TransactionDate;
                payment.DuesPeriod.PaymentId = payment.Id;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Payment validated successfully",
                payment = new
                {
                    payment.Id,
                    payment.Amount,
                    payment.Status,
                    payment.TransactionId,
                    payment.PaidDate
                }
            });
        }

        [HttpPost("ipn")]
        [AllowAnonymous] // SSLCommerz server calls this, not authenticated user
        public async Task<ActionResult> HandleIPN([FromForm] IPNRequest ipnData)
        {
            try
            {
                _logger.LogInformation("Received IPN from SSLCommerz. Status: {Status}, ValId: {ValId}, TranId: {TranId}", 
                    ipnData.Status, ipnData.ValId, ipnData.TranId);

                // Only process VALID or VALIDATED payments
                if (ipnData.Status != "VALID" && ipnData.Status != "VALIDATED")
                {
                    _logger.LogWarning("IPN received with non-valid status: {Status}", ipnData.Status);
                    return Ok("IPN received"); // Still return 200 to acknowledge receipt
                }

                // Validate with SSLCommerz to prevent fraud (but don't fail if validation API has issues)
                var (success, status, message, validationData) = await _sslCommerzService.ValidatePaymentAsync(ipnData.ValId);

                if (!success)
                {
                    _logger.LogWarning("SSLCommerz validation API call failed: {Message}. Proceeding with IPN data.", message);
                    // Don't fail - SSLCommerz has already validated the payment by sending us the IPN
                    // We'll use the IPN data directly
                }

                // Find payment by transaction ID
                var payment = await _context.Payments
                    .Include(p => p.DuesPeriod)
                    .FirstOrDefaultAsync(p => p.TransactionId == ipnData.TranId);

                if (payment == null)
                {
                    _logger.LogWarning("Payment not found for transaction ID: {TranId}. Checking all pending payments...", ipnData.TranId);
                    
                    // Log all pending payments for debugging
                    var pendingPayments = await _context.Payments
                        .Where(p => p.Status == "Pending")
                        .Select(p => new { p.Id, p.TransactionId, p.SessionKey, p.Status })
                        .ToListAsync();
                    
                    _logger.LogInformation("Pending payments: {Payments}", System.Text.Json.JsonSerializer.Serialize(pendingPayments));
                    
                    return Ok("Payment not found");
                }

                // Skip if already processed
                if (payment.Status == "Paid" || payment.Status == "Completed")
                {
                    _logger.LogInformation("Payment already processed: {PaymentId}", payment.Id);
                    return Ok("Payment already processed");
                }

                // Update payment with data from IPN or validation
                if (success && validationData != null)
                {
                    // Use validation data if available
                    payment.TransactionId = validationData.TransactionId;
                    payment.BankTransactionId = validationData.BankTransactionId;
                    payment.CardType = validationData.CardType;
                    payment.CardNumber = validationData.CardNumber;
                    payment.PaidDate = validationData.TransactionDate;
                    payment.ValidationStatus = status;
                }
                else
                {
                    // Use IPN data directly
                    payment.TransactionId = ipnData.TranId;
                    payment.BankTransactionId = ipnData.BankTranId ?? "";
                    payment.CardType = ipnData.CardType ?? "";
                    payment.PaidDate = DateTime.Now;
                    payment.ValidationStatus = ipnData.Status;
                }

                payment.Status = "Paid";
                payment.ValidatedDate = DateTime.Now;

                // Update dues period
                if (payment.DuesPeriod != null)
                {
                    payment.DuesPeriod.Status = "Paid";
                    payment.DuesPeriod.PaidDate = payment.PaidDate; // Use payment's PaidDate
                    payment.DuesPeriod.PaymentId = payment.Id;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Payment processed successfully via IPN. PaymentId: {PaymentId}, Amount: {Amount}", 
                    payment.Id, payment.Amount);

                return Ok("IPN processed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing IPN");
                return Ok("IPN processing error"); // Still return 200 to prevent retries
            }
        }

        [HttpGet("history")]
        public async Task<ActionResult> GetPaymentHistory()
        {
            var studentIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(studentIdClaim))
                return Unauthorized();

            var student = await _context.Students.FirstOrDefaultAsync(s => s.StudentId == studentIdClaim);
            if (student == null)
                return NotFound();

            var payments = await _context.Payments
                .Where(p => p.StudentId == student.Id)
                .Include(p => p.DuesPeriod)
                .OrderByDescending(p => p.PaidDate ?? p.DueDate)
                .Select(p => new
                {
                    p.Id,
                    p.Amount,
                    p.Status,
                    p.TransactionId,
                    p.PaymentMethod,
                    p.PaidDate,
                    p.DueDate,
                    PeriodStart = p.DuesPeriod != null ? p.DuesPeriod.PeriodStart : (DateTime?)null,
                    PeriodEnd = p.DuesPeriod != null ? p.DuesPeriod.PeriodEnd : (DateTime?)null
                })
                .ToListAsync();

            return Ok(payments);
        }

        [HttpGet("admin/all-dues")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetAllStudentDues()
        {
            var students = await _context.Students
                .Include(s => s.DuesPeriods)
                .ThenInclude(dp => dp.Payment)
                .Select(s => new
                {
                    s.Id,
                    s.StudentId,
                    Name = s.FirstName + " " + s.LastName,
                    s.Email,
                    s.PhoneNumber,
                    s.Session,
                    RoomNumber = s.RoomNo,
                    s.RegistrationDate,
                    DuesPeriods = s.DuesPeriods.Select(dp => new
                    {
                        dp.Id,
                        dp.PeriodStart,
                        dp.PeriodEnd,
                        dp.Amount,
                        dp.Status,
                        dp.PaidDate,
                        Payment = dp.Payment != null ? new
                        {
                            dp.Payment.Id,
                            dp.Payment.TransactionId,
                            dp.Payment.PaymentMethod,
                            dp.Payment.PaidDate
                        } : null
                    }).OrderByDescending(dp => dp.PeriodStart).ToList()
                })
                .ToListAsync();

            return Ok(students);
        }
    }

    public class PaymentProcessRequest
    {
        public string TransactionId { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
    }

    public class InitiatePaymentRequest
    {
        public int DuesPeriodId { get; set; }
    }

    public class ValidatePaymentRequest
    {
        public string ValId { get; set; } = string.Empty;
        public int PaymentId { get; set; }
    }

    public class IPNRequest
    {
        [FromForm(Name = "tran_id")]
        public string TranId { get; set; } = string.Empty;
        
        [FromForm(Name = "val_id")]
        public string ValId { get; set; } = string.Empty;
        
        [FromForm(Name = "status")]
        public string Status { get; set; } = string.Empty;
        
        [FromForm(Name = "amount")]
        public string Amount { get; set; } = string.Empty;
        
        [FromForm(Name = "card_type")]
        public string CardType { get; set; } = string.Empty;
        
        [FromForm(Name = "store_amount")]
        public string StoreAmount { get; set; } = string.Empty;
        
        [FromForm(Name = "bank_tran_id")]
        public string BankTranId { get; set; } = string.Empty;
    }
}
