import { useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  eventName?: string;
}

interface AdminUser {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "⬡" },
  { id: "participants", label: "Participants", icon: "◎" },
  { id: "invitations", label: "Invitations", icon: "◈" },
  { id: "announcements", label: "Announcements", icon: "◉" },
  { id: "documents", label: "Documents", icon: "◧" },
  { id: "event-builder", label: "Create Event", icon: "◱" },
];

function getAdminUser(): AdminUser | null {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.error("Failed to load admin user:", error);
    return null;
  }
}

export default function AdminLayout({
  children,
  currentPage,
  onNavigate,
  onLogout,
  eventName,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [adminUser] = useState<AdminUser | null>(
    getAdminUser
  );

  const adminName =
    adminUser?.name || "Event Admin";

  const adminEmail =
    adminUser?.email || "";

  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/);

    if (words.length === 0) {
      return "EA";
    }

    if (words.length === 1) {
      return words[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return `${words[0][0]}${
      words[words.length - 1][0]
    }`.toUpperCase();
  };

  const adminInitials =
    getInitials(adminName);

  return (
    <div className="flex h-full bg-[#FAFAF7]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-[#E8E8F0] flex flex-col transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="px-6 py-5 border-b border-[#E8E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                E
              </span>
            </div>

            <span className="font-display text-xl text-[#1A1A2E]">
              Evently
            </span>
          </div>
        </div>

        <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-[#EEF2FF] cursor-pointer hover:bg-[#E4EAFF] transition-colors">
          <p className="text-[10px] font-medium text-[#9090A8] uppercase tracking-wider mb-0.5">
            Current Event
          </p>

          <p className="text-sm font-semibold text-[#5B6FD4] truncate">
            {eventName || "Tech Summit 2026"}
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentPage === item.id
                  ? "bg-[#5B6FD4] text-white shadow-sm"
                  : "text-[#5A5A72] hover:bg-[#F0F0FA] hover:text-[#1A1A2E]"
              }`}
            >
              <span className="text-base">
                {item.icon}
              </span>

              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#E8E8F0]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F0F0FA] cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5B6FD4] to-[#7B8EEA] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {adminInitials}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A2E] truncate">
                {adminName}
              </p>

              <p className="text-xs text-[#9090A8] truncate">
                {adminEmail}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full mt-1 px-3 py-2 text-sm text-[#9090A8] hover:text-[#D95B5B] hover:bg-red-50 rounded-xl transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-[#E8E8F0] flex items-center gap-4 px-6 shrink-0">
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-[#F0F0FA]"
            onClick={() =>
              setSidebarOpen(true)
            }
          >
            <div className="w-5 h-0.5 bg-[#5A5A72] mb-1.5 rounded" />
            <div className="w-4 h-0.5 bg-[#5A5A72] mb-1.5 rounded" />
            <div className="w-5 h-0.5 bg-[#5A5A72] rounded" />
          </button>

          <h1 className="text-sm font-semibold text-[#1A1A2E] flex-1">
            {navItems.find(
              (item) =>
                item.id === currentPage
            )?.label || "Admin"}
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}