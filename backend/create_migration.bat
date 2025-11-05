@echo off
echo Creating migration for IsRoomChange field...
dotnet ef migrations add AddIsRoomChangeField
echo Migration created successfully!
pause
