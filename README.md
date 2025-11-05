# 🏛️ Bijoy24 Hall Management System

<div align="center">

![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14.0-000000?style=for-the-badge&logo=next.js&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL_Server-2022-CC2927?style=for-the-badge&logo=microsoft-sql-server&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A comprehensive, modern, and feature-rich university hall management platform built with cutting-edge technologies**

[🚀 Live Demo](https://bijoy24hall.vercel.app) • [📖 Documentation](#documentation) • [🐛 Report Bug](https://github.com/ArafatBytes/bijoy24-hall-management/issues) • [✨ Request Feature](https://github.com/ArafatBytes/bijoy24-hall-management/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Bijoy24 Hall Management System** is an enterprise-grade, full-stack web application engineered to streamline and automate the comprehensive management of university residential halls. Built with scalability, security, and user experience at its core, this system provides an intuitive interface for administrators and students to efficiently handle room allocations, payment processing, complaint management, and more.

### Why Bijoy24?

- **🎨 Modern UI/UX**: Crafted with Tailwind CSS for a responsive, aesthetically pleasing interface
- **🔐 Enterprise Security**: JWT-based authentication with bcrypt password hashing
- **⚡ High Performance**: Optimized Next.js frontend with server-side rendering capabilities
- **📊 Real-time Analytics**: Comprehensive dashboard with insightful metrics
- **💳 Integrated Payments**: Seamless SSLCommerz payment gateway integration
- **☁️ Cloud-Native**: Deployed on industry-standard platforms (Vercel, MonsterASP.NET)

---

## ✨ Key Features

### For Students

- **🏠 Smart Room Allocation**

  - Browse available rooms by block and floor
  - Real-time room availability tracking
  - Interactive room layout visualization
  - Seamless room change requests

- **💰 Streamlined Payment Management**

  - View monthly dues and payment history
  - Secure online payment via SSLCommerz
  - Automated payment receipts and notifications
  - Payment status tracking

- **📢 Complaint & Request System**

  - Submit maintenance and service requests
  - Track complaint status in real-time
  - Attach supporting documents and images
  - Receive automated updates

- **🩸 Blood Donation Network**

  - Emergency blood request system
  - Connect with donors instantly
  - Blood type filtering and search
  - Community engagement platform

- **📸 Hall Gallery**

  - Share memorable moments
  - Browse event photos
  - Community-driven content

- **👤 Profile Management**
  - Update personal information
  - Upload profile pictures via Cloudinary
  - Manage guardian contact details

### For Administrators

- **📊 Comprehensive Dashboard**

  - Real-time occupancy analytics
  - Payment collection metrics
  - Pending requests overview
  - Activity monitoring

- **🏘️ Room Management**

  - Bulk room operations
  - Allocation and deallocation
  - Room status management
  - Capacity optimization

- **👥 Student Administration**

  - Complete student database
  - Bulk operations support
  - Advanced search and filtering
  - Export capabilities

- **💳 Financial Management**

  - Track all payment transactions
  - Generate financial reports
  - Manage dues periods
  - Payment verification

- **🔔 Notice Board**

  - Broadcast announcements
  - Priority-based notices
  - Scheduled publishing
  - Category management

- **⚙️ System Configuration**
  - User role management
  - System settings
  - Backup and restore
  - Activity logs

---

## 🛠️ Technology Stack

### Frontend

| Technology       | Version | Purpose                                   |
| ---------------- | ------- | ----------------------------------------- |
| **Next.js**      | 14.0    | React framework with SSR/SSG capabilities |
| **React**        | 18.0    | Component-based UI library                |
| **Tailwind CSS** | 3.x     | Utility-first CSS framework               |
| **Cloudinary**   | Latest  | Cloud-based image management              |
| **Axios**        | Latest  | HTTP client for API requests              |

### Backend

| Technology                | Version | Purpose                              |
| ------------------------- | ------- | ------------------------------------ |
| **ASP.NET Core**          | 8.0     | High-performance web API framework   |
| **Entity Framework Core** | 9.0     | ORM for database operations          |
| **SQL Server**            | 2022    | Enterprise-grade relational database |
| **JWT Bearer**            | 8.0     | Secure authentication mechanism      |
| **AutoMapper**            | 12.0    | Object-to-object mapping             |
| **BCrypt.NET**            | 4.0     | Password hashing and encryption      |
| **SSLCommerz**            | SDK     | Payment gateway integration          |

### DevOps & Deployment

- **Frontend Hosting**: Vercel (Edge Network, CDN)
- **Backend Hosting**: MonsterASP.NET (Windows Server, IIS)
- **Database**: MonsterASP.NET SQL Server
- **Version Control**: Git & GitHub
- **CI/CD**: Vercel Auto-deployment

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Browser)                   │
│                   Next.js 14 + Tailwind CSS                  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS/REST API
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  API Gateway & Auth Layer                    │
│              ASP.NET Core 8.0 Web API + JWT                  │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬─────────────┐
        │            │            │             │
┌───────▼──────┐ ┌──▼────┐ ┌────▼─────┐ ┌─────▼──────┐
│   Business   │ │ Auth  │ │ Payment  │ │   Media    │
│    Logic     │ │Service│ │ Gateway  │ │  Storage   │
│   Services   │ │ (JWT) │ │(SSLComm) │ │(Cloudinary)│
└───────┬──────┘ └───────┘ └──────────┘ └────────────┘
        │
┌───────▼──────────────────────────────────────────────┐
│          Data Access Layer (EF Core 9.0)             │
└───────┬──────────────────────────────────────────────┘
        │
┌───────▼──────────────────────────────────────────────┐
│         SQL Server Database (MSSQL 2022)             │
│   Students • Rooms • Payments • Complaints • More    │
└──────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v18.0 or higher)
- **.NET SDK** (v8.0 or higher)
- **SQL Server** (2019 or higher) or SQL Server Express
- **Visual Studio 2022** or **VS Code**
- **Git** for version control

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ArafatBytes/Bijoy-24-Hall-Management-System.git
cd Bijoy-24-Hall-Management-System
```

#### 2️⃣ Backend Setup

```bash
# Navigate to backend directory
cd backend

