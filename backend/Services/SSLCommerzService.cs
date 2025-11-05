using System.Text;
using System.Text.Json;
using HallManagementSystem.Models;

namespace HallManagementSystem.Services
{
    public class SSLCommerzService : ISSLCommerzService
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly ILogger<SSLCommerzService> _logger;

        public SSLCommerzService(
            IConfiguration configuration, 
            HttpClient httpClient,
            ILogger<SSLCommerzService> logger)
        {
            _configuration = configuration;
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<(bool Success, string TransactionId, string SessionKey, string GatewayPageURL, string ErrorMessage)> InitiatePaymentAsync(
            int studentId,
            int duesPeriodId,
            decimal amount,
            string studentName,
            string studentEmail,
            string studentPhone)
        {
            try
            {
                var storeId = _configuration["SSLCommerz:StoreId"];
                var storePassword = _configuration["SSLCommerz:StorePassword"];
                var sessionApiUrl = _configuration["SSLCommerz:SessionApiUrl"];
                var successUrl = _configuration["SSLCommerz:SuccessUrl"];
                var failUrl = _configuration["SSLCommerz:FailUrl"];
                var cancelUrl = _configuration["SSLCommerz:CancelUrl"];

                // Generate unique transaction ID
                var transactionId = $"HMS{DateTime.Now:yyyyMMddHHmmss}{studentId}";

                var postData = new Dictionary<string, string>
                {
                    { "store_id", storeId ?? "" },
                    { "store_passwd", storePassword ?? "" },
                    { "total_amount", amount.ToString("F2") },
                    { "currency", "BDT" },
                    { "tran_id", transactionId },
                    { "success_url", successUrl ?? "" },
                    { "fail_url", failUrl ?? "" },
                    { "cancel_url", cancelUrl ?? "" },
                    { "ipn_url", _configuration["AppUrls:BackendUrl"] + "/api/payments/ipn" ?? "" }, // Backend IPN endpoint
                    { "cus_name", studentName },
                    { "cus_email", studentEmail },
                    { "cus_add1", "Bijoy 24 Hall" },
                    { "cus_city", "Dhaka" },
                    { "cus_country", "Bangladesh" },
                    { "cus_phone", studentPhone },
                    { "shipping_method", "NO" },
                    { "product_name", "Hall Dues Payment" },
                    { "product_category", "Dues" },
                    { "product_profile", "general" },
                    { "value_a", studentId.ToString() },
                    { "value_b", duesPeriodId.ToString() }
                };

                var content = new FormUrlEncodedContent(postData);
                var response = await _httpClient.PostAsync(sessionApiUrl, content);
                var responseString = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("SSLCommerz Response: {Response}", responseString);

                var jsonResponse = JsonSerializer.Deserialize<JsonElement>(responseString);

                if (jsonResponse.TryGetProperty("status", out var status) && status.GetString() == "SUCCESS")
                {
                    var sessionKey = jsonResponse.GetProperty("sessionkey").GetString() ?? "";
                    var gatewayPageURL = jsonResponse.GetProperty("GatewayPageURL").GetString() ?? "";

                    return (true, transactionId, sessionKey, gatewayPageURL, string.Empty);
                }
                else
                {
                    var errorMessage = jsonResponse.TryGetProperty("failedreason", out var reason) 
                        ? reason.GetString() ?? "Unknown error" 
                        : "Payment initiation failed";
                    
                    return (false, string.Empty, string.Empty, string.Empty, errorMessage);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating SSLCommerz payment");
                return (false, string.Empty, string.Empty, string.Empty, ex.Message);
            }
        }

        public async Task<(bool Success, string Status, string Message, PaymentValidationData Data)> ValidatePaymentAsync(string validationId)
        {
            try
            {
                var storeId = _configuration["SSLCommerz:StoreId"];
                var storePassword = _configuration["SSLCommerz:StorePassword"];
                var validationApiUrl = _configuration["SSLCommerz:ValidationApiUrl"];

                var requestData = new Dictionary<string, string>
                {
                    { "store_id", storeId ?? "" },
                    { "store_passwd", storePassword ?? "" },
                    { "val_id", validationId }
                };

                var content = new FormUrlEncodedContent(requestData);
                var response = await _httpClient.PostAsync(validationApiUrl, content);
                var responseString = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("SSLCommerz Validation Response (first 500 chars): {Response}", 
                    responseString.Length > 500 ? responseString.Substring(0, 500) : responseString);

                // Check if response is HTML (error page)
                if (responseString.TrimStart().StartsWith("<"))
                {
                    _logger.LogError("SSLCommerz returned HTML instead of JSON. This usually means validation ID is invalid or expired.");
                    return (false, string.Empty, "Payment validation failed. The payment may have expired or is invalid.", null!);
                }

                JsonElement jsonResponse;
                try
                {
                    jsonResponse = JsonSerializer.Deserialize<JsonElement>(responseString);
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, "Failed to parse SSLCommerz validation response as JSON");
                    return (false, string.Empty, "Invalid response from payment gateway", null!);
                }

                var status = jsonResponse.GetProperty("status").GetString() ?? "";
                
                if (status == "VALID" || status == "VALIDATED")
                {
                    var validationData = new PaymentValidationData
                    {
                        Status = status,
                        TransactionId = jsonResponse.GetProperty("tran_id").GetString() ?? "",
                        BankTransactionId = jsonResponse.TryGetProperty("bank_tran_id", out var bankTranId) 
                            ? bankTranId.GetString() ?? "" 
                            : "",
                        Amount = decimal.Parse(jsonResponse.GetProperty("amount").GetString() ?? "0"),
                        Currency = jsonResponse.GetProperty("currency").GetString() ?? "",
                        CardType = jsonResponse.TryGetProperty("card_type", out var cardType) 
                            ? cardType.GetString() ?? "" 
                            : "",
                        CardNumber = jsonResponse.TryGetProperty("card_no", out var cardNo) 
                            ? cardNo.GetString() ?? "" 
                            : "",
                        TransactionDate = DateTime.Parse(jsonResponse.GetProperty("tran_date").GetString() ?? DateTime.Now.ToString())
                    };

                    return (true, status, "Payment validated successfully", validationData);
                }
                else
                {
                    var errorMessage = jsonResponse.TryGetProperty("error", out var error) 
                        ? error.GetString() ?? "Validation failed" 
                        : "Validation failed";
                    
                    return (false, status, errorMessage, new PaymentValidationData());
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating SSLCommerz payment");
                return (false, "ERROR", ex.Message, new PaymentValidationData());
            }
        }
    }
}
