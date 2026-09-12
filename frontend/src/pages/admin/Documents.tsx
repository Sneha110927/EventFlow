import { useEffect, useMemo, useState } from "react";

import {
  FileText,
  Plus,
  X,
  Search,
  CheckCircle,
  Download,
  XCircle,
  Send,
  Upload,
} from "lucide-react";

// =========================================================
// TYPES
// =========================================================

interface Event {
  _id: string;
  name: string;
  type?: string;
}

interface Participant {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role?: string;
}

interface DocumentUser {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

interface DocumentEvent {
  _id: string;
  name: string;
  type?: string;
}

interface DocumentItem {
  _id: string;
  name: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;

  status:
    | "pending"
    | "approved"
    | "rejected";

  user?: DocumentUser | string;

  event?: DocumentEvent | string;

  createdAt: string;
  updatedAt?: string;
}

interface DocumentRequest {
  _id: string;

  event?: DocumentEvent | string;

  participant?: Participant | string;

  documentName: string;

  description?: string;

  required: boolean;

  deadline: string;

  status:
    | "pending"
    | "submitted"
    | "approved"
    | "rejected";

  document?: DocumentItem | string;

  createdBy?: {
    _id: string;
    name: string;
    email: string;
  } | string;

  createdAt: string;

  updatedAt: string;
}

// =========================================================
// API
// =========================================================

const API_URL = "http://localhost:5000/api";

// =========================================================
// COMPONENT
// =========================================================

export default function Documents() {
  // =======================================================
  // STATE
  // =======================================================

  const [activeTab, setActiveTab] =
    useState<"requests" | "submissions">(
      "requests"
    );

  const [showRequestForm, setShowRequestForm] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [events, setEvents] =
    useState<Event[]>([]);

  const [participants, setParticipants] =
    useState<Participant[]>([]);

  const [requests, setRequests] =
    useState<DocumentRequest[]>([]);

  const [documents, setDocuments] =
    useState<DocumentItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingParticipants, setLoadingParticipants] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  // =======================================================
  // FORM STATE
  // =======================================================

  const [eventId, setEventId] =
    useState("");

  const [participantId, setParticipantId] =
    useState("all");

