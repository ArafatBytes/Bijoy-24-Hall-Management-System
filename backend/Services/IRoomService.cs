using HallManagementSystem.Models;

namespace HallManagementSystem.Services
{
    public interface IRoomService
    {
        Task<IEnumerable<Room>> GetAllRoomsAsync();
        Task<Room?> GetRoomByIdAsync(int id);
        Task<Room?> GetRoomByNumberAsync(string roomNumber);
        Task<IEnumerable<Room>> GetAvailableRoomsAsync();
        Task<Room> CreateRoomAsync(Room room);
        Task<Room?> UpdateRoomAsync(int id, Room room);
        Task<bool> DeleteRoomAsync(int id);
        Task<bool> RoomExistsAsync(string roomNumber);
        Task<bool> UpdateRoomOccupancyAsync(int roomId, int occupancyChange);
        
        // Room Allocation Methods
        Task<IEnumerable<Room>> GetRoomsByFloorAndBlockAsync(int floor, string block);
        Task<Dictionary<string, int>> GetRoomAvailabilityAsync(int floor, string block);
        Task<bool> AllocateRoomAsync(string studentId, string block, string roomNo, int bedNo);
        Task<bool> DeallocateRoomAsync(string studentId);
        Task<int> GetAvailableBedsInRoomAsync(string block, string roomNo);
    }
}
