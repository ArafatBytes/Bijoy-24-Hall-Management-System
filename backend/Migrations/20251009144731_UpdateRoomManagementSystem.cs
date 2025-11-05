using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HallManagementSystem.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRoomManagementSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Remarks",
                table: "RoomAllotments",
                newName: "StudentNotes");

            migrationBuilder.AlterColumn<int>(
                name: "Floor",
                table: "Rooms",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Block",
                table: "Rooms",
                type: "nvarchar(1)",
                maxLength: 1,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AddColumn<string>(
                name: "AllocatedBedNumbers",
                table: "Rooms",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AllocatedStudentIds",
                table: "Rooms",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "RoomAllotments",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<DateTime>(
                name: "AllotmentDate",
                table: "RoomAllotments",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<DateTime>(
                name: "AdminActionDate",
                table: "RoomAllotments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AdminNotes",
                table: "RoomAllotments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ApprovedByAdminId",
                table: "RoomAllotments",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RequestDate",
                table: "RoomAllotments",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "RequestedBedNo",
                table: "RoomAllotments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RequestedBlock",
                table: "RoomAllotments",
                type: "nvarchar(1)",
                maxLength: 1,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RequestedRoomNo",
                table: "RoomAllotments",
                type: "nvarchar(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "StudentNumber",
                table: "RoomAllotments",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllocatedBedNumbers",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "AllocatedStudentIds",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "AdminActionDate",
                table: "RoomAllotments");

            migrationBuilder.DropColumn(
                name: "AdminNotes",
                table: "RoomAllotments");

            migrationBuilder.DropColumn(
                name: "ApprovedByAdminId",
                table: "RoomAllotments");

            migrationBuilder.DropColumn(
                name: "RequestDate",
                table: "RoomAllotments");

            migrationBuilder.DropColumn(
                name: "RequestedBedNo",
                table: "RoomAllotments");

            migrationBuilder.DropColumn(
                name: "RequestedBlock",
                table: "RoomAllotments");

            migrationBuilder.DropColumn(
                name: "RequestedRoomNo",
                table: "RoomAllotments");

            migrationBuilder.DropColumn(
                name: "StudentNumber",
                table: "RoomAllotments");

            migrationBuilder.RenameColumn(
                name: "StudentNotes",
                table: "RoomAllotments",
                newName: "Remarks");

            migrationBuilder.AlterColumn<string>(
                name: "Floor",
                table: "Rooms",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<string>(
                name: "Block",
                table: "Rooms",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(1)",
                oldMaxLength: 1);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "RoomAllotments",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<DateTime>(
                name: "AllotmentDate",
                table: "RoomAllotments",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);
        }
    }
}
