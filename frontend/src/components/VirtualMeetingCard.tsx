interface VirtualMeetingCardProps {
  meetingLink?: string;
}

export default function VirtualMeetingCard({
  meetingLink,
}: VirtualMeetingCardProps) {
  if (!meetingLink) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0">
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
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"
            />
            <rect
              x="3"
              y="6"
              width="12"
              height="12"
              rx="2"
              stroke="currentColor"
              strokeWidth={2}
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#1A1A2E] text-sm">
            Virtual Event
          </p>

          <p className="text-xs text-[#9090A8] mt-1">
            Join the event online through Google Meet.
          </p>
        </div>

        <a
          href={meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          Join Google Meet
        </a>
      </div>
    </div>
  );
}