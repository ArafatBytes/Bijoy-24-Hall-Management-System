"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  getCurrentUser,
  requireAuth,
  removeTokenFromStorage,
} from "../utils/auth";

export default function AdminLayout({ children, activeTab = "dashboard" }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarCounts, setSidebarCounts] = useState({
    pendingRoomRequests: 0,
    unsolvedComplaints: 0,
    pendingGalleryRequests: 0,
    studentsWithoutRoom: 0,
    studentsWithPendingDues: 0,
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!requireAuth("Admin")) {
      return;
    }
    loadAdminData();
    loadSidebarCounts();
  }, []);

  const loadAdminData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Fetch full admin profile from database
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/adminaccount/current`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const adminData = await response.json();
        setAdmin(adminData);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSidebarCounts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/sidebar-counts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const counts = await response.json();
        setSidebarCounts(counts);
      }
    } catch (error) {
      console.error("Error loading sidebar counts:", error);
    }
  };

  const handleLogout = () => {
    removeTokenFromStorage();
    router.push("/");
  };

  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
          ></path>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
          ></path>
        </svg>
      ),
    },
    {
      id: "room-requests",
      label: "Room Allotment Requests",
      href: "/admin/room-requests",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          ></path>
        </svg>
      ),
      count: sidebarCounts.pendingRoomRequests,
    },
    {
      id: "complaints",
      label: "Complaints Management",
      href: "/admin/complaints",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          ></path>
        </svg>
      ),
      count: sidebarCounts.unsolvedComplaints,
    },
    {
      id: "gallery",
      label: "Gallery Management",
      href: "/admin/gallery",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          ></path>
        </svg>
      ),
      count: sidebarCounts.pendingGalleryRequests,
    },
    {
      id: "notices",
      label: "Notice Management",
      href: "/admin/notices",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          ></path>
        </svg>
      ),
    },
    {
      id: "students",
      label: "Student Details",
      href: "/admin/students",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          ></path>
        </svg>
      ),
      count: sidebarCounts.studentsWithoutRoom,
    },
    {
      id: "room-management",
      label: "Room Management",
      href: "/admin/room-management",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          ></path>
        </svg>
      ),
    },
    {
      id: "dues",
      label: "Due Management",
      href: "/admin/dues",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          ></path>
        </svg>
      ),
      count: sidebarCounts.studentsWithPendingDues,
    },
    {
      id: "account",
      label: "Account Settings",
      href: "/admin/account",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          ></path>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          ></path>
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex">
      {/* Sidebar - Fixed position */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`bg-base-100 shadow-xl transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-80"
        } flex flex-col fixed h-screen z-30 left-0 top-0`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-base-300 flex-shrink-0">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  A
                </div>
                <div>
                  <h2 className="text-lg font-bold text-base-content">
                    Admin Panel
                  </h2>
                  <p className="text-sm text-base-content/70">
                    Hall Management
                  </p>
                </div>
              </motion.div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.id} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-content shadow-lg"
                      : "hover:bg-base-200 text-base-content"
                  }`}
                >
                  <div className="flex-shrink-0">{item.icon}</div>
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left font-medium">
                        {item.label}
                      </span>
                      {item.count > 0 && (
                        <span
                          className={`badge badge-sm ${
                            isActive ? "badge-primary-content" : "badge-primary"
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-base-300 flex-shrink-0">
          {!sidebarCollapsed && admin && (
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">
                {admin?.firstName?.charAt(0) || ""}
                {admin?.lastName?.charAt(0) || ""}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-base-content truncate">
                  {admin?.firstName} {admin?.lastName}
                </p>
                <p className="text-xs text-base-content/70 truncate">
                  {admin?.email}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`btn btn-outline btn-error w-full ${
              sidebarCollapsed ? "btn-circle" : ""
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              ></path>
            </svg>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.div>

      {/* Main Content - Offset by sidebar width */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "ml-20" : "ml-80"
        }`}
      >
        {children}
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
}
