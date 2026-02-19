import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderPlus,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "New Project", path: "/project/new", icon: FolderPlus },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <ThemeToggle />
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