# Restore NuGet packages
dotnet restore

# Update database connection string in appsettings.json
# Then apply migrations
dotnet ef database update

# Run the application
dotnet run
```

The backend API will be available at `http://localhost:5000`

#### 3️⃣ Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update environment variables in .env
# Then start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

## ⚙️ Configuration

### Environment Variables

#### Frontend (`.env`)

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000  # Development
# NEXT_PUBLIC_API_URL=https://your-api.com  # Production
```

#### Backend (`appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=HallDB;Trusted_Connection=True;"
  },
  "Jwt": {
    "Key": "YourSecureSecretKeyHere-AtLeast32Characters!",
    "Issuer": "HallManagementSystem",
    "Audience": "HallManagementSystemUsers"
  },
  "AppUrls": {
    "FrontendUrl": "http://localhost:3000",
    "BackendUrl": "http://localhost:5000"
  }
}
```

### Database Migration

```bash
# Create a new migration
dotnet ef migrations add YourMigrationName

# Apply migrations to database
dotnet ef database update

# Rollback to specific migration
dotnet ef database update PreviousMigrationName
```

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint                             | Description            |
| ------ | ------------------------------------ | ---------------------- |
| POST   | `/api/auth/student/register`         | Register new student   |
| POST   | `/api/auth/student/login`            | Student authentication |
| POST   | `/api/auth/admin/login`              | Admin authentication   |
| POST   | `/api/auth/forgot-password/send-otp` | Request password reset |

### Student Endpoints

| Method | Endpoint                           | Description                 |
| ------ | ---------------------------------- | --------------------------- |
| GET    | `/api/students/current`            | Get current student profile |
| PUT    | `/api/students/profile`            | Update student profile      |
| GET    | `/api/students/by-student-id/{id}` | Get student by ID           |

### Room Management

| Method | Endpoint                           | Description                |
| ------ | ---------------------------------- | -------------------------- |
| GET    | `/api/rooms`                       | Get all rooms              |
| GET    | `/api/roomallocation/availability` | Check room availability    |
| POST   | `/api/roomallocation/request`      | Request room allocation    |
| PUT    | `/api/roomallocation/approve/{id}` | Approve allocation (Admin) |

### Payment Processing

| Method | Endpoint                     | Description         |
| ------ | ---------------------------- | ------------------- |
| GET    | `/api/payments/dues/current` | Get current dues    |
| POST   | `/api/payments/initiate`     | Initiate payment    |
| POST   | `/api/payments/validate`     | Validate payment    |
| GET    | `/api/payments/history`      | Get payment history |

---

## 👥 User Roles & Permissions

### Student Role

- ✅ View and update profile
- ✅ Request room allocation
- ✅ Make payments
- ✅ Submit complaints
- ✅ Browse gallery
- ❌ Access admin features

### Admin Role

- ✅ All student permissions
- ✅ Manage students
- ✅ Approve/reject room requests
- ✅ Manage payments and dues
- ✅ Handle complaints
- ✅ Publish notices
- ✅ System configuration

---

## 🔒 Security Features

- **🔐 JWT Authentication**: Secure token-based authentication
- **🛡️ Password Hashing**: BCrypt encryption for all passwords
- **🔒 HTTPS**: Enforced SSL/TLS encryption
- **🚫 CORS Protection**: Configured origin restrictions
- **✅ Input Validation**: Server-side and client-side validation
- **🔍 SQL Injection Prevention**: Parameterized queries via EF Core
- **⏱️ Rate Limiting**: API request throttling (planned)

---

## 📱 Responsive Design

The application is fully responsive and optimized for:

- 🖥️ **Desktop** (1920x1080 and above)
- 💻 **Laptop** (1366x768 and above)
- 📱 **Tablet** (768x1024)
- 📱 **Mobile** (375x667 and above)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Code Style Guidelines

- Follow C# coding conventions for backend
- Use ESLint configuration for frontend
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature suggestion? Please open an issue:

1. Check if the issue already exists
2. Use the appropriate issue template
3. Provide detailed description and steps to reproduce
4. Include screenshots if applicable

---

## 📄 License

This project is licensed under the **MIT License**

---

## 👨‍💻 Author

**MD Arafat Ullah**

- GitHub: [ArafatBytes](https://github.com/ArafatBytes)
- LinkedIn: [Arafat Ullah](https://linkedin.com/in/arafat-ullah46)
- Email: mdarafat1661@gmail.com

---

## 🙏 Acknowledgments

- **MonsterASP.NET** - Reliable ASP.NET hosting platform
- **Vercel** - Seamless Next.js deployment
- **SSLCommerz** - Trusted payment gateway
- **Cloudinary** - Efficient media management
- **Microsoft** - .NET Framework and documentation
- **Vercel Team** - Next.js framework

---

## 📊 Project Status

- ✅ **Phase 1**: Core Features - **Completed**
- ✅ **Phase 2**: Payment Integration - **Completed**
- ✅ **Phase 3**: Deployment - **Completed**
- 🔄 **Phase 4**: Mobile App - **Planned**
- 🔄 **Phase 5**: Analytics & Reporting - **Planned**

---

<div align="center">

**⭐ Star this repository if you find it helpful! ⭐**

</div>
