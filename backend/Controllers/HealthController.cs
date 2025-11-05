using Microsoft.AspNetCore.Mvc;

namespace HallManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            var healthStatus = new
            {
                status = "healthy",
                message = "Backend API is running successfully!",
                timestamp = DateTime.UtcNow,
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                version = "1.0.0"
            };

            return Ok(healthStatus);
        }

        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok(new { message = "pong", timestamp = DateTime.UtcNow });
        }

        [HttpGet("detailed")]
        public IActionResult Detailed()
        {
            var detailedStatus = new
            {
                status = "healthy",
                message = "Hall Management System Backend API",
                timestamp = DateTime.UtcNow,
                uptime = Environment.TickCount64 / 1000, // seconds
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                platform = Environment.OSVersion.Platform.ToString(),
                dotnetVersion = Environment.Version.ToString(),
                machineName = Environment.MachineName,
                processorCount = Environment.ProcessorCount,
                version = "1.0.0",
                endpoints = new[]
                {
                    "/api/health - Basic health check",
                    "/api/health/ping - Simple ping endpoint",
                    "/api/health/detailed - Detailed system information"
                }
            };

            return Ok(detailedStatus);
        }
    }
}
