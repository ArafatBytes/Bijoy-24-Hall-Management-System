using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HallManagementSystem.Migrations
{
    /// <inheritdoc />
    public partial class UpdateComplaintModelV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Complaints_Admins_ResolvedByAdminId",
                table: "Complaints");

            migrationBuilder.AddForeignKey(
                name: "FK_Complaints_Admins_ResolvedByAdminId",
                table: "Complaints",
                column: "ResolvedByAdminId",
                principalTable: "Admins",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Complaints_Admins_ResolvedByAdminId",
                table: "Complaints");

            migrationBuilder.AddForeignKey(
                name: "FK_Complaints_Admins_ResolvedByAdminId",
                table: "Complaints",
                column: "ResolvedByAdminId",
                principalTable: "Admins",
                principalColumn: "Id");
        }
    }
}
