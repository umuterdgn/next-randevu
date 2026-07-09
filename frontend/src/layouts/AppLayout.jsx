import { useEffect, useState } from "react";
import { Menu, LogOut, Clock, Building2, ChevronDown } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useBranchContext } from "../context/BranchContext";
import api from "../api/client";

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { selectedBranch, setSelectedBranch } = useBranchContext();
  const [businessData, setBusinessData] = useState(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [branches, setBranches] = useState([]);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (user?.role === "business" || user?.role === "business_owner") {
        try {
          const response = await api.get("/business/settings");
          setBusinessData(response.data);
        } catch (error) {
          console.error("Business data fetch error:", error);
        } finally {
          setLoadingBusiness(false);
        }
      } else {
        setLoadingBusiness(false);
      }
    };
    fetchBusinessData();
  }, [user]);

  useEffect(() => {
    const fetchBranches = async () => {
      if (businessData?.plan === 'enterprise') {
        try {
          const response = await api.get("/business/branches");
          if (response.data.success) {
            setBranches(response.data.branches || []);
          }
        } catch (error) {
          console.error("Branches fetch error:", error);
        }
      }
    };
    fetchBranches();
  }, [businessData]);

  // Show paywall if business is inactive or payment pending
  if (!loadingBusiness && (user?.role === "business" || user?.role === "business_owner")) {
    if (businessData && (businessData.is_active === false || businessData.payment_status === "pending")) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-3">⏳ Ödeme Bekleniyor</h1>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Hesabınız başarıyla oluşturuldu ancak henüz aktif değil. Kullanıma başlamak için lütfen ödemenizi tamamlayın.
              Eğer ödeme yaptıysanız sistem birkaç dakika içinde otomatik olarak açılacaktır. Destek için bayinizle iletişime geçebilirsiniz.
            </p>
            <button
              onClick={logout}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-medium"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        user={user}
        businessData={businessData}
      />
      <main className="flex-1 p-3 pt-4 sm:p-4 sm:pt-5 md:p-6 lg:p-8">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm shadow-slate-200/70 backdrop-blur">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold md:text-xl">
                {user?.role === "owner" ? "SaaS Admin Panel" : "Business Panel"}
              </h1>
              <p className="text-xs text-slate-500 md:text-sm">{user?.email}</p>
            </div>
            {businessData?.plan === 'enterprise' && branches.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {selectedBranch ? selectedBranch.name : "Tüm Şubeler"}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showBranchDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setSelectedBranch(null);
                          setShowBranchDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          !selectedBranch ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span className="font-medium">Tüm Şubeler (Ana Merkez)</span>
                        </div>
                      </button>
                      {branches.map((branch) => (
                        <button
                          key={branch.business_id}
                          onClick={() => {
                            setSelectedBranch(branch);
                            setShowBranchDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedBranch?.business_id === branch.business_id
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>{branch.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
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
