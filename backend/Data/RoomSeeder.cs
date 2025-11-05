using HallManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace HallManagementSystem.Data
{
    public static class RoomSeeder
    {
        public static async Task SeedRoomsAsync(ApplicationDbContext context)
        {
            // Check if rooms already exist
            if (await context.Rooms.AnyAsync())
            {
                return; // Rooms already seeded
            }

            var rooms = new List<Room>();

            // Create 90 rooms: 3 floors × 2 blocks × 15 rooms each
            for (int floor = 1; floor <= 3; floor++)
            {
                foreach (string block in new[] { "A", "B" })
                {
                    for (int roomNum = 1; roomNum <= 15; roomNum++)
                    {
                        var roomNumber = $"{floor}{roomNum:D2}"; // Format: 101, 102, ..., 115, 201, etc.
                        
                        var room = new Room
                        {
                            RoomNumber = roomNumber,
                            Floor = floor,
                            Block = block,
                            Capacity = 4, // 4 beds per room
                            CurrentOccupancy = 0,
                            MonthlyRent = 5000, // Default rent
                            RoomType = "Shared",
                            IsAvailable = true,
                            Facilities = "Bed, Study Table, Chair, Wardrobe, Fan, Attached Bathroom",
                            CreatedDate = DateTime.Now
                        };
                        
                        // Set default empty arrays using helper methods
                        room.SetAllocatedStudentIds(new List<int>());
                        room.SetAllocatedBedNumbers(new List<int>());

                        rooms.Add(room);
                    }
                }
            }

            await context.Rooms.AddRangeAsync(rooms);
            await context.SaveChangesAsync();

            Console.WriteLine($"Successfully seeded {rooms.Count} rooms to the database.");
        }

        public static async Task SeedRoomsIfEmptyAsync(ApplicationDbContext context)
        {
            try
            {
                await SeedRoomsAsync(context);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error seeding rooms: {ex.Message}");
                throw;
            }
        }
    }
}
