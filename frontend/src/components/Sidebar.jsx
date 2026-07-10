import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
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
  MessageCircle,
} from "lucide-react";
import api from "../api/client";
import Modal from "./Modal";

const Item = ({ to, label, icon: Icon, collapsed, onNavigate, requiresFull, requiresEnterprise, businessData }) => {
  const { pathname } = useLocation();
  const active = pathname.startsWith(to);
  const isLocked = requiresFull && businessData?.plan !== 'full';
  const isEnterpriseLocked = requiresEnterprise && businessData?.plan !== 'enterprise';

  const handleClick = (e) => {
    if (isLocked) {
      e.preventDefault();
      toast.error("Personel Yönetimi özelliği yalnızca Full Paket'te mevcuttur. Paket yüksetmek için lütfen Ayarlar sayfasını ziyaret edin.");
      return;
    }
    if (isEnterpriseLocked) {
      e.preventDefault();
      toast.error("Şube yönetimi özelliği yalnızca Enterprise paketinde mevcuttur.");
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
        }`}
    >
      <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${active ? "scale-105" : "group-hover:scale-105"}`} />

      {/* MOBİL UYUM: Sadece masaüstünde (md) daraltılmışsa yazıyı gizle, mobilde her zaman göster */}
      <span className={`truncate whitespace-nowrap transition-opacity duration-200 ${collapsed ? "md:hidden" : "block"}`}>
        {label} {isLocked && "🔒"} {isEnterpriseLocked && "🔒"}
      </span>
    </Link>
  );
};

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, user, businessData }) {
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);

  const handleSendSupport = async () => {
    if (!supportMessage.trim()) {
      toast.error("Lütfen bir mesaj girin.");
      return;
    }

    try {
      setSendingSupport(true);
      const { data } = await api.post("/support", { message: supportMessage });
      if (data.success) {
        toast.success("Destek talebiniz başarıyla gönderildi!");
        setShowSupportModal(false);
        setSupportMessage("");
      }
    } catch (error) {
      console.error("Support submission error:", error);
      toast.error("Destek talebi gönderilirken hata oluştu.");
    } finally {
      setSendingSupport(false);
    }
  };

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
    { to: "/business/branches", label: "Şubelerim", icon: Building2, requiresEnterprise: true },
    { to: "/business/finance", label: "Finance", icon: DollarSign },
    { to: "/business/cari", label: "Cari Hesaplar", icon: Wallet },
    { to: "/business/inventory", label: "Stok Yönetimi", icon: Package },
    { to: "/business/campaigns", label: "AI Campaigns", icon: Megaphone },
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
              requiresEnterprise={m.requiresEnterprise}
              businessData={businessData}
            />
          ))}
        </nav>

        {/* Support Button */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <button
            onClick={() => setShowSupportModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            <span className={`truncate whitespace-nowrap ${collapsed ? "md:hidden" : "block"}`}>
              Destek & Öneri
            </span>
          </button>
        </div>
      </aside>

      {/* Support Modal */}
      <Modal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} title="Destek & Öneri">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mesajınız *
            </label>
            <textarea
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              className="input w-full h-32 resize-none"
              placeholder="Sorunuzu veya önerinizi buraya yazın..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setShowSupportModal(false);
                setSupportMessage("");
              }}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              disabled={sendingSupport}
            >
              İptal
            </button>
            <button
              onClick={handleSendSupport}
              disabled={sendingSupport}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-50"
            >
              {sendingSupport ? "Gönderiliyor..." : "Gönder"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}