  const [documentName, setDocumentName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [required, setRequired] =
    useState(true);

  const [deadline, setDeadline] =
    useState("");

  // =======================================================
  // TOKEN
  // =======================================================

  const token =
    localStorage.getItem("token");

  // =======================================================
  // HEADERS
  // =======================================================

  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const getJsonHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // =======================================================
  // LOAD INITIAL DATA
  // =======================================================

 useEffect(() => {
  let cancelled = false;

  const fetchInitialData = async () => {
    try {
      setLoading(true);

   console.log("🔥 1. Starting events request");
console.log("🔥 URL:", `${API_URL}/documents/events`);
console.log("🔥 TOKEN EXISTS:", !!token);

const eventsResponse = await fetch(
  `${API_URL}/documents/events`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

console.log("🔥 2. Events response received");
console.log("🔥 STATUS:", eventsResponse.status);

const eventsData = await eventsResponse.json();

console.log("🔥 3. Events data:", eventsData);

      console.log("EVENTS API STATUS:", eventsResponse.status);
      console.log("EVENTS API RESPONSE:", eventsData);

      if (!eventsResponse.ok) {
        throw new Error(
          eventsData.message ||
            `Failed to fetch events (${eventsResponse.status})`
        );
      }

      const requestsResponse = await fetch(
        `${API_URL}/documents/requests`,
        {
          headers: getHeaders(),
        }
      );

      const requestsData = await requestsResponse.json();

      if (!requestsResponse.ok) {
        throw new Error(
          requestsData.message ||
            `Failed to fetch document requests (${requestsResponse.status})`
        );
      }

      const documentsResponse = await fetch(
        `${API_URL}/documents`,
        {
          headers: getHeaders(),
        }
      );

      const documentsData = await documentsResponse.json();

      if (!documentsResponse.ok) {
        throw new Error(
          documentsData.message ||
            `Failed to fetch documents (${documentsResponse.status})`
        );
      }

      if (cancelled) {
        return;
      }

      const eventList = eventsData.events || [];

      console.log("EVENT LIST:", eventList);

      setEvents(eventList);

      setRequests(
        requestsData.requests || []
      );

      setDocuments(
        documentsData.documents || []
      );

      if (eventList.length > 0) {
        setEventId((current) =>
          current || eventList[0]._id
        );
      }

    } catch (error) {
      console.error(
        "LOAD DOCUMENTS PAGE ERROR:",
        error
      );

      if (!cancelled) {
        alert(
          error instanceof Error
            ? error.message
            : "Failed to load documents"
        );
      }

    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  void fetchInitialData();

  return () => {
    cancelled = true;
  };
}, []);

  // =======================================================
  // LOAD PARTICIPANTS FOR SELECTED EVENT
  // =======================================================

  useEffect(() => {
    if (!eventId) {
      return;
    }

    let cancelled = false;

    const fetchEventParticipants =
      async () => {
        try {
          setLoadingParticipants(true);

          const response =
            await fetch(
              `${API_URL}/documents/participants?eventId=${encodeURIComponent(
                eventId
              )}`,
              {
                headers:
                  getHeaders(),
              }
            );

          if (!response.ok) {
            throw new Error(
              "Failed to fetch event participants"
            );
          }

          const data =
            await response.json();

          if (cancelled) {
            return;
          }

          setParticipants(
            data.participants || []
          );

          /*
           * Reset selected participant
           * when event changes.
           *
           * "all" is always valid.
           */
          setParticipantId(
            "all"
          );
        } catch (error) {
          if (!cancelled) {
            console.error(
              "Load event participants error:",
              error
            );

            /*
             * We intentionally don't call
             * setParticipants([]) here.
             *
             * This prevents the React
             * cascading-render warning.
             */
          }
        } finally {
          if (!cancelled) {
            setLoadingParticipants(
              false
            );
          }
        }
      };

    void fetchEventParticipants();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // =======================================================
  // RELOAD REQUESTS
  // =======================================================

  const loadRequests = async () => {
    try {
      const response =
        await fetch(
          `${API_URL}/documents/requests`,
          {
            headers:
              getHeaders(),
          }
        );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch document requests"
        );
      }

      const data =
        await response.json();

      setRequests(
        data.requests || []
      );
    } catch (error) {
      console.error(
        "Load requests error:",
        error
      );
    }
  };

  // =======================================================
  // RELOAD DOCUMENTS
  // =======================================================

  const loadDocuments = async () => {
    try {
      const response =
        await fetch(
          `${API_URL}/documents`,
          {
            headers:
              getHeaders(),
          }
        );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch documents"
        );
      }

      const data =
        await response.json();

      setDocuments(
        data.documents || []
      );
    } catch (error) {
      console.error(
        "Load documents error:",
        error
      );
    }
  };

  // =======================================================
  // CREATE DOCUMENT REQUEST
  // =======================================================

  const handleCreateRequest =
    async (
      e: React.FormEvent<HTMLFormElement>
    ) => {
      e.preventDefault();

      if (!eventId) {
        alert(
          "Please select an event."
        );
        return;
      }

      if (!documentName.trim()) {
        alert(
          "Please enter a document name."
        );
        return;
      }

      if (!deadline) {
        alert(
          "Please select a deadline."
        );
        return;
      }

      if (
        participantId !== "all" &&
        !participants.some(
          (participant) =>
            participant._id ===
            participantId
        )
      ) {
        alert(
          "Please select a valid participant."
        );
        return;
      }

      setSubmitting(true);

      try {
        const response =
          await fetch(
            `${API_URL}/documents/requests`,
            {
              method: "POST",

              headers:
                getJsonHeaders(),

              body: JSON.stringify({
                eventId,

                participantId,

                documentName:
                  documentName.trim(),

                description:
                  description.trim(),

                required,

                deadline,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to create document request"
          );
        }

        alert(
          data.message ||
            "Document request created successfully."
        );

        // Reset form
        setDocumentName("");

        setDescription("");

        setRequired(true);

        setDeadline("");

        setParticipantId(
          "all"
        );

        setShowRequestForm(
          false
        );

        await loadRequests();
      } catch (error) {
        console.error(
          "Create request error:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Failed to create document request"
        );
      } finally {
        setSubmitting(false);
      }
    };

  // =======================================================
  // APPROVE DOCUMENT
  // =======================================================

  const approveDocument =
    async (
      documentId: string
    ) => {
      try {
        const response =
          await fetch(
            `${API_URL}/documents/${documentId}/approve`,
            {
              method: "PUT",

              headers:
                getJsonHeaders(),
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

        await Promise.all([
          loadDocuments(),
          loadRequests(),
        ]);
      } catch (error) {
        console.error(
          "Approve document error:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Failed to approve document"
        );
      }
    };

  // =======================================================
  // REJECT DOCUMENT
  // =======================================================

  const rejectDocument =
    async (
      documentId: string
    ) => {
      try {
        const response =
          await fetch(
            `${API_URL}/documents/${documentId}/reject`,
            {
              method: "PUT",

              headers:
                getJsonHeaders(),
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

        await Promise.all([
          loadDocuments(),
          loadRequests(),
        ]);
      } catch (error) {
        console.error(
          "Reject document error:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Failed to reject document"
        );
      }
    };

  // =======================================================
  // DOWNLOAD DOCUMENT
  // =======================================================

  const downloadDocument =
    async (
      documentId: string,
      filename: string
    ) => {
      try {
        const response =
          await fetch(
            `${API_URL}/documents/${documentId}/download`,
            {
              headers:
                getHeaders(),
            }
          );

        if (!response.ok) {
          const data =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            data?.message ||
              "Failed to download document"
          );
        }

        const blob =
          await response.blob();

        const url =
          window.URL.createObjectURL(
            blob
          );

        const link =
          document.createElement(
            "a"
          );

        link.href = url;

        link.download =
          filename;

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

        window.URL.revokeObjectURL(
          url
        );
      } catch (error) {
        console.error(
          "Download document error:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Failed to download document"
        );
      }
    };

  // =======================================================
  // SEND REMINDER
  // =======================================================

  const sendReminder = (
    request: DocumentRequest
  ) => {
    const participantName =
      request.participant &&
      typeof request.participant ===
        "object"
        ? request.participant.name
        : "participant";

    alert(
      `Reminder functionality will notify ${participantName} about "${request.documentName}".`
    );
  };

  // =======================================================
  // FORMAT DATE
  // =======================================================

  const formatDate = (
    date: string
  ) => {
    if (!date) {
      return "-";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // =======================================================
  // GET PARTICIPANT NAME
  // =======================================================

  const getParticipantName = (
    request: DocumentRequest
  ) => {
    if (
      request.participant &&
      typeof request.participant ===
        "object"
    ) {
      return request.participant
        .name;
    }

    return "Participant";
  };

  // =======================================================
  // GET EVENT NAME
  // =======================================================

  const getEventName = (
    request: DocumentRequest
  ) => {
    if (
      request.event &&
      typeof request.event ===
        "object"
    ) {
      return request.event.name;
    }

    return "Event";
  };

  // =======================================================
  // FILTER REQUESTS
  // =======================================================

  const filteredRequests =
  useMemo(() => {
    const query =
      search
        .trim()
        .toLowerCase();

    // Only show requests that are still waiting
    // for the participant to upload.
    const pendingRequests =
      requests.filter(
        (request) =>
          request.status === "pending"
      );

    if (!query) {
      return pendingRequests;
    }

    return pendingRequests.filter(
      (request) => {
        const participantName =
          getParticipantName(
            request
          ).toLowerCase();

        const eventName =
          getEventName(
            request
          ).toLowerCase();

        return (
          request.documentName
            .toLowerCase()
            .includes(query) ||
          (
            request.description ||
            ""
          )
            .toLowerCase()
            .includes(query) ||
          participantName.includes(
            query
          ) ||
          eventName.includes(
            query
          )
        );
      }
    );
  }, [requests, search]);

  // =======================================================
  // FILTER DOCUMENTS
  // =======================================================

  const filteredDocuments =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return documents;
      }

      return documents.filter(
        (document) => {
          const userName =
            document.user &&
            typeof document.user ===
              "object"
              ? document.user.name
              : "";

          const eventName =
            document.event &&
            typeof document.event ===
              "object"
              ? document.event.name
              : "";

          return (
            document.name
              .toLowerCase()
              .includes(query) ||
            (
              document.originalName ||
              ""
            )
              .toLowerCase()
              .includes(query) ||
            userName
              .toLowerCase()
              .includes(query) ||
            eventName
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [documents, search]);

  // =======================================================
  // STATISTICS
  // =======================================================

  const requestsSent =
    requests.length;

  const uploaded =
    requests.filter(
      (request) =>
        request.status ===
          "submitted" ||
        request.status ===
          "approved"
    ).length;

  const pendingUpload =
    requests.filter(
      (request) =>
        request.status ===
        "pending"
    ).length;

  const approved =
    requests.filter(
      (request) =>
        request.status ===
        "approved"
    ).length;

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="min-h-screen bg-[#fafaf8] px-8 py-8">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-8 flex items-start justify-between">

        <div>
          <h1 className="font-serif text-4xl font-semibold text-[#101b3d]">
            Documents
          </h1>

          <p className="mt-2 text-base text-[#8b8daa]">
            Request documents from participants
            and review uploads
          </p>
        </div>

        <button
          onClick={() =>
            setShowRequestForm(true)
          }
          className="flex items-center gap-2 rounded-full bg-[#6679df] px-6 py-4 text-sm font-semibold text-white shadow-md transition hover:bg-[#566bd4]"
        >
          <Plus size={18} />

          Request Document
        </button>
      </div>

      {/* ================================================= */}
      {/* STATISTICS */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-[#e7e7ed] bg-white p-6 shadow-sm">
          <p className="text-sm font-medium tracking-wide text-[#9092aa]">
            REQUESTS SENT
          </p>

          <p className="mt-3 font-serif text-4xl text-[#5870dc]">
            {requestsSent}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e7e7ed] bg-white p-6 shadow-sm">
          <p className="text-sm font-medium tracking-wide text-[#9092aa]">
            UPLOADED
          </p>

          <p className="mt-3 font-serif text-4xl text-[#299b88]">
            {uploaded}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e7e7ed] bg-white p-6 shadow-sm">
          <p className="text-sm font-medium tracking-wide text-[#9092aa]">
            PENDING UPLOAD
          </p>

          <p className="mt-3 font-serif text-4xl text-[#e7a034]">
            {pendingUpload}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e7e7ed] bg-white p-6 shadow-sm">
          <p className="text-sm font-medium tracking-wide text-[#9092aa]">
            APPROVED
          </p>

          <p className="mt-3 font-serif text-4xl text-[#299b88]">
            {approved}
          </p>
        </div>
      </div>

      {/* ================================================= */}
      {/* SEARCH */}
      {/* ================================================= */}

      <div className="mt-8 flex items-center gap-3 rounded-xl border border-[#e7e7ed] bg-white px-4 py-3 shadow-sm">

        <Search
          size={20}
          className="text-[#9698ae]"
        />

        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Search documents, participants, events..."
          className="w-full bg-transparent text-sm text-[#17203d] outline-none placeholder:text-[#a2a4b7]"
        />
      </div>

      {/* ================================================= */}
      {/* TABS */}
      {/* ================================================= */}

      <div className="mt-7 inline-flex rounded-full bg-[#f0eee9] p-1">

        <button
          onClick={() =>
            setActiveTab(
              "requests"
            )
          }
          className={`rounded-full px-6 py-3 text-sm font-medium transition ${
            activeTab ===
            "requests"
              ? "bg-white text-[#5870dc] shadow-sm"
              : "text-[#8c8ea5]"
          }`}
        >
        Requested (
{requests.filter(
  (request) =>
    request.status === "pending"
).length})
        </button>

        <button
          onClick={() =>
            setActiveTab(
              "submissions"
            )
          }
          className={`rounded-full px-6 py-3 text-sm font-medium transition ${
            activeTab ===
            "submissions"
              ? "bg-white text-[#5870dc] shadow-sm"
              : "text-[#8c8ea5]"
          }`}
        >
          Submissions (
          {documents.length})
        </button>
      </div>

      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      {loading ? (
        <div className="mt-8 rounded-2xl border border-[#e7e7ed] bg-white p-12 text-center">
          <p className="text-[#8b8daa]">
            Loading documents...
          </p>
        </div>
      ) : (
        <>
          {/* ============================================= */}
          {/* REQUESTS */}
          {/* ============================================= */}

          {activeTab ===
            "requests" && (
            <div className="mt-7 space-y-4">

              {filteredRequests.length ===
              0 ? (
                <div className="rounded-2xl border border-[#e7e7ed] bg-white p-12 text-center">

                  <FileText
                    size={40}
                    className="mx-auto text-[#9ba1e8]"
                  />

                  <h3 className="mt-4 text-lg font-semibold text-[#17203d]">
                    No document requests
                  </h3>

                  <p className="mt-2 text-sm text-[#8b8daa]">
                    Create your first
                    document request
                    for participants.
                  </p>

                  <button
                    onClick={() =>
                      setShowRequestForm(
                        true
                      )
                    }
                    className="mt-5 rounded-full bg-[#6679df] px-5 py-3 text-sm font-semibold text-white"
                  >
                    + Request Document
                  </button>
                </div>
              ) : (
                filteredRequests.map(
                  (request) => (
                    <div
                      key={
                        request._id
                      }
                      className="rounded-2xl border border-[#e5e5eb] bg-white p-6 shadow-sm"
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        {/* LEFT */}

                        <div className="flex gap-5">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#edf1ff]">
                            <FileText
                              size={23}
                              className="text-[#5e72df]"
                            />
                          </div>

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="text-lg font-semibold text-[#111b3c]">
                                {
                                  request.documentName
                                }
                              </h3>

                              {request.required && (
                                <span className="rounded-full bg-[#fff0f0] px-3 py-1 text-xs font-medium text-[#ef6464]">
                                  Required
                                </span>
                              )}

                              {request.status ===
                                "pending" && (
                                <span className="rounded-full bg-[#fff2e9] px-3 py-1 text-xs font-medium text-[#ef8d54]">
                                  Awaiting Upload
                                </span>
                              )}

                              {request.status ===
                                "submitted" && (
                                <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-medium text-[#5d72dd]">
                                  Submitted
                                </span>
                              )}

                              {request.status ===
                                "approved" && (
                                <span className="rounded-full bg-[#e9f8f4] px-3 py-1 text-xs font-medium text-[#279a88]">
                                  Approved
                                </span>
                              )}

                              {request.status ===
                                "rejected" && (
                                <span className="rounded-full bg-[#fff0f0] px-3 py-1 text-xs font-medium text-[#e05252]">
                                  Rejected
                                </span>
                              )}
                            </div>

                            {request.description && (
                              <p className="mt-2 text-sm text-[#888ba4]">
                                {
                                  request.description
                                }
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">

                              {/* PARTICIPANT */}

                              <span className="text-[#8b8daa]">
                                Sent to:{" "}
                                <strong className="font-medium text-[#26304b]">
                                  {
                                    getParticipantName(
                                      request
                                    )
                                  }
                                </strong>
                              </span>

                              {/* EVENT */}

                              <span className="text-[#8b8daa]">
                                Event:{" "}
                                <strong className="font-medium text-[#26304b]">
                                  {
                                    getEventName(
                                      request
                                    )
                                  }
                                </strong>
                              </span>

                              {/* DEADLINE */}

                              <span className="text-[#8b8daa]">
                                Deadline:{" "}
                                <strong className="font-medium text-[#ef7651]">
                                  {formatDate(
                                    request.deadline
                                  )}
                                </strong>
                              </span>

                              {/* REQUESTED */}

                              <span className="text-[#8b8daa]">
                                Requested:{" "}
                                <strong className="font-medium text-[#26304b]">
                                  {formatDate(
                                    request.createdAt
                                  )}
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT */}

                        {request.status ===
                          "pending" && (
                          <button
                            onClick={() =>
                              sendReminder(
                                request
                              )
                            }
                            className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#edf1ff] px-5 py-3 text-sm font-medium text-[#5870dc] transition hover:bg-[#e3e8ff]"
                          >
                            <Send
                              size={16}
                            />

                            Send Reminder
                          </button>
                        )}

                        {request.status ===
                          "submitted" &&
                          request.document && (
                            <div className="flex items-center gap-2 text-sm font-medium text-[#5870dc]">
                              <Upload
                                size={17}
                              />

                              Document
                              Submitted
                            </div>
                          )}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          )}

          {/* ============================================= */}
          {/* SUBMISSIONS */}
          {/* ============================================= */}

          {activeTab ===
            "submissions" && (
            <div className="mt-7 space-y-4">

              {filteredDocuments.length ===
              0 ? (
                <div className="rounded-2xl border border-[#e7e7ed] bg-white p-12 text-center">

                  <Upload
                    size={40}
                    className="mx-auto text-[#9ba1e8]"
                  />

                  <h3 className="mt-4 text-lg font-semibold text-[#17203d]">
                    No submissions
                  </h3>

                  <p className="mt-2 text-sm text-[#8b8daa]">
                    Uploaded participant
                    documents will
                    appear here.
                  </p>
                </div>
              ) : (
                filteredDocuments.map(
                  (document) => {

                    const user =
                      document.user &&
                      typeof document.user ===
                        "object"
                        ? document.user
                        : null;

                    const event =
                      document.event &&
                      typeof document.event ===
                        "object"
                        ? document.event
                        : null;

                    return (
                      <div
                        key={
                          document._id
                        }
                        className="rounded-2xl border border-[#e5e5eb] bg-white p-6 shadow-sm"
                      >

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                          {/* DOCUMENT INFO */}

                          <div className="flex gap-5">

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#edf1ff]">
                              <FileText
                                size={23}
                                className="text-[#5e72df]"
                              />
                            </div>

                            <div>

                              <div className="flex flex-wrap items-center gap-2">

                                <h3 className="text-lg font-semibold text-[#111b3c]">
                                  {
                                    document.originalName ||
                                    document.name
                                  }
                                </h3>

                                {document.status ===
                                  "pending" && (
                                  <span className="rounded-full bg-[#fff2e9] px-3 py-1 text-xs font-medium text-[#ef8d54]">
                                    Pending Review
                                  </span>
                                )}

                                {document.status ===
                                  "approved" && (
                                  <span className="rounded-full bg-[#e9f8f4] px-3 py-1 text-xs font-medium text-[#279a88]">
                                    Approved
                                  </span>
                                )}

                                {document.status ===
                                  "rejected" && (
                                  <span className="rounded-full bg-[#fff0f0] px-3 py-1 text-xs font-medium text-[#e05252]">
                                    Rejected
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 text-sm text-[#8b8daa]">
                                Uploaded by{" "}
                                <strong className="font-medium text-[#26304b]">
                                  {user?.name ||
                                    "Participant"}
                                </strong>
                              </p>

                              {user?.email && (
                                <p className="mt-1 text-sm text-[#999bb0]">
                                  {
                                    user.email
                                  }
                                </p>
                              )}

                              {/* EVENT */}

                              {event?.name && (
                                <p className="mt-2 text-sm text-[#8b8daa]">
                                  Event:{" "}
                                  <strong className="font-medium text-[#26304b]">
                                    {
                                      event.name
                                    }
                                  </strong>
                                </p>
                              )}

                              <p className="mt-2 text-xs text-[#a0a2b4]">
                                Uploaded{" "}
                                {formatDate(
                                  document.createdAt
                                )}
                              </p>
                            </div>
                          </div>

                          {/* ACTIONS */}

                          <div className="flex flex-wrap items-center gap-2">

                            <button
                              onClick={() =>
                                downloadDocument(
                                  document._id,
                                  document.originalName
                                )
                              }
                              className="flex items-center gap-2 rounded-full bg-[#edf1ff] px-4 py-2.5 text-sm font-medium text-[#5870dc] hover:bg-[#e1e7ff]"
                            >
                              <Download
                                size={16}
                              />

                              Download
                            </button>

                            {document.status ===
                              "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    approveDocument(
                                      document._id
                                    )
                                  }
                                  className="flex items-center gap-2 rounded-full bg-[#e8f7f3] px-4 py-2.5 text-sm font-medium text-[#279a88] hover:bg-[#dcf3ed]"
                                >
                                  <CheckCircle
                                    size={16}
                                  />

                                  Approve
                                </button>

                                <button
                                  onClick={() =>
                                    rejectDocument(
                                      document._id
                                    )
                                  }
                                  className="flex items-center gap-2 rounded-full bg-[#fff0f0] px-4 py-2.5 text-sm font-medium text-[#e05252] hover:bg-[#ffe5e5]"
                                >
                                  <XCircle
                                    size={16}
                                  />

                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>
          )}
        </>
      )}

      {/* ================================================= */}
      {/* REQUEST DOCUMENT MODAL */}
      {/* ================================================= */}

      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-5">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between">

              <div>
                <h2 className="font-serif text-3xl font-semibold text-[#111b3c]">
                  Request Document
                </h2>

                <p className="mt-2 text-sm text-[#8b8daa]">
                  Select an event and
                  participant, then request
                  the document.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowRequestForm(
                    false
                  )
                }
                className="rounded-full p-2 text-[#8b8daa] hover:bg-[#f4f4f5]"
              >
                <X size={22} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleCreateRequest
              }
              className="mt-8 space-y-6"
            >

              {/* ========================================= */}
              {/* EVENT */}
              {/* ========================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#26304b]">
                  Event
                </label>

                <select
                  value={eventId}
                  onChange={(e) =>
                    setEventId(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#dedee6] bg-white px-4 py-3 text-sm outline-none focus:border-[#6679df]"
                  required
                >
                  <option value="">
                    Select event
                  </option>

                  {events.map(
                    (event) => (
                      <option
                        key={
                          event._id
                        }
                        value={
                          event._id
                        }
                      >
                        {event.name}
                        {event.type
                          ? ` — ${event.type}`
                          : ""}
                      </option>
                    )
                  )}
                </select>

                {events.length ===
                  0 && (
                  <p className="mt-2 text-xs text-[#e05252]">
                    No events found.
                    Create an event
                    first.
                  </p>
                )}
              </div>

              {/* ========================================= */}
              {/* PARTICIPANT */}
              {/* ========================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#26304b]">
                  Send To
                </label>

                <select
                  value={
                    participantId
                  }
                  onChange={(e) =>
                    setParticipantId(
                      e.target.value
                    )
                  }
                  disabled={
                    !eventId ||
                    loadingParticipants
                  }
                  className="w-full rounded-xl border border-[#dedee6] bg-white px-4 py-3 text-sm outline-none focus:border-[#6679df] disabled:bg-[#f5f5f5]"
                  required
                >
                  <option value="all">
                    All Participants
                  </option>

                  {participants.map(
                    (
                      participant
                    ) => (
                      <option
                        key={
                          participant._id
                        }
                        value={
                          participant._id
                        }
                      >
                        {
                          participant.name
                        }
                        {" — "}
                        {
                          participant.email
                        }
                      </option>
                    )
                  )}
                </select>

                {loadingParticipants && (
                  <p className="mt-2 text-xs text-[#8b8daa]">
                    Loading participants
                    for this event...
                  </p>
                )}

                {!loadingParticipants &&
                  eventId &&
                  participants.length ===
                    0 && (
                    <p className="mt-2 text-xs text-[#e05252]">
                      No participants are
                      registered for this
                      event yet.
                    </p>
                  )}

                {!loadingParticipants &&
                  participants.length >
                    0 && (
                    <p className="mt-2 text-xs text-[#999bb0]">
                      {participants.length}{" "}
                      participant
                      {participants.length !==
                      1
                        ? "s"
                        : ""}{" "}
                      registered for
                      this event.
                    </p>
                  )}
              </div>

              {/* ========================================= */}
              {/* DOCUMENT NAME */}
              {/* ========================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#26304b]">
                  Document Name
                </label>

                <input
                  type="text"
                  value={
                    documentName
                  }
                  onChange={(e) =>
                    setDocumentName(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Government-Issued ID"
                  className="w-full rounded-xl border border-[#dedee6] px-4 py-3 text-sm outline-none focus:border-[#6679df]"
                  required
                />
              </div>

              {/* ========================================= */}
              {/* DESCRIPTION */}
              {/* ========================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#26304b]">
                  Description
                </label>

                <textarea
                  value={
                    description
                  }
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows={4}
                  placeholder="Explain what the participant should upload..."
                  className="w-full resize-none rounded-xl border border-[#dedee6] px-4 py-3 text-sm outline-none focus:border-[#6679df]"
                />
              </div>

              {/* ========================================= */}
              {/* DEADLINE */}
              {/* ========================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#26304b]">
                  Deadline
                </label>

                <input
                  type="date"
                  value={
                    deadline
                  }
                  onChange={(e) =>
                    setDeadline(
                      e.target.value
                    )
                  }
                  min={
                    new Date()
                      .toISOString()
                      .split(
                        "T"
                      )[0]
                  }
                  className="w-full rounded-xl border border-[#dedee6] px-4 py-3 text-sm outline-none focus:border-[#6679df]"
                  required
                />
              </div>

              {/* ========================================= */}
              {/* REQUIRED */}
              {/* ========================================= */}

              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-[#f8f8f6] p-4">

                <input
                  type="checkbox"
                  checked={
                    required
                  }
                  onChange={(e) =>
                    setRequired(
                      e.target.checked
                    )
                  }
                  className="h-4 w-4"
                />

                <div>
                  <p className="text-sm font-medium text-[#26304b]">
                    Required document
                  </p>

                  <p className="mt-1 text-xs text-[#999bb0]">
                    Mark this document
                    as mandatory for
                    the participant.
                  </p>
                </div>
              </label>

              {/* ========================================= */}
              {/* BUTTONS */}
              {/* ========================================= */}

              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowRequestForm(
                      false
                    )
                  }
                  className="rounded-full border border-[#dedee6] px-6 py-3 text-sm font-medium text-[#73758b] hover:bg-[#f7f7f7]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !eventId ||
                    participants.length ===
                      0
                  }
                  className="rounded-full bg-[#6679df] px-7 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#566bd4] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Sending..."
                    : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}