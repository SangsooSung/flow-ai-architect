import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderPlus,
  Video,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "New Project", path: "/project/new", icon: FolderPlus },
  { label: "Meetings", path: "/meetings", icon: Video },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userInitial = user?.user_metadata?.full_name?.[0] ||
    user?.email?.[0]?.toUpperCase() || "?";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2.5">
              {theme === 'dark' ? (
                <img
                  src="/flow-logo-white.png"
                  alt="Flow AI"
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <img
                  src="/flow-logo.png"
                  alt="Flow AI"
                  className="h-8 w-auto object-contain"
                />
              )}
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400 tracking-widest uppercase leading-none mt-0.5">
                  AI Architect
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />

            {/* User Avatar + Sign Out */}
            <div className="relative group">
              <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-muted/60 transition-colors">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-7 h-7 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {userInitial}
                  </div>
                )}
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.user_metadata?.full_name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors rounded-b-xl"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <nav className="bg-background border-b border-border shadow-xl p-3 space-y-1" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                signOut();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
