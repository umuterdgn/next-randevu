import { Link, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
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
  Settings,
  Package,
  Crown,
} from "lucide-react";

const Item = ({ to, label, icon: Icon, collapsed, onNavigate, requiresFull, businessPlan }) => {
  const { pathname } = useLocation();
  const active = pathname.startsWith(to);
  const isLocked = requiresFull && businessPlan !== 'full';

  const handleClick = (e) => {
    if (isLocked) {
      e.preventDefault();
      toast.error("Bu özellik Full Paket'e özeldir. Erişmek için lütfen Sisteminizi yükseltin.", {
        duration: 4000,
        icon: <Crown className="w-5 h-5 text-amber-500" />,
      });
      return;
    }
    onNavigate();
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden ${active
          ? "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        } ${isLocked ? "opacity-60" : ""}`}
    >
      <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${active ? "scale-105" : "group-hover:scale-105"}`} />

      {/* MOBİL UYUM: Sadece masaüstünde (md) daraltılmışsa yazıyı gizle, mobilde her zaman göster */}
      <span className={`truncate whitespace-nowrap transition-opacity duration-200 ${collapsed ? "md:hidden" : "block"}`}>
        {label}
      </span>

      {isLocked && !collapsed && (
        <Crown className="h-4 w-4 text-amber-500 shrink-0 ml-auto" />
      )}
    </Link>
  );
};

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, user, businessPlan }) {
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
    { to: "/business/staff", label: "Personel Yönetimi", icon: Users, requiresFull: true },
    { to: "/business/finance", label: "Finance", icon: DollarSign },
    { to: "/business/cari", label: "Cari Hesaplar", icon: Wallet },
    { to: "/business/inventory", label: "Stok Yönetimi", icon: Package, requiresFull: true },
    { to: "/business/campaigns", label: "AI Campaigns", icon: Megaphone, requiresFull: true },
    { to: "/business/settings", label: "Ayarlar", icon: Settings },
  ];

  const menu = user?.role === "owner" ? ownerMenu : bizMenu;

  return (
    <>
      {/* Mobil Arka Plan Karartması */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar Konteyneri - Genişlik çakışmaları düzeltildi */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen border-r border-slate-200/70 bg-white p-4 backdrop-blur-xl transition-all duration-300 
          w-72 md:sticky md:translate-x-0 ${collapsed ? "md:w-20" : "md:w-72"} 
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="mb-6 flex items-center justify-between">
          <p className={`text-sm font-semibold text-slate-500 truncate whitespace-nowrap ${collapsed ? "md:hidden" : "block"}`}>
            Navigation
          </p>
          <button className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 md:hidden shrink-0" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Masaüstü Daraltma/Genişletme Butonu */}
        <button
          className="btn-soft mb-4 hidden w-full md:flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "Aç" : "Daralt"}
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
              requiresFull={m.requiresFull}
              businessPlan={businessPlan}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}