using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HallManagementSystem.Migrations
{
    /// <inheritdoc />
    public partial class UpdateComplaintModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Complaints_Admins_AssignedToAdminId",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "Complaints");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "Complaints",
                newName: "OccurrenceTime");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Complaints",
                newName: "ShortDescription");

            migrationBuilder.RenameColumn(
                name: "Category",
                table: "Complaints",
                newName: "ComplaintType");

            migrationBuilder.RenameColumn(
                name: "AssignedToAdminId",
                table: "Complaints",
                newName: "ResolvedByAdminId");

            migrationBuilder.RenameIndex(
                name: "IX_Complaints_AssignedToAdminId",
                table: "Complaints",
                newName: "IX_Complaints_ResolvedByAdminId");

            migrationBuilder.AddForeignKey(
                name: "FK_Complaints_Admins_ResolvedByAdminId",
                table: "Complaints",
                column: "ResolvedByAdminId",
                principalTable: "Admins",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Complaints_Admins_ResolvedByAdminId",
                table: "Complaints");

            migrationBuilder.RenameColumn(
                name: "ShortDescription",
                table: "Complaints",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "ResolvedByAdminId",
                table: "Complaints",
                newName: "AssignedToAdminId");

            migrationBuilder.RenameColumn(
                name: "OccurrenceTime",
                table: "Complaints",
                newName: "Title");

            migrationBuilder.RenameColumn(
                name: "ComplaintType",
                table: "Complaints",
                newName: "Category");

            migrationBuilder.RenameIndex(
                name: "IX_Complaints_ResolvedByAdminId",
                table: "Complaints",
                newName: "IX_Complaints_AssignedToAdminId");

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "Complaints",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_Complaints_Admins_AssignedToAdminId",
                table: "Complaints",
                column: "AssignedToAdminId",
                principalTable: "Admins",
                principalColumn: "Id");
        }
    }
}
