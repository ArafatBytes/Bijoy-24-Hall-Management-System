"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthHeaders } from "../utils/auth";

export default function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  const pageSize = 10;

  useEffect(() => {
    loadUnreadCount();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && notices.length === 0) {
      loadNotices();
    }
  }, [isOpen]);

  const loadUnreadCount = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notices/student/unread-count`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHasUnread(data.hasUnread);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const loadNotices = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notices/student?page=${pageNum}&pageSize=${pageSize}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (pageNum === 1) {
          setNotices(data.notices);
        } else {
          setNotices((prev) => [...prev, ...data.notices]);
        }

        setHasMore(data.page < data.totalPages);
        setPage(pageNum);
      } else {
        console.error("Failed to load notices:", response.status);
      }
    } catch (error) {
      console.error("Error loading notices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (!listRef.current || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = listRef.current;

    // Load more when scrolled to 80% of the list
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      loadNotices(page + 1);
    }
  };

  const handleNoticeClick = async (notice) => {
    setSelectedNotice(notice);
    setShowModal(true);

    // Mark as read if not already read
    if (!notice.isRead) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/notices/${notice.id}/read`,
          {
            method: "POST",
            headers: getAuthHeaders(),
          }
        );

        if (response.ok) {
          // Update local state
          setNotices((prev) =>
            prev.map((n) => (n.id === notice.id ? { ...n, isRead: true } : n))
          );

          // Update unread count
          loadUnreadCount();
        }
      } catch (error) {
        console.error("Error marking notice as read:", error);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Notice Board Icon */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-ghost btn-circle relative"
          aria-label="Notice Board"
        >
          <svg
            className="w-6 h-6"
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
          {hasUnread && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
            </span>
          )}
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 bg-base-100 rounded-2xl shadow-2xl border border-base-300 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-base-300 bg-base-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Notice Board</h3>
                  {unreadCount > 0 && (
                    <span className="badge badge-error badge-sm">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
              </div>

              {/* Notice List */}
              <div
                ref={listRef}
                onScroll={handleScroll}
                className="max-h-[500px] overflow-y-auto"
              >
                {loading && page === 1 ? (
                  <div className="flex justify-center py-8">
                    <div className="loading loading-spinner loading-md text-primary"></div>
                  </div>
                ) : notices.length === 0 ? (
                  <div className="text-center py-8 text-base-content/70">
                    <svg
                      className="w-12 h-12 mx-auto mb-2 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      ></path>
                    </svg>
                    <p>No notices available</p>
                  </div>
                ) : (
                  <>
                    {notices.map((notice) => (
                      <motion.div
                        key={notice.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-4 border-b border-base-300 hover:bg-base-200 cursor-pointer transition-colors ${
                          !notice.isRead ? "bg-primary/5" : ""
                        }`}
                        onClick={() => handleNoticeClick(notice)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4
                                className={`font-semibold text-sm truncate ${
                                  !notice.isRead ? "text-primary" : ""
                                }`}
                              >
                                {notice.subject}
                              </h4>
                              {!notice.isRead && (
                                <span className="flex h-2 w-2">
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-base-content/70 mt-1">
                              {formatDate(notice.createdDate)}
                            </p>
                          </div>
                          {notice.attachmentUrl && (
                            <div className="flex-shrink-0">
                              {notice.attachmentType === "pdf" ? (
                                <svg
                                  className="w-5 h-5 text-error"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
                                </svg>
                              ) : (
                                <svg
                                  className="w-5 h-5 text-success"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M4 3h12l2 2v12l-2 2H4l-2-2V5l2-2z" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {loading && page > 1 && (
                      <div className="flex justify-center py-4">
                        <div className="loading loading-spinner loading-sm text-primary"></div>
                      </div>
                    )}

                    {!hasMore && notices.length > 0 && (
                      <div className="text-center py-4 text-xs text-base-content/50">
                        No more notices
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notice Detail Modal */}
      <AnimatePresence>
        {showModal && selectedNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-base-300 bg-primary/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-base-content">
                      {selectedNotice.subject}
                    </h2>
                    <p className="text-sm text-base-content/70 mt-2">
                      Posted on {formatFullDate(selectedNotice.createdDate)}
                    </p>
                    <p className="text-sm text-base-content/70">
                      By {selectedNotice.admin.firstName}{" "}
                      {selectedNotice.admin.lastName}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="btn btn-sm btn-ghost btn-circle"
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
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Message:</h3>
                  <div className="prose max-w-none">
                    <p className="text-base-content/90 whitespace-pre-wrap leading-relaxed">
                      {selectedNotice.description}
                    </p>
                  </div>
                </div>

                {selectedNotice.attachmentUrl && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Attachment:</h3>
                    {selectedNotice.attachmentType === "pdf" ? (
                      <a
                        href={selectedNotice.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-primary"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
                        </svg>
                        View PDF ({selectedNotice.attachmentFileName})
                      </a>
                    ) : (
                      <div className="rounded-lg overflow-hidden shadow-lg">
                        <img
                          src={selectedNotice.attachmentUrl}
                          alt="Notice attachment"
                          className="max-w-full"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-base-300 bg-base-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn btn-primary w-full"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
