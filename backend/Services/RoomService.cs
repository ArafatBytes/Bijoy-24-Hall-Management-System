using Microsoft.EntityFrameworkCore;
using HallManagementSystem.Data;
using HallManagementSystem.Models;

namespace HallManagementSystem.Services
{
    public class RoomService : IRoomService
    {
        private readonly ApplicationDbContext _context;

        public RoomService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Room>> GetAllRoomsAsync()
        {
            return await _context.Rooms
                .OrderBy(r => r.Block)
                .ThenBy(r => r.Floor)
                .ThenBy(r => r.RoomNumber)
                .ToListAsync();
        }

        public async Task<Room?> GetRoomByIdAsync(int id)
        {
            return await _context.Rooms
                .Include(r => r.RoomAllotments)
                .ThenInclude(ra => ra.Student)
                .Include(r => r.MaintenanceRequests)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<Room?> GetRoomByNumberAsync(string roomNumber)
        {
            return await _context.Rooms
                .FirstOrDefaultAsync(r => r.RoomNumber == roomNumber);
        }

        public async Task<IEnumerable<Room>> GetAvailableRoomsAsync()
        {
            return await _context.Rooms
                .Where(r => r.IsAvailable && r.CurrentOccupancy < r.Capacity)
                .OrderBy(r => r.Block)
                .ThenBy(r => r.Floor)
                .ThenBy(r => r.RoomNumber)
                .ToListAsync();
        }

        public async Task<Room> CreateRoomAsync(Room room)
        {
            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();
            return room;
        }

        public async Task<Room?> UpdateRoomAsync(int id, Room room)
        {
            var existingRoom = await _context.Rooms.FindAsync(id);
            if (existingRoom == null)
                return null;

            existingRoom.RoomNumber = room.RoomNumber;
            existingRoom.Floor = room.Floor;
            existingRoom.Block = room.Block;
            existingRoom.Capacity = room.Capacity;
            existingRoom.MonthlyRent = room.MonthlyRent;
            existingRoom.RoomType = room.RoomType;
            existingRoom.IsAvailable = room.IsAvailable;
            existingRoom.Facilities = room.Facilities;

            await _context.SaveChangesAsync();
            return existingRoom;
        }

        public async Task<bool> DeleteRoomAsync(int id)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null)
                return false;

            _context.Rooms.Remove(room);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RoomExistsAsync(string roomNumber)
        {
            return await _context.Rooms.AnyAsync(r => r.RoomNumber == roomNumber);
        }

        public async Task<bool> UpdateRoomOccupancyAsync(int roomId, int occupancyChange)
        {
            var room = await _context.Rooms.FindAsync(roomId);
            if (room == null) return false;

            room.CurrentOccupancy = Math.Max(0, Math.Min(room.Capacity, room.CurrentOccupancy + occupancyChange));
            room.IsAvailable = room.CurrentOccupancy < room.Capacity;
            
            await _context.SaveChangesAsync();
            return true;
        }

        // Room Allocation Methods Implementation
        public async Task<IEnumerable<Room>> GetRoomsByFloorAndBlockAsync(int floor, string block)
        {
            return await _context.Rooms
                .Where(r => r.Floor == floor && r.Block == block)
                .OrderBy(r => r.RoomNumber)
                .ToListAsync();
        }

