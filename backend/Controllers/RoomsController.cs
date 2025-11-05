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
    public class RoomsController : ControllerBase
    {
        private readonly IRoomService _roomService;
        private readonly ApplicationDbContext _context;

        public RoomsController(IRoomService roomService, ApplicationDbContext context)
        {
            _roomService = roomService;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Room>>> GetRooms()
        {
            var rooms = await _context.Rooms
                .OrderBy(r => r.Block)
                .ThenBy(r => r.Floor)
                .ThenBy(r => r.RoomNumber)
                .Select(r => new
                {
                    r.Id,
                    r.RoomNumber,
                    r.Floor,
                    r.Block,
                    r.Capacity,
                    r.CurrentOccupancy,
                    r.MonthlyRent,
                    r.RoomType,
                    r.IsAvailable,
                    r.Facilities,
                    r.AllocatedBedNumbers,
                    Roommates = _context.Students
                        .Where(s => s.Block == r.Block && s.RoomNo == r.RoomNumber && s.BedNo.HasValue)
                        .Select(s => new
                        {
                            s.Id,
                            s.StudentId,
                            StudentNumber = s.StudentId,
                            s.FirstName,
                            s.LastName,
                            s.Department,
                            s.Year,
                            s.Session,
                            s.Email,
                            s.PhoneNumber,
                            s.BedNo,
                            s.ProfileImageUrl
                        })
                        .ToList()
                })
                .ToListAsync();

            return Ok(rooms);
        }

        [HttpGet("available")]
        public async Task<ActionResult<IEnumerable<Room>>> GetAvailableRooms()
        {
            var rooms = await _roomService.GetAvailableRoomsAsync();
            return Ok(rooms);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Room>> GetRoom(int id)
        {
            var room = await _roomService.GetRoomByIdAsync(id);
            
            if (room == null)
                return NotFound();

            return Ok(room);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Room>> CreateRoom(Room room)
        {
            if (await _roomService.RoomExistsAsync(room.RoomNumber))
                return BadRequest(new { message = "Room number already exists" });

            var createdRoom = await _roomService.CreateRoomAsync(room);
            return CreatedAtAction(nameof(GetRoom), new { id = createdRoom.Id }, createdRoom);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRoom(int id, Room room)
        {
            var updatedRoom = await _roomService.UpdateRoomAsync(id, room);
            
            if (updatedRoom == null)
                return NotFound();

            return Ok(updatedRoom);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            var result = await _roomService.DeleteRoomAsync(id);
            
            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpPut("{id}/occupancy")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRoomOccupancy(int id, [FromBody] int occupancyChange)
        {
            var result = await _roomService.UpdateRoomOccupancyAsync(id, occupancyChange);
            
            if (!result)
                return NotFound();

            return Ok(new { message = "Room occupancy updated successfully" });
        }
    }
}
