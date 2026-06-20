import { useEffect, useState } from "react";
import { Menu, LogOut } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen md:flex">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        user={user}
      />
      <main className="flex-1 p-3 pt-4 sm:p-4 sm:pt-5 md:p-6 lg:p-8">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm shadow-slate-200/70 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold md:text-xl">
              {user?.role === "owner" ? "SaaS Admin Panel" : "Business Panel"}
            </h1>
            <p className="text-xs text-slate-500 md:text-sm">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-soft md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <Menu className="h-4 w-4" />
            </button>
            <button className="btn-dark" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        </header>
        <div className="space-y-4">{children}</div>
      </main>
    </div>
  );
}
