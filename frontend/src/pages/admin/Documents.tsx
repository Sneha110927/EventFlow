import { useEffect, useMemo, useState } from "react";

interface AdminDocument {
  _id: string;

  name: string;
  originalName: string;
  filename: string;

  mimetype: string;
  size: number;

  status: "pending" | "approved" | "rejected";

  createdAt: string;
  updatedAt: string;

  user?: {
    _id: string;
    name: string;
    email: string;
    role?: string;
  };

  event?: {
    _id: string;
    name: string;
    type?: string;
  };
}

type StatusFilter =
  | "all"
  | "pending"
  | "approved"
  | "rejected";

const API_URL =
  "http://localhost:5000/api/documents";

export default function Documents() {
  const [documents, setDocuments] =
    useState<AdminDocument[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [search, setSearch] =
    useState("");

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [notification, setNotification] =
    useState("");

  // =========================================================
  // LOAD DOCUMENTS FROM BACKEND
  // =========================================================

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("token");

        if (!token) {
          throw new Error(
            "Authentication required. Please log in again."
          );
        }

        const response = await fetch(
          API_URL,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load documents"
          );
        }

        setDocuments(
          data.documents || []
        );
      } catch (error) {
        console.error(
          "Load documents error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load documents"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // =========================================================
  // NOTIFICATION
  // =========================================================

  const showNotification = (
    message: string
  ) => {
    setNotification(message);

    window.setTimeout(() => {
      setNotification("");
    }, 3000);
  };

  // =========================================================
  // APPROVE DOCUMENT
  // =========================================================

  const handleApprove = async (
    id: string
  ) => {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        showNotification(
          "Authentication required"
        );
        return;
      }

      setProcessingId(id);

      const response = await fetch(
        `${API_URL}/${id}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to approve document"
        );
      }

      setDocuments((currentDocuments) =>
        currentDocuments.map(
          (document) =>
            document._id === id
              ? data.document
              : document
        )
      );

      showNotification(
        "Document approved successfully"
      );
    } catch (error) {
      console.error(
        "Approve document error:",
        error
      );

      showNotification(
        error instanceof Error
          ? error.message
          : "Failed to approve document"
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =========================================================
  // REJECT DOCUMENT
  // =========================================================

  const handleReject = async (
    id: string
  ) => {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        showNotification(
          "Authentication required"
        );
        return;
      }

      setProcessingId(id);

      const response = await fetch(
        `${API_URL}/${id}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to reject document"
        );
      }

      setDocuments((currentDocuments) =>
        currentDocuments.map(
          (document) =>
            document._id === id
              ? data.document
              : document
        )
      );

      showNotification(
        "Document rejected successfully"
      );
    } catch (error) {
      console.error(
        "Reject document error:",
        error
      );

      showNotification(
        error instanceof Error
          ? error.message
          : "Failed to reject document"
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =========================================================
  // DOWNLOAD DOCUMENT
  // =========================================================

  const handleDownload = async (
    documentId: string,
    fileName: string
  ) => {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        showNotification(
          "Authentication required"
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/${documentId}/download`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let message =
          "Failed to download document";

        try {
          const data =
            await response.json();

          message =
            data.message || message;
        } catch {
          // Response was not JSON.
        }

        throw new Error(message);
      }

      const blob =
        await response.blob();

      const downloadUrl =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = downloadUrl;
      link.download = fileName;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        downloadUrl
      );

      showNotification(
        "Document downloaded successfully"
      );
    } catch (error) {
      console.error(
        "Download document error:",
        error
      );

      showNotification(
        error instanceof Error
          ? error.message
          : "Failed to download document"
      );
    }
  };

  // =========================================================
  // FILTER DOCUMENTS
  // =========================================================

  const filteredDocuments =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return documents.filter(
        (document) => {
          const matchesStatus =
            statusFilter === "all" ||
            document.status ===
              statusFilter;

          const participantName =
            document.user?.name ||
            "";

          const participantEmail =
            document.user?.email ||
            "";

          const eventName =
            document.event?.name ||
            "";

          const fileName =
            document.originalName ||
            document.name ||
            "";

          const matchesSearch =
            normalizedSearch === "" ||
            participantName
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            participantEmail
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            eventName
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            fileName
              .toLowerCase()
              .includes(
                normalizedSearch
              );

          return (
            matchesStatus &&
            matchesSearch
          );
        }
      );
    }, [
      documents,
      search,
      statusFilter,
    ]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalDocuments =
    documents.length;

  const pendingDocuments =
    documents.filter(
      (document) =>
        document.status ===
        "pending"
    ).length;

  const approvedDocuments =
    documents.filter(
      (document) =>
        document.status ===
        "approved"
    ).length;

  const rejectedDocuments =
    documents.filter(
      (document) =>
        document.status ===
        "rejected"
    ).length;

  // =========================================================
  // FORMAT FILE SIZE
  // =========================================================

  const formatFileSize = (
    bytes: number
  ) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(2)} MB`;
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (
    date: string
  ) => {
    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // STATUS UI
  // =========================================================

  const getStatusLabel = (
    status: AdminDocument["status"]
  ) => {
    if (status === "approved") {
      return "Approved";
    }

    if (status === "rejected") {
      return "Rejected";
    }

    return "Pending Review";
  };

  const getStatusClass = (
    status: AdminDocument["status"]
  ) => {
    if (status === "approved") {
      return "bg-[#E6F4F1] text-[#3D9E8C]";
    }

    if (status === "rejected") {
      return "bg-[#FDECEC] text-[#D95B5B]";
    }

    return "bg-[#FEF3ED] text-[#E8824A]";
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-full bg-[#FAFAF7] flex items-center justify-center">
        <div className="text-center">

          <div className="w-10 h-10 border-4 border-[#EEF2FF] border-t-[#5B6FD4] rounded-full animate-spin mx-auto mb-4" />

          <p className="text-sm text-[#5A5A72]">
            Loading documents...
          </p>

        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="min-h-full bg-[#FAFAF7] p-6 lg:p-8">

        <div className="bg-white border border-[#E8E8F0] rounded-2xl p-8 text-center">

          <div className="w-12 h-12 bg-[#FDECEC] rounded-xl flex items-center justify-center mx-auto mb-4">

            <svg
              className="w-6 h-6 text-[#D95B5B]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>

          </div>

          <h2 className="text-lg font-semibold text-[#1A1A2E]">
            Unable to load documents
          </h2>

          <p className="text-sm text-[#9090A8] mt-2 mb-5">
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="bg-[#5B6FD4] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90"
          >
            Try Again
          </button>

        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <div className="min-h-full bg-[#FAFAF7]">

      {/* Notification */}

      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-[#1A1A2E] text-white px-5 py-3 rounded-xl shadow-lg text-sm">
          {notification}
        </div>
      )}

      <div className="p-6 lg:p-8 space-y-6">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <div>
          <h1 className="font-display text-2xl text-[#1A1A2E]">
            Documents
          </h1>

          <p className="text-sm text-[#9090A8] mt-1">
            Review documents submitted by event participants.
          </p>
        </div>

        {/* ===================================================
            STATISTICS
        ==================================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Total */}

          <div className="bg-white border border-[#E8E8F0] rounded-2xl shadow-soft p-5">

            <p className="text-xs text-[#9090A8]">
              Total Documents
            </p>

            <p className="text-2xl font-display text-[#1A1A2E] mt-2">
              {totalDocuments}
            </p>

          </div>

          {/* Pending */}

          <div className="bg-white border border-[#E8E8F0] rounded-2xl shadow-soft p-5">

            <p className="text-xs text-[#9090A8]">
              Pending Review
            </p>

            <p className="text-2xl font-display text-[#E8824A] mt-2">
              {pendingDocuments}
            </p>

          </div>

          {/* Approved */}

          <div className="bg-white border border-[#E8E8F0] rounded-2xl shadow-soft p-5">

            <p className="text-xs text-[#9090A8]">
              Approved
            </p>

            <p className="text-2xl font-display text-[#3D9E8C] mt-2">
              {approvedDocuments}
            </p>

          </div>

          {/* Rejected */}

          <div className="bg-white border border-[#E8E8F0] rounded-2xl shadow-soft p-5">

            <p className="text-xs text-[#9090A8]">
              Rejected
            </p>

            <p className="text-2xl font-display text-[#D95B5B] mt-2">
              {rejectedDocuments}
            </p>

          </div>

        </div>

        {/* ===================================================
            FILTER / SEARCH
        ==================================================== */}

        <div className="bg-white border border-[#E8E8F0] rounded-2xl shadow-soft p-4">

          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">

            {/* Search */}

            <div className="relative flex-1 max-w-md">

              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9090A8]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35m2.35-5.65a8 8 0 11-16 0 8 8 0 0116 0z"
                />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search participant, email, event or file..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#E8E8F0] rounded-xl outline-none focus:border-[#5B6FD4]"
              />

            </div>

            {/* Status filter */}

            <div className="flex gap-2 flex-wrap">

              <button
                onClick={() =>
                  setStatusFilter("all")
                }
                className={`px-3 py-2 rounded-lg text-xs font-medium ${
                  statusFilter === "all"
                    ? "bg-[#5B6FD4] text-white"
                    : "bg-[#F5F5FA] text-[#6F6F86]"
                }`}
              >
                All
              </button>

              <button
                onClick={() =>
                  setStatusFilter("pending")
                }
                className={`px-3 py-2 rounded-lg text-xs font-medium ${
                  statusFilter ===
                  "pending"
                    ? "bg-[#FEF3ED] text-[#E8824A]"
                    : "bg-[#F5F5FA] text-[#6F6F86]"
                }`}
              >
                Pending
              </button>

              <button
                onClick={() =>
                  setStatusFilter("approved")
                }
                className={`px-3 py-2 rounded-lg text-xs font-medium ${
                  statusFilter ===
                  "approved"
                    ? "bg-[#E6F4F1] text-[#3D9E8C]"
                    : "bg-[#F5F5FA] text-[#6F6F86]"
                }`}
              >
                Approved
              </button>

              <button
                onClick={() =>
                  setStatusFilter("rejected")
                }
                className={`px-3 py-2 rounded-lg text-xs font-medium ${
                  statusFilter ===
                  "rejected"
                    ? "bg-[#FDECEC] text-[#D95B5B]"
                    : "bg-[#F5F5FA] text-[#6F6F86]"
                }`}
              >
                Rejected
              </button>

            </div>

          </div>

        </div>

        {/* ===================================================
            DOCUMENT LIST
        ==================================================== */}

        <div className="bg-white border border-[#E8E8F0] rounded-2xl shadow-soft overflow-hidden">

          {/* Header */}

          <div className="px-6 py-5 border-b border-[#E8E8F0]">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-[#1A1A2E]">
                  Participant Documents
                </h2>

                <p className="text-xs text-[#9090A8] mt-1">
                  {filteredDocuments.length}{" "}
                  document
                  {filteredDocuments.length !==
                  1
                    ? "s"
                    : ""}{" "}
                  shown
                </p>
              </div>

            </div>

          </div>

          {/* Empty state */}

          {filteredDocuments.length ===
          0 ? (
            <div className="p-12 text-center">

              <div className="w-14 h-14 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mx-auto mb-4">

                <svg
                  className="w-7 h-7 text-[#5B6FD4]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z"
                  />
                </svg>

              </div>

              <h3 className="text-sm font-semibold text-[#1A1A2E]">
                No documents found
              </h3>

              <p className="text-xs text-[#9090A8] mt-1">
                {documents.length ===
                0
                  ? "Participant uploads will appear here."
                  : "No documents match your current filters."}
              </p>

            </div>
          ) : (
            <>
              {/* Desktop table */}

              <div className="hidden xl:block overflow-x-auto">

                <table className="w-full">

                  <thead>
                    <tr className="border-b border-[#E8E8F0] bg-[#FAFAF7]">

                      <th className="text-left px-6 py-4 text-xs font-medium text-[#9090A8]">
                        DOCUMENT
                      </th>

                      <th className="text-left px-6 py-4 text-xs font-medium text-[#9090A8]">
                        PARTICIPANT
                      </th>

                      <th className="text-left px-6 py-4 text-xs font-medium text-[#9090A8]">
                        EVENT
                      </th>

                      <th className="text-left px-6 py-4 text-xs font-medium text-[#9090A8]">
                        SUBMITTED
                      </th>

                      <th className="text-left px-6 py-4 text-xs font-medium text-[#9090A8]">
                        STATUS
                      </th>

                      <th className="text-right px-6 py-4 text-xs font-medium text-[#9090A8]">
                        ACTIONS
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {filteredDocuments.map(
                      (doc) => (
                        <tr
                          key={doc._id}
                          className="border-b border-[#E8E8F0] last:border-0 hover:bg-[#FAFAF7]"
                        >

                          {/* Document */}

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="w-10 h-10 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0">

                                <svg
                                  className="w-5 h-5 text-[#5B6FD4]"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z"
                                  />
                                </svg>

                              </div>

                              <div className="min-w-0">

                                <p className="text-sm font-medium text-[#1A1A2E] max-w-[220px] truncate">
                                  {doc.originalName ||
                                    doc.name}
                                </p>

                                <p className="text-xs text-[#9090A8] mt-0.5">
                                  {formatFileSize(
                                    doc.size
                                  )}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* Participant */}

                          <td className="px-6 py-4">

                            <p className="text-sm text-[#1A1A2E]">
                              {doc.user?.name ||
                                "Unknown"}
                            </p>

                            <p className="text-xs text-[#9090A8] mt-0.5">
                              {doc.user?.email ||
                                "No email"}
                            </p>

                          </td>

                          {/* Event */}

                          <td className="px-6 py-4">

                            <p className="text-sm text-[#1A1A2E]">
                              {doc.event?.name ||
                                "Unknown event"}
                            </p>

                            {doc.event?.type && (
                              <p className="text-xs text-[#9090A8] mt-0.5 capitalize">
                                {doc.event.type}
                              </p>
                            )}

                          </td>

                          {/* Date */}

                          <td className="px-6 py-4">

                            <p className="text-sm text-[#5A5A72]">
                              {formatDate(
                                doc.createdAt
                              )}
                            </p>

                          </td>

                          {/* Status */}

                          <td className="px-6 py-4">

                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(
                                doc.status
                              )}`}
                            >
                              {getStatusLabel(
                                doc.status
                              )}
                            </span>

                          </td>

                          {/* Actions */}

                          <td className="px-6 py-4">

                            <div className="flex justify-end items-center gap-2">

                              <button
                                onClick={() =>
                                  handleDownload(
                                    doc._id,
                                    doc.originalName ||
                                      doc.name
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg bg-[#EEF2FF] text-[#5B6FD4] text-xs font-medium hover:opacity-80"
                              >
                                Download
                              </button>

                              {doc.status ===
                                "pending" && (
                                <>
                                  <button
                                    disabled={
                                      processingId ===
                                      doc._id
                                    }
                                    onClick={() =>
                                      handleApprove(
                                        doc._id
                                      )
                                    }
                                    className="px-3 py-1.5 rounded-lg bg-[#E6F4F1] text-[#3D9E8C] text-xs font-medium hover:opacity-80 disabled:opacity-50"
                                  >
                                    {processingId ===
                                    doc._id
                                      ? "..."
                                      : "Approve"}
                                  </button>

                                  <button
                                    disabled={
                                      processingId ===
                                      doc._id
                                    }
                                    onClick={() =>
                                      handleReject(
                                        doc._id
                                      )
                                    }
                                    className="px-3 py-1.5 rounded-lg bg-[#FDECEC] text-[#D95B5B] text-xs font-medium hover:opacity-80 disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

              {/* Mobile / tablet cards */}

              <div className="xl:hidden divide-y divide-[#E8E8F0]">

                {filteredDocuments.map(
                  (doc) => (
                    <div
                      key={doc._id}
                      className="p-5"
                    >

                      <div className="flex items-start gap-3">

                        <div className="w-10 h-10 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0">

                          <svg
                            className="w-5 h-5 text-[#5B6FD4]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z"
                            />
                          </svg>

                        </div>

                        <div className="flex-1 min-w-0">

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <p className="text-sm font-medium text-[#1A1A2E] truncate">
                                {doc.originalName ||
                                  doc.name}
                              </p>

                              <p className="text-xs text-[#9090A8] mt-1">
                                {formatFileSize(
                                  doc.size
                                )}
                              </p>

                            </div>

                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusClass(
                                doc.status
                              )}`}
                            >
                              {getStatusLabel(
                                doc.status
                              )}
                            </span>

                          </div>

                          <div className="mt-4 space-y-2">

                            <div>
                              <p className="text-[11px] uppercase tracking-wide text-[#9090A8]">
                                Participant
                              </p>

                              <p className="text-sm text-[#1A1A2E]">
                                {doc.user?.name ||
                                  "Unknown"}
                              </p>

                              <p className="text-xs text-[#9090A8]">
                                {doc.user?.email ||
                                  "No email"}
                              </p>
                            </div>

                            <div>
                              <p className="text-[11px] uppercase tracking-wide text-[#9090A8]">
                                Event
                              </p>

                              <p className="text-sm text-[#1A1A2E]">
                                {doc.event?.name ||
                                  "Unknown event"}
                              </p>
                            </div>

                            <div>
                              <p className="text-[11px] uppercase tracking-wide text-[#9090A8]">
                                Submitted
                              </p>

                              <p className="text-sm text-[#5A5A72]">
                                {formatDate(
                                  doc.createdAt
                                )}
                              </p>
                            </div>

                          </div>

                          <div className="flex flex-wrap gap-2 mt-4">

                            <button
                              onClick={() =>
                                handleDownload(
                                  doc._id,
                                  doc.originalName ||
                                    doc.name
                                )
                              }
                              className="px-3 py-1.5 rounded-lg bg-[#EEF2FF] text-[#5B6FD4] text-xs font-medium"
                            >
                              Download
                            </button>

                            {doc.status ===
                              "pending" && (
                              <>
                                <button
                                  disabled={
                                    processingId ===
                                    doc._id
                                  }
                                  onClick={() =>
                                    handleApprove(
                                      doc._id
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-[#E6F4F1] text-[#3D9E8C] text-xs font-medium disabled:opacity-50"
                                >
                                  {processingId ===
                                  doc._id
                                    ? "..."
                                    : "Approve"}
                                </button>

                                <button
                                  disabled={
                                    processingId ===
                                    doc._id
                                  }
                                  onClick={() =>
                                    handleReject(
                                      doc._id
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-[#FDECEC] text-[#D95B5B] text-xs font-medium disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                          </div>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}