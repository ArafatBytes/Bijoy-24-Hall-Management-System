using Microsoft.EntityFrameworkCore;
using HallManagementSystem.Models;

namespace HallManagementSystem.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Student> Students { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<RoomAllotment> RoomAllotments { get; set; }
        public DbSet<Complaint> Complaints { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Admin> Admins { get; set; }
        public DbSet<MaintenanceRequest> MaintenanceRequests { get; set; }
        public DbSet<BloodRequest> BloodRequests { get; set; }
        public DbSet<Gallery> Galleries { get; set; }
        public DbSet<Notice> Notices { get; set; }
        public DbSet<NoticeRead> NoticeReads { get; set; }
        public DbSet<DuesPeriod> DuesPeriods { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships
            modelBuilder.Entity<RoomAllotment>()
                .HasOne(ra => ra.Student)
                .WithMany(s => s.RoomAllotments)
                .HasForeignKey(ra => ra.StudentId);

            modelBuilder.Entity<RoomAllotment>()
                .HasOne(ra => ra.Room)
                .WithMany(r => r.RoomAllotments)
                .HasForeignKey(ra => ra.RoomId);

            modelBuilder.Entity<Complaint>()
                .HasOne(c => c.Student)
                .WithMany(s => s.Complaints)
                .HasForeignKey(c => c.StudentId);

            modelBuilder.Entity<Complaint>()
                .HasOne(c => c.ResolvedByAdmin)
                .WithMany(a => a.ResolvedComplaints)
                .HasForeignKey(c => c.ResolvedByAdminId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Student)
                .WithMany(s => s.Payments)
                .HasForeignKey(p => p.StudentId);

            modelBuilder.Entity<MaintenanceRequest>()
                .HasOne(mr => mr.Student)
                .WithMany(s => s.MaintenanceRequests)
                .HasForeignKey(mr => mr.StudentId);

            modelBuilder.Entity<MaintenanceRequest>()
                .HasOne(mr => mr.Room)
                .WithMany(r => r.MaintenanceRequests)
                .HasForeignKey(mr => mr.RoomId);

            modelBuilder.Entity<BloodRequest>()
                .HasOne(br => br.Requester)
                .WithMany()
                .HasForeignKey(br => br.RequesterId);

            modelBuilder.Entity<Gallery>()
                .HasOne(g => g.Student)
                .WithMany(s => s.Galleries)
                .HasForeignKey(g => g.StudentId);

            modelBuilder.Entity<Gallery>()
                .HasOne(g => g.ReviewedByAdmin)
                .WithMany(a => a.ReviewedGalleries)
                .HasForeignKey(g => g.ReviewedByAdminId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Notice>()
                .HasOne(n => n.Admin)
                .WithMany(a => a.Notices)
                .HasForeignKey(n => n.AdminId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<NoticeRead>()
                .HasOne(nr => nr.Notice)
                .WithMany(n => n.NoticeReads)
                .HasForeignKey(nr => nr.NoticeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<NoticeRead>()
                .HasOne(nr => nr.Student)
                .WithMany(s => s.NoticeReads)
                .HasForeignKey(nr => nr.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DuesPeriod>()
                .HasOne(dp => dp.Student)
                .WithMany(s => s.DuesPeriods)
                .HasForeignKey(dp => dp.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DuesPeriod>()
                .HasOne(dp => dp.Payment)
                .WithOne(p => p.DuesPeriod)
                .HasForeignKey<Payment>(p => p.DuesPeriodId)
                .OnDelete(DeleteBehavior.NoAction);

            // Configure decimal precision
            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Room>()
                .Property(r => r.MonthlyRent)
                .HasPrecision(18, 2);

            modelBuilder.Entity<DuesPeriod>()
                .Property(dp => dp.Amount)
                .HasPrecision(18, 2);
        }
    }
}
