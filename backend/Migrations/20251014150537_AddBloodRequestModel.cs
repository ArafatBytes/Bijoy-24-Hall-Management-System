using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HallManagementSystem.Migrations
{
    /// <inheritdoc />
    public partial class AddBloodRequestModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BloodRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequesterId = table.Column<int>(type: "int", nullable: false),
                    BloodGroupNeeded = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    Place = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Time = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SpecialNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    RequestDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BloodRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BloodRequests_Students_RequesterId",
                        column: x => x.RequesterId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BloodRequests_RequesterId",
                table: "BloodRequests",
                column: "RequesterId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BloodRequests");
        }
    }
}
