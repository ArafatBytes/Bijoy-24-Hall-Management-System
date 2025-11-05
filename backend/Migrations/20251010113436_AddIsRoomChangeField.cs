using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HallManagementSystem.Migrations
{
    /// <inheritdoc />
    public partial class AddIsRoomChangeField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllotmentDate",
                table: "RoomAllotments");

            migrationBuilder.AddColumn<bool>(
                name: "IsRoomChange",
                table: "RoomAllotments",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRoomChange",
                table: "RoomAllotments");

            migrationBuilder.AddColumn<DateTime>(
                name: "AllotmentDate",
                table: "RoomAllotments",
                type: "datetime2",
                nullable: true);
        }
    }
}
