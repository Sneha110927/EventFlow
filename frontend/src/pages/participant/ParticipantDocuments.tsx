import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
} from 'react';

interface ParticipantDocument {
  _id: string;

  event?: string | {
    _id: string;
    name?: string;
  };

  user?: string | {
    _id: string;
    name?: string;
  };

  name?: string;

  originalName?: string;

  filename?: string;

  mimetype?: string;

  size?: number;

  status:
    | 'approved'
    | 'pending'
    | 'rejected';

  createdAt: string;

  updatedAt: string;
}

interface ParticipantDocumentRequest {
  _id: string;

  event?: string | {
    _id: string;
    name?: string;
  };

  participant?: string;

  documentName: string;

  description?: string;

  required: boolean;

  deadline: string;

  status:
    | 'pending'
    | 'submitted'
    | 'approved'
    | 'rejected';

  document?: string | {
    _id: string;
  };

  createdAt: string;

  updatedAt: string;
}

interface ParticipantDocumentsProps {
  eventId: string;

  show: (message: string) => void;

  onDocumentCountChange?: (
    count: number
  ) => void;

  onPendingRequestCountChange?: (
    count: number
  ) => void;
}

const API_BASE_URL =
  'http://localhost:5000/api';

async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<{
  response: Response;
  data: unknown;
}> {
  const response =
    await fetch(url, options);

  const contentType =
    response.headers.get(
      'content-type'
    ) || '';

  if (
    contentType.includes(
      'application/json'
    )
  ) {
    const data =
      await response.json();

    return {
      response,
      data,
    };
  }

  const text =
    await response.text();

  throw new Error(
    text ||
      `Request failed with status ${response.status}`
  );
}

