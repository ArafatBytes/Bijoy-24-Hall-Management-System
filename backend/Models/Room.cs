using System.ComponentModel.DataAnnotations;

namespace HallManagementSystem.Models
{
    public class Room
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(20)]
        public string RoomNumber { get; set; } = string.Empty;
        
        [Required]
        public int Floor { get; set; } // 1, 2, 3
        
        [Required]
        [StringLength(1)]
        public string Block { get; set; } = string.Empty; // A, B
        
        public int Capacity { get; set; } = 4; // Always 4 beds per room
        
        public int CurrentOccupancy { get; set; } = 0;
        
        public decimal MonthlyRent { get; set; } = 5000; // Default rent
        
        [StringLength(20)]
        public string RoomType { get; set; } = "Shared"; // All rooms are shared (4 beds)
        
        public bool IsAvailable { get; set; } = true;
        
        [StringLength(500)]
        public string Facilities { get; set; } = "Bed, Study Table, Chair, Wardrobe, Fan";
        
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        // Bed allocation tracking - JSON serialized arrays
        [StringLength(1000)]
        public string AllocatedStudentIds { get; set; } = "[]"; // JSON array of student primary keys (int)
        
        [StringLength(100)]
        public string AllocatedBedNumbers { get; set; } = "[]"; // JSON array of bed numbers (1-4)
        
        // Computed properties
        public int AvailableBeds => Capacity - CurrentOccupancy;
        public bool IsFull => CurrentOccupancy >= Capacity;
        
        // Helper methods to work with JSON arrays
        public List<int> GetAllocatedStudentIds()
        {
            try
            {
                return System.Text.Json.JsonSerializer.Deserialize<List<int>>(AllocatedStudentIds) ?? new List<int>();
            }
            catch
            {
                return new List<int>();
            }
        }
        
        public List<int> GetAllocatedBedNumbers()
        {
            try
            {
                return System.Text.Json.JsonSerializer.Deserialize<List<int>>(AllocatedBedNumbers) ?? new List<int>();
            }
            catch
            {
                return new List<int>();
            }
        }
        
        public void SetAllocatedStudentIds(List<int> studentIds)
        {
            AllocatedStudentIds = System.Text.Json.JsonSerializer.Serialize(studentIds);
        }
        
        public void SetAllocatedBedNumbers(List<int> bedNumbers)
        {
            AllocatedBedNumbers = System.Text.Json.JsonSerializer.Serialize(bedNumbers);
        }

        // Navigation properties
        public ICollection<RoomAllotment> RoomAllotments { get; set; } = new List<RoomAllotment>();
        public ICollection<MaintenanceRequest> MaintenanceRequests { get; set; } = new List<MaintenanceRequest>();
    }
}
