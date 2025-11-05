"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAvatarImageUrl } from "../utils/profileImage";
import NoticeBoard from "./NoticeBoard";
import { removeTokenFromStorage } from "../utils/auth";

export default function StudentNavbar({ student }) {
  const pathname = usePathname();

  const handleLogout = () => {
    removeTokenFromStorage();
    window.location.href = "/login";
  };

  const isActive = (path) => {
    return pathname === path || pathname.startsWith(path);
  };

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              ></path>
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <Link href="/student/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link href="/student/profile">Profile</Link>
            </li>
            <li>
              <Link href="/student/room">Room Details</Link>
            </li>
            <li>
              <Link href="/student/complaints/new">Complaints</Link>
            </li>
            <li>
              <Link href="/student/payments">Payments</Link>
            </li>
            <li>
              <Link href="/student/blood-management">Blood Management</Link>
            </li>
            <li>
              <Link href="/student/gallery/add">Gallery</Link>
            </li>
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost text-xl">
          Bijoy 24 Hall Management
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link
              href="/student/dashboard"
              className={isActive("/student/dashboard") ? "active" : ""}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/student/profile"
              className={isActive("/student/profile") ? "active" : ""}
            >
              Profile
            </Link>
          </li>
          <li>
            <Link
              href="/student/room"
              className={isActive("/student/room") ? "active" : ""}
            >
              Room
            </Link>
          </li>
          <li>
            <Link
              href="/student/complaints/new"
              className={isActive("/student/complaints") ? "active" : ""}
            >
              Complaints
            </Link>
          </li>
          <li>
            <Link
              href="/student/payments"
              className={isActive("/student/payments") ? "active" : ""}
            >
              Payments
            </Link>
          </li>
        </ul>
      </div>

      <div className="navbar-end">
        <NoticeBoard />
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-10 rounded-full">
              <img
                src={getAvatarImageUrl(student?.profileImageUrl)}
                alt="Profile"
                className="rounded-full w-full h-full object-cover"
              />
            </div>
          </div>
          <ul
            tabIndex={0}
            className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
          >
            <li>
              <Link href="/student/profile">Profile</Link>
            </li>
            <li>
              <a onClick={handleLogout}>Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
