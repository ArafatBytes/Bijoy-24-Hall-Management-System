using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HallManagementSystem.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentSystemWithSSLCommerz : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BankTransactionId",
                table: "Payments",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CardNumber",
                table: "Payments",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CardType",
                table: "Payments",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Payments",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "DuesPeriodId",
                table: "Payments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GatewayPageURL",
                table: "Payments",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SessionKey",
                table: "Payments",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "ValidatedDate",
                table: "Payments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ValidationStatus",
                table: "Payments",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "DuesPeriods",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    PeriodStart = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PeriodEnd = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PaidDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PaymentId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DuesPeriods", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DuesPeriods_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_DuesPeriodId",
                table: "Payments",
                column: "DuesPeriodId",
                unique: true,
                filter: "[DuesPeriodId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DuesPeriods_StudentId",
                table: "DuesPeriods",
                column: "StudentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_DuesPeriods_DuesPeriodId",
                table: "Payments",
                column: "DuesPeriodId",
                principalTable: "DuesPeriods",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_DuesPeriods_DuesPeriodId",
                table: "Payments");

            migrationBuilder.DropTable(
                name: "DuesPeriods");

            migrationBuilder.DropIndex(
                name: "IX_Payments_DuesPeriodId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "BankTransactionId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "CardNumber",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "CardType",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "DuesPeriodId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "GatewayPageURL",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "SessionKey",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ValidatedDate",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ValidationStatus",
                table: "Payments");
        }
    }
}