export default function ParticipantDocuments({
  eventId,
  show,
  onDocumentCountChange,
  onPendingRequestCountChange,
}: ParticipantDocumentsProps) {
  const [
    documents,
    setDocuments,
  ] = useState<ParticipantDocument[]>(
    []
  );

  const [
    documentRequests,
    setDocumentRequests,
  ] = useState<
    ParticipantDocumentRequest[]
  >([]);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD DOCUMENTS
  |--------------------------------------------------------------------------
  */

  const loadDocuments =
    useCallback(async () => {
      try {
        const token =
          localStorage.getItem(
            'token'
          );

        if (!token) {
          return;
        }

        const result =
          await apiRequest(
            `${API_BASE_URL}/documents/my-documents`,
            {
              method: 'GET',
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          result.data as {
            documents?: ParticipantDocument[];
            message?: string;
          };

        if (
          !result.response.ok
        ) {
          throw new Error(
            data.message ||
              'Failed to load documents'
          );
        }

        const incomingDocuments =
          data.documents || [];

        setDocuments(
          incomingDocuments
        );

        onDocumentCountChange?.(
          incomingDocuments.length
        );
      } catch (error) {
        console.error(
          'Load documents error:',
          error
        );
      }
    }, [
      onDocumentCountChange,
    ]);

  /*
  |--------------------------------------------------------------------------
  | LOAD DOCUMENT REQUESTS
  |--------------------------------------------------------------------------
  */

  const loadDocumentRequests =
    useCallback(
      async (
        notifyOnNew = false
      ) => {
        try {
          const token =
            localStorage.getItem(
              'token'
            );

          if (!token) {
            return;
          }

          const result =
            await apiRequest(
              `${API_BASE_URL}/documents/my-requests`,
              {
                method: 'GET',
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const data =
            result.data as {
              requests?: ParticipantDocumentRequest[];
              message?: string;
            };

          if (
            !result.response.ok
          ) {
            throw new Error(
              data.message ||
                'Failed to load document requests'
            );
          }

          const requests =
            data.requests || [];
            const previousRequestIds =
  new Set(
    documentRequests.map(
      (request) => request._id
    )
  );

if (notifyOnNew) {
  const newRequests =
    requests.filter(
      (request) =>
        !previousRequestIds.has(
          request._id
        ) &&
        request.status === 'pending'
    );

  if (newRequests.length === 1) {
    show(
      `New document request: ${newRequests[0].documentName}`
    );
  } else if (newRequests.length > 1) {
    show(
      `${newRequests.length} new document requests`
    );
  }
}
          const pendingCount =
            requests.filter(
              (request) =>
                request.status ===
                'pending'
            ).length;

          onPendingRequestCountChange?.(
            pendingCount
          );

          setDocumentRequests(
            requests
          );
        } catch (error) {
          console.warn(
            'Load document requests error:',
            error
          );
        }
      },
      [
        onPendingRequestCountChange,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadDocuments();
        void loadDocumentRequests();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    loadDocuments,
    loadDocumentRequests,
  ]);

  /*
  |--------------------------------------------------------------------------
  | REQUEST POLLING
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const token =
      localStorage.getItem(
        'token'
      );

    if (!token) {
      return;
    }

    const timer =
      window.setInterval(() => {
        void loadDocumentRequests(
          true
        );
      }, 10000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    loadDocumentRequests,
  ]);

  /*
  |--------------------------------------------------------------------------
  | UPLOAD DOCUMENT
  |--------------------------------------------------------------------------
  */

  const uploadFile =
    useCallback(
      async (
        file: File,
        requestId?: string
      ) => {
        try {
          const token =
            localStorage.getItem(
              'token'
            );

          if (!token) {
            show(
              'You are not logged in'
            );
            return;
          }

          if (!eventId) {
            show(
              'No event assigned'
            );
            return;
          }

          const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
          ];

          if (
            !allowedTypes.includes(
              file.type
            )
          ) {
            show(
              'Only PDF, JPG, and PNG files are allowed'
            );
            return;
          }

          const maxSize =
            10 * 1024 * 1024;

          if (
            file.size > maxSize
          ) {
            show(
              'File size must be less than 10MB'
            );
            return;
          }

          setUploading(true);

          const formData =
            new FormData();

          formData.append(
            'file',
            file
          );

          formData.append(
            'eventId',
            eventId
          );

          if (requestId) {
            formData.append(
              'requestId',
              requestId
            );
          }

          const result =
            await apiRequest(
              `${API_BASE_URL}/documents/upload`,
              {
                method: 'POST',
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
                body: formData,
              }
            );

          const data =
            result.data as {
              document?: ParticipantDocument;
              request?: ParticipantDocumentRequest;
              message?: string;
            };

          if (
            !result.response.ok
          ) {
            throw new Error(
              data.message ||
                'Failed to upload document'
            );
          }

          if (
            data.document
          ) {
            setDocuments(
              (previous) => {
                const updated = [
                  data.document!,
                  ...previous,
                ];

                onDocumentCountChange?.(
                  updated.length
                );

                return updated;
              }
            );
          }

          if (requestId) {
            setDocumentRequests(
              (previous) => {
                const updated =
                  previous.map(
                    (request) => {
                      if (
                        request._id !==
                        requestId
                      ) {
                        return request;
                      }

                      return {
                        ...request,

                        status:
                          data.request
                            ?.status ||
                          'submitted',

                        document:
                          data.document?._id ||
                          request.document,

                        updatedAt:
                          data.request
                            ?.updatedAt ||
                          new Date().toISOString(),
                      };
                    }
                  );

                onPendingRequestCountChange?.(
                  updated.filter(
                    (request) =>
                      request.status ===
                      'pending'
                  ).length
                );

                return updated;
              }
            );

            show(
              'Requested document submitted successfully'
            );
          } else {
            show(
              'Document uploaded successfully'
            );
          }
        } catch (error) {
          console.error(
            'Document upload error:',
            error
          );

          show(
            error instanceof Error
              ? error.message
              : 'Failed to upload document'
          );
        } finally {
          setUploading(false);
        }
      },
      [
        eventId,
        show,
        onDocumentCountChange,
        onPendingRequestCountChange,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | REQUEST FILE CHANGE
  |--------------------------------------------------------------------------
  */

  const handleRequestFileChange =
    async (
      requestId: string,
      event: ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      await uploadFile(
        file,
        requestId
      );

      event.target.value = '';
    };

  /*
  |--------------------------------------------------------------------------
  | DOWNLOAD
  |--------------------------------------------------------------------------
  */

  const downloadDocument =
    useCallback(
      async (
        documentId: string,
        originalName: string
      ) => {
        try {
          const token =
            localStorage.getItem(
              'token'
            );

          if (!token) {
            show(
              'You are not logged in'
            );
            return;
          }

          const response =
            await fetch(
              `${API_BASE_URL}/documents/${documentId}/download`,
              {
                method: 'GET',
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          if (!response.ok) {
            let message =
              'Failed to download document';

            try {
              const data =
                await response.json();

              message =
                data.message ||
                message;
            } catch {
              // Ignore invalid JSON.
            }

            throw new Error(
              message
            );
          }

          const blob =
            await response.blob();

          const url =
            window.URL.createObjectURL(
              blob
            );

          const anchor =
            document.createElement(
              'a'
            );

          anchor.href = url;

          anchor.download =
            originalName ||
            'document';

          document.body.appendChild(
            anchor
          );

          anchor.click();

          anchor.remove();

          window.URL.revokeObjectURL(
            url
          );
        } catch (error) {
          console.error(
            'Download document error:',
            error
          );

          show(
            error instanceof Error
              ? error.message
              : 'Failed to download document'
          );
        }
      },
      [show]
    );

  /*
  |--------------------------------------------------------------------------
  | DATE
  |--------------------------------------------------------------------------
  */

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return 'Not specified';
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return 'Not specified';
    }

    return parsedDate.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  };

  const pendingDocumentRequestCount =
    documentRequests.filter(
      (request) =>
        request.status ===
        'pending'
    ).length;

  return (
    <div className="space-y-4">

      {/* =====================================================
          DOCUMENT REQUESTS
      ====================================================== */}

      <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">

        <div className="flex items-center justify-between mb-4">

          <div>
            <h3 className="font-semibold text-[#1A1A2E]">
              Document Requests
            </h3>

            <p className="text-xs text-[#9090A8] mt-1">
              Upload each document requested by
              the event administrator.
            </p>
          </div>

          {pendingDocumentRequestCount >
            0 && (
            <span className="bg-[#FEF3ED] text-[#E8824A] px-2.5 py-1 rounded-full text-xs font-semibold">
              {pendingDocumentRequestCount}{' '}
              pending
            </span>
          )}

        </div>

        {documentRequests.length ===
        0 ? (
          <div className="py-8 text-center">

            <div className="w-12 h-12 bg-[#F3F2EC] rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-[#9090A8]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <p className="text-sm text-[#9090A8]">
              No document requests yet.
            </p>

          </div>
        ) : (
          <div className="space-y-3">

            {documentRequests.map(
              (request) => {
                const isPending =
                  request.status ===
                  'pending';

                const isRejected =
                  request.status ===
                  'rejected';

                const isSubmitted =
                  request.status ===
                  'submitted';

                const isApproved =
                  request.status ===
                  'approved';

                return (
                  <div
                    key={
                      request._id
                    }
                    className={`rounded-xl border p-4 ${
                      isPending
                        ? 'border-[#F3C5B3] bg-[#FFF9F6]'
                        : isRejected
                        ? 'border-[#F2C4C4] bg-[#FFF8F8]'
                        : isApproved
                        ? 'border-[#CBE8E2] bg-[#F7FCFA]'
                        : 'border-[#E8E8F0] bg-[#FAFAF7]'
                    }`}
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-2 flex-wrap">

                          <h4 className="font-semibold text-[#1A1A2E] text-sm">
                            {
                              request.documentName
                            }
                          </h4>

                          {request.required ? (
                            <span className="text-[10px] bg-[#FDECEC] text-[#D95B5B] px-2 py-0.5 rounded-full font-semibold">
                              Required
                            </span>
                          ) : (
                            <span className="text-[10px] bg-[#F3F2EC] text-[#9090A8] px-2 py-0.5 rounded-full font-medium">
                              Optional
                            </span>
                          )}

                        </div>

                        {request.description && (
                          <p className="text-xs text-[#5A5A72] mt-2 leading-relaxed">
                            {
                              request.description
                            }
                          </p>
                        )}

                        <p className="text-xs text-[#9090A8] mt-2">
                          Deadline:{' '}
                          <span className="font-medium text-[#5A5A72]">
                            {formatDate(
                              request.deadline
                            )}
                          </span>
                        </p>

                      </div>

                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                          isApproved
                            ? 'bg-[#E6F4F1] text-[#3D9E8C]'
                            : isRejected
                            ? 'bg-[#FDECEC] text-[#D95B5B]'
                            : isSubmitted
                            ? 'bg-[#EEF2FF] text-[#5B6FD4]'
                            : 'bg-[#FEF3ED] text-[#E8824A]'
                        }`}
                      >
                        {isApproved
                          ? 'Approved'
                          : isRejected
                          ? 'Rejected'
                          : isSubmitted
                          ? 'Submitted'
                          : 'Pending'}
                      </span>

                    </div>

                    {(isPending ||
                      isRejected) && (
                      <div className="mt-4 pt-4 border-t border-[#E8E8F0]">

                        {isRejected && (
                          <p className="text-xs text-[#D95B5B] mb-3">
                            Your previous submission was rejected.
                            Please upload the document again.
                          </p>
                        )}

                        <label
                          className={`w-full border-2 border-dashed border-[#D0D0E8] rounded-xl p-5 text-center hover:border-[#5B6FD4] transition-colors bg-white block ${
                            uploading
                              ? 'opacity-60 cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                        >

                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            className="hidden"
                            disabled={
                              uploading
                            }
                            onChange={(
                              event
                            ) =>
                              void handleRequestFileChange(
                                request._id,
                                event
                              )
                            }
                          />

                          <div className="w-9 h-9 bg-[#EEF2FF] rounded-lg flex items-center justify-center mx-auto mb-2">

                            {uploading ? (
                              <div className="w-5 h-5 border-2 border-[#D0D0E8] border-t-[#5B6FD4] rounded-full animate-spin" />
                            ) : (
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
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            )}

                          </div>

                          <p className="text-sm font-medium text-[#1A1A2E]">
                            {uploading
                              ? 'Uploading...'
                              : isRejected
                              ? 'Upload again'
                              : 'Upload requested document'}
                          </p>

                          <p className="text-xs text-[#9090A8] mt-1">
                            PDF, JPG, PNG up to 10MB
                          </p>

                        </label>

                      </div>
                    )}

                    {isSubmitted && (
                      <div className="mt-4 pt-4 border-t border-[#E8E8F0]">
                        <div className="flex items-center gap-2 text-sm text-[#5B6FD4]">
                          <span className="w-6 h-6 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                            ✓
                          </span>

                          <span>
                            Document submitted —
                            awaiting administrator review.
                          </span>
                        </div>
                      </div>
                    )}

                    {isApproved && (
                      <div className="mt-4 pt-4 border-t border-[#E8E8F0]">
                        <div className="flex items-center gap-2 text-sm text-[#3D9E8C]">
                          <span className="w-6 h-6 rounded-full bg-[#E6F4F1] flex items-center justify-center">
                            ✓
                          </span>

                          <span>
                            Document approved by
                            the administrator.
                          </span>
                        </div>
                      </div>
                    )}

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* =====================================================
          UPLOADED DOCUMENTS
      ====================================================== */}

      <div className="pt-2">

        <h3 className="font-semibold text-[#1A1A2E] mb-3">
          Uploaded Documents
        </h3>

      </div>

      {documents.length > 0 ? (
        documents.map(
          (doc) => {
            const displayName =
              doc.originalName ||
              doc.name ||
              doc.filename ||
              'Document';

            const fileSize =
              typeof doc.size ===
              'number'
                ? (
                    doc.size /
                    1024 /
                    1024
                  ).toFixed(2)
                : '—';

            return (
              <div
                key={
                  doc._id
                }             
                className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5 flex items-center gap-4"
              >

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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">

                  <p className="font-medium text-[#1A1A2E] text-sm truncate">
                    {displayName}
                  </p>

                  <p className="text-xs text-[#9090A8]">
                    {fileSize} MB ·{' '}
                    {formatDate(
                      doc.createdAt
                    )}
                  </p>

                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                    doc.status ===
                    'approved'
                      ? 'bg-[#E6F4F1] text-[#3D9E8C]'
                      : doc.status ===
                        'rejected'
                      ? 'bg-[#FDECEC] text-[#D95B5B]'
                      : 'bg-[#FEF3ED] text-[#E8824A]'
                  }`}
                >
                  {doc.status ===
                  'approved'
                    ? 'Approved'
                    : doc.status ===
                      'rejected'
                    ? 'Rejected'
                    : 'Pending Review'}
                </span>

                <button
                  onClick={() =>
                    void downloadDocument(
                      doc._id,
                      displayName
                    )
                  }
                  className="text-xs bg-[#EEF2FF] text-[#5B6FD4] px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity shrink-0"
                >
                  Download
                </button>

              </div>
            );
          }
        )
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-8 text-center">

          <div className="w-12 h-12 bg-[#EEF2FF] rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-[#5B6FD4]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <p className="text-sm text-[#9090A8]">
            No documents uploaded yet.
          </p>

        </div>
      )}

    </div>
  );
}