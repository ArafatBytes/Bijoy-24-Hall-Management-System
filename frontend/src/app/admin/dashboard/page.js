"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import AdminLayout from "../../../components/AdminLayout";
import { getCurrentUser, requireAuth } from "../../../utils/auth";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingRequests: 0,
    approvedToday: 0,
    roomOccupancy: 0,
    allocatedStudents: 0,
    totalCapacity: 360,
    totalRooms: 90,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requireAuth("Admin")) {
      return;
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch dashboard stats
      const statsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent activities
      const activitiesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/recent-activities`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setRecentActivities(activitiesData);
      }

      // Fetch monthly overview
      const monthlyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/monthly-overview`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (monthlyResponse.ok) {
        const monthlyDataResponse = await monthlyResponse.json();
        setMonthlyData(monthlyDataResponse);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setLoading(false);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <AdminLayout activeTab="dashboard">
        <div className="flex-1 flex items-center justify-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="dashboard">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-base-100 shadow-sm border-b border-base-300 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-base-content">
              Admin Dashboard
            </h1>
            <p className="text-base-content/70 mt-1">
              Overview of hall management system
            </p>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="stat bg-base-100 shadow-xl rounded-xl"
            >
              <div className="stat-figure text-primary">
                <svg
                  className="w-8 h-8"
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
              </div>
              <div className="stat-title">Total Students</div>
              <div className="stat-value text-primary">
                {stats.totalStudents}
              </div>
              <div className="stat-desc">Currently enrolled</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="stat bg-base-100 shadow-xl rounded-xl"
            >
              <div className="stat-figure text-warning">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <div className="stat-title">Pending Requests</div>
              <div className="stat-value text-warning">
                {stats.pendingRequests}
              </div>
              <div className="stat-desc">Awaiting approval</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="stat bg-base-100 shadow-xl rounded-xl"
            >
              <div className="stat-figure text-success">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <div className="stat-title">Approved Today</div>
              <div className="stat-value text-success">
                {stats.approvedToday}
              </div>
              <div className="stat-desc">↗︎ 25% increase</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="stat bg-base-100 shadow-xl rounded-xl"
            >
              <div className="stat-figure text-info">
                <svg
                  className="w-8 h-8"
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
              </div>
              <div className="stat-title">Room Occupancy</div>
              <div className="stat-value text-info">
                {stats.allocatedStudents}/{stats.totalCapacity}
              </div>
              <div className="stat-desc">{stats.roomOccupancy}% Capacity</div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <h2 className="card-title text-primary">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <button
                    onClick={() => router.push("/admin/room-requests")}
                    className="btn btn-outline btn-primary"
                  >
                    <svg
                      className="w-4 h-4"
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
                    Room Allocation
                  </button>
                  <button
                    onClick={() => router.push("/admin/dues")}
                    className="btn btn-outline btn-secondary"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    Dues Management
                  </button>
                  <button
                    onClick={() => router.push("/admin/complaints")}
                    className="btn btn-outline btn-accent"
                  >
                    <svg
                      className="w-4 h-4"
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
                    Complaints
                  </button>
                  <button
                    onClick={() => router.push("/admin/gallery")}
                    className="btn btn-outline btn-warning"
                  >
                    <svg
                      className="w-4 h-4"
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
                    Gallery Requests
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <h2 className="card-title text-secondary">Recent Activity</h2>
                <div className="space-y-3 mt-4">
                  {recentActivities.length === 0 ? (
                    <div className="text-center text-base-content/50 py-8">
                      No recent activities
                    </div>
                  ) : (
                    recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 bg-${activity.color} rounded-full`}
                        ></div>
                        <span className="text-sm flex-1">
                          {activity.message}
                        </span>
                        <span className="text-xs text-base-content/50 whitespace-nowrap">
                          {getTimeAgo(activity.time)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="lg:col-span-2 card bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <h2 className="card-title">Monthly Overview</h2>
                {monthlyData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-base-content/50">
                    <div className="text-center">
                      <div className="loading loading-spinner loading-lg"></div>
                      <p className="mt-4">Loading chart data...</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto mt-4">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>New Students</th>
                          <th>Room Requests</th>
                          <th>Complaints</th>
                          <th>Revenue (৳)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyData.map((data, index) => (
                          <tr key={index} className="hover">
                            <td className="font-semibold">{data.month}</td>
                            <td>
                              <div className="badge badge-primary badge-sm">
                                {data.newStudents}
                              </div>
                            </td>
                            <td>
                              <div className="badge badge-secondary badge-sm">
                                {data.roomRequests}
                              </div>
                            </td>
                            <td>
                              <div className="badge badge-warning badge-sm">
                                {data.complaints}
                              </div>
                            </td>
                            <td className="font-semibold text-success">
                              ৳{data.revenue.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-6">
                      <div className="flex justify-between items-end h-40">
                        {monthlyData.map((data, index) => {
                          const maxValue = Math.max(
                            ...monthlyData.map((d) => d.newStudents)
                          );
                          const height =
                            maxValue > 0
                              ? (data.newStudents / maxValue) * 100
                              : 0;
                          return (
                            <div
                              key={index}
                              className="flex-1 flex flex-col items-center justify-end px-1"
                            >
                              <div
                                className="w-full bg-primary rounded-t tooltip"
                                data-tip={`${data.newStudents} students`}
                                style={{
                                  height: `${height}%`,
                                  minHeight:
                                    data.newStudents > 0 ? "10px" : "0",
                                }}
                              ></div>
                              <span className="text-xs mt-2">{data.month}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-center mt-2 text-sm text-base-content/70">
                        New Students (Last 6 Months)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <h2 className="card-title">System Status</h2>
                <div className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database</span>
                    <div className="badge badge-success">Online</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Server</span>
                    <div className="badge badge-success">Online</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Email Service</span>
                    <div className="badge badge-success">Fast</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Backup</span>
                    <div className="badge badge-success">Updated</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </AdminLayout>
  );
}
