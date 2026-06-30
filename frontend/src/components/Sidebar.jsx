import { Link, useLocation } from "react-router-dom";
import {
  Briefcase,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Megaphone,
  Sparkles,
  Users,
  X,
  Wallet,
  DollarSign,
} from "lucide-react";

const Item = ({ to, label, icon: Icon, collapsed, onNavigate }) => {
  const { pathname } = useLocation();
  const active = pathname.startsWith(to);
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon className={`h-4 w-4 transition-transform duration-200 ${active ? "scale-105" : "group-hover:scale-105"}`} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
};

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, user }) {
  const ownerMenu = [
    { to: "/owner", label: "Owner Dashboard", icon: LayoutDashboard },
    { to: "/owner/applications", label: "Applications", icon: Sparkles },
    { to: "/owner/businesses", label: "Businesses", icon: Building2 },
  ];
  const bizMenu = [
    { to: "/business", label: "Dashboard", icon: LayoutDashboard },
    { to: "/business/services", label: "Services", icon: Briefcase },
    { to: "/business/customers", label: "Customers", icon: Users },
    { to: "/business/appointments", label: "Appointments", icon: CalendarDays },
    { to: "/business/finance", label: "Finance", icon: DollarSign, isTab: true },
    { to: "/business/cari", label: "Cari Hesaplar", icon: Wallet, isTab: true },
    { to: "/business/campaigns", label: "AI Campaigns", icon: Megaphone },
  ];
  const menu = user?.role === "owner" ? ownerMenu : bizMenu;
  const sidebarWidth = collapsed ? "lg:w-20" : "lg:w-72";

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-72 border-r border-slate-200/70 bg-white/95 p-4 backdrop-blur-xl transition-all duration-300 md:sticky md:translate-x-0 ${sidebarWidth} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          {!collapsed && <p className="text-sm font-semibold text-slate-500">Navigation</p>}
          <button className="btn-soft md:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <button className="btn-soft mb-4 hidden w-full lg:flex" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "Expand" : "Collapse"}
        </button>
        <nav className="space-y-2">
        {menu.map((m) => (
            <Item
              key={m.to}
              to={m.to}
              label={m.label}
              icon={m.icon}
              collapsed={collapsed}
              onNavigate={() => setMobileOpen(false)}
            />
        ))}
        </nav>
      </aside>
    </>
  );
}
