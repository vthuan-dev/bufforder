import { ReactNode, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  ShoppingBag,
  MessageSquare,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Moon,
  Sun,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import api from "../../services/api";
import { io, Socket } from "socket.io-client";

interface AdminLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const baseMenuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "users", icon: Users, label: "Users" },
  { id: "deposits", icon: ArrowDownCircle, label: "Deposits" },
  { id: "withdrawals", icon: ArrowUpCircle, label: "Withdrawals" },
  { id: "orders", icon: ShoppingBag, label: "Orders" },
  { id: "chat", icon: MessageSquare, label: "Chat Support" },
  { id: "settings", icon: Settings, label: "Settings" },
] as const;

export function AdminLayout({ children, currentPage, onNavigate, onLogout }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [chatUnread, setChatUnread] = useState<number>(0);
  const socketRef = useState<Socket | null>(null)[0];

  // Initial fetch unread + listen to socket updates
  useEffect(() => {
    (async () => {
      try {
        const res = await api.adminChatListThreads({ page: 1, limit: 100 });
        const total = (res?.data?.threads || []).reduce((sum: number, t: any) => sum + (t.unreadForAdmin || 0), 0);
        setChatUnread(total);
      } catch {}
    })();

    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('adminToken') : null;
      if (!token) return;
      const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';
      const s = io(API_BASE, { auth: { adminToken: token } });
      (AdminLayout as any)._socket = s; // store to static for cleanup
      s.on('chat:threadUpdated', () => {
        setChatUnread((u) => u + 1);
      });
      return () => { try { s.disconnect(); } catch {} };
    } catch {}
  }, []);

  // Listen to broadcast from Chat page for recalculated totals
  useEffect(() => {
    const handler = (e: any) => {
      const n = Number(e?.detail || 0);
      if (!isNaN(n)) setChatUnread(n);
    };
    window.addEventListener('chatUnreadUpdated', handler as any);
    return () => window.removeEventListener('chatUnreadUpdated', handler as any);
  }, []);

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-gray-200 z-50 transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">A</span>
              </div>
              <div>
                <h2 className="text-gray-900">Ashford</h2>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {baseMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                    if (item.id === 'chat') setChatUnread(0);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left text-sm">{item.label}</span>
                  {item.id === 'chat' && chatUnread > 0 && (
                    <Badge variant="secondary" className="bg-red-500 text-white text-xs">
                      {chatUnread}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Admin Profile */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <Avatar className="w-10 h-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-blue-600 text-white">AD</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">Admin User</p>
                <p className="text-xs text-gray-500">admin@ashford.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full lg:w-auto min-h-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex-shrink-0">
          <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
            {/* Left: Menu Button + Search */}
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-700 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Right: Dark Mode, Notifications, Profile */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        AD
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-gray-600 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className={`flex-1 p-4 lg:p-6 ${currentPage === 'chat'
            ? 'overflow-hidden flex flex-col min-h-0 h-full'
            : 'overflow-auto'}`}
        >
          <div
            className={`max-w-7xl mx-auto w-full ${currentPage === 'chat'
              ? 'flex-1 flex flex-col min-h-0 h-full'
              : ''}`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