        public async Task<Dictionary<string, int>> GetRoomAvailabilityAsync(int floor, string block)
        {
            var availability = new Dictionary<string, int>();
            
            // Generate room numbers for the floor and block
            var startRoom = floor * 100 + 1;
            var endRoom = floor * 100 + 15;
            
            for (int roomNum = startRoom; roomNum <= endRoom; roomNum++)
            {
                var roomNumber = roomNum.ToString();
                
                // Get room from database to get actual capacity and current occupancy
                var room = await _context.Rooms
                    .FirstOrDefaultAsync(r => r.Block == block && r.RoomNumber == roomNumber);
                
                if (room == null)
                {
                    // Create room record if it doesn't exist
                    room = new Room
                    {
                        RoomNumber = roomNumber,
                        Floor = floor,
                        Block = block,
                        Capacity = 4, // Default capacity
                        CurrentOccupancy = 0,
                        AllocatedBedNumbers = "[]",
                        AllocatedStudentIds = "[]"
                    };
                    
                    // Count existing students to set proper occupancy
                    var occupiedBeds = await _context.Students
                        .CountAsync(s => s.Block == block && s.RoomNo == roomNumber && s.IsActive);
                    
                    room.CurrentOccupancy = occupiedBeds;
                    
                    // Get allocated bed numbers and student IDs from existing student records
                    var studentsInRoom = await _context.Students
                        .Where(s => s.Block == block && s.RoomNo == roomNumber && s.IsActive && s.BedNo.HasValue)
                        .Select(s => new { s.Id, s.BedNo })
                        .ToListAsync();
                    
                    if (studentsInRoom.Any())
                    {
                        var bedNumbers = studentsInRoom.Select(s => s.BedNo.Value).ToList();
                        var studentIds = studentsInRoom.Select(s => s.Id).ToList();
                        
                        room.SetAllocatedBedNumbers(bedNumbers);
                        room.SetAllocatedStudentIds(studentIds);
                    }
                    
                    _context.Rooms.Add(room);
                    await _context.SaveChangesAsync();
                    
                    Console.WriteLine($"Room {roomNumber}: Created in DB - Capacity: {room.Capacity}, Occupancy: {room.CurrentOccupancy}, Available: {room.Capacity - room.CurrentOccupancy}");
                }
                
                // Always sync current occupancy with actual student data to ensure accuracy
                var actualOccupancy = await _context.Students
                    .CountAsync(s => s.Block == block && s.RoomNo == roomNumber && s.IsActive && s.BedNo.HasValue);
                
                // Update room occupancy if it doesn't match actual data
                if (room.CurrentOccupancy != actualOccupancy)
                {
                    room.CurrentOccupancy = actualOccupancy;
                    _context.Rooms.Update(room);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Room {roomNumber}: Updated occupancy from {room.CurrentOccupancy} to {actualOccupancy}");
                }
                
                // Use actual capacity and synced current occupancy from database
                availability[roomNumber] = room.Capacity - room.CurrentOccupancy;
                Console.WriteLine($"Room {roomNumber}: Using DB - Capacity: {room.Capacity}, Occupancy: {room.CurrentOccupancy}, Available: {room.Capacity - room.CurrentOccupancy}");
            }
            
            return availability;
        }

        public async Task<bool> AllocateRoomAsync(string studentId, string block, string roomNo, int bedNo)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.StudentId == studentId && s.IsActive);
            
            if (student == null) return false;
            
            // Check if bed is available
            var occupiedBeds = await _context.Students
                .CountAsync(s => s.Block == block && s.RoomNo == roomNo && s.IsActive);
            
            if (occupiedBeds >= 4) return false; // Room is full
            
            // Check if specific bed is taken
            var bedTaken = await _context.Students
                .AnyAsync(s => s.Block == block && s.RoomNo == roomNo && s.BedNo == bedNo && s.IsActive);
            
            if (bedTaken) return false;
            
            // Allocate room
            student.Block = block;
            student.RoomNo = roomNo;
            student.BedNo = bedNo;
            student.RoomAllocationDate = DateTime.Now;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeallocateRoomAsync(string studentId)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.StudentId == studentId && s.IsActive);
            
            if (student == null) return false;
            
            // Clear room allocation from student
            student.Block = null;
            student.RoomNo = null;
            student.BedNo = null;
            student.RoomAllocationDate = null;
            
            // Mark all existing RoomAllotment records for this student as inactive
            var allAllocations = await _context.RoomAllotments
                .Where(ra => ra.StudentNumber == studentId && ra.IsActive)
                .ToListAsync();

            foreach (var allocation in allAllocations)
            {
                allocation.IsActive = false;
                allocation.AdminActionDate = DateTime.Now;
                allocation.AdminNotes = (allocation.AdminNotes ?? "") + 
                    (string.IsNullOrEmpty(allocation.AdminNotes) ? "" : " | ") + 
                    "Room allocation cancelled on " + DateTime.Now.ToString("yyyy-MM-dd HH:mm");
            }
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetAvailableBedsInRoomAsync(string block, string roomNo)
        {
            var occupiedBeds = await _context.Students
                .CountAsync(s => s.Block == block && s.RoomNo == roomNo && s.IsActive);
            
            return 4 - occupiedBeds; // 4 beds per room
        }
    }
}
