import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Trash2,
  Edit2,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import Modal, { ConfirmModal } from "../components/Modal";

export default function Branches() {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    address: "",
  });

  const loadBranches = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/business/branches");
      if (data.success) {
        setBranches(data.branches || []);
      }
    } catch (error) {
      console.error("Branches load error:", error);
      toast.error("Şubeler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/business/branches", branchForm);
      if (data.success) {
        toast.success("Şube başarıyla oluşturuldu!");
        setShowCreateModal(false);
        setBranchForm({ name: "", phone: "", email: "", city: "", address: "" });
        loadBranches();
      }
    } catch (error) {
      console.error("Branch creation error:", error);
      toast.error(error.response?.data?.message || "Şube oluşturulurken hata oluştu.");
    }
  };

  const handleDeleteBranch = async () => {
    if (!selectedBranch) return;
    try {
      // Note: Delete endpoint not implemented yet, placeholder
      toast.success("Şube silme özelliği yakında eklenecek.");
      setShowDeleteModal(false);
      setSelectedBranch(null);
    } catch (error) {
      console.error("Branch deletion error:", error);
      toast.error("Şube silinirken hata oluştu.");
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Şubelerim</h1>
            <p className="text-slate-600">Enterprise paketi ile çoklu şube yönetimi</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Yeni Şube Ekle
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : branches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Henüz Şube Yok</h3>
            <p className="text-slate-500 mb-6">İlk şubenizi oluşturarak çoklu şube yönetimine başlayın.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              İlk Şubeyi Oluştur
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
              <div
                key={branch.business_id}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBranch(branch);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{branch.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {branch.phone}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {branch.email}
                  </div>
                  {branch.city && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {branch.city}
                    </div>
                  )}
                  {branch.address && (
                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <span className="line-clamp-2">{branch.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(branch.createdAt).toLocaleDateString("tr-TR")}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      branch.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {branch.is_active ? "Aktif" : "Pasif"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Branch Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Yeni Şube Oluştur">
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Şube Adı *
            </label>
            <input
              type="text"
              required
              value={branchForm.name}
              onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
              className="input w-full"
              placeholder="Örn: Kadıköy Şubesi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Telefon *
            </label>
            <input
              type="tel"
              required
              value={branchForm.phone}
              onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
              className="input w-full"
              placeholder="05551234567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              E-posta
            </label>
            <input
              type="email"
              value={branchForm.email}
              onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
              className="input w-full"
              placeholder="sube@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Şehir
            </label>
            <input
              type="text"
              value={branchForm.city}
              onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
              className="input w-full"
              placeholder="İstanbul"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Adres
            </label>
            <textarea
              value={branchForm.address}
              onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
              className="input w-full h-24 resize-none"
              placeholder="Mahalle, Sokak No..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition-all"
            >
              Şube Oluştur
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Branch Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBranch(null);
        }}
        onConfirm={handleDeleteBranch}
        title="Şubeyi Sil"
        message={`"${selectedBranch?.name}" şubesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
      />
    </AppLayout>
  );
}
