import { useEffect, useState } from "react";
import { Package, Plus, Edit, Trash2, Save, X, Award } from "lucide-react";
import { toast } from "react-toastify";
import { getProducts, addProduct, updateProduct, deleteProduct } from "../api/product";
import api from "../api/client";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    stock: 0,
    unit: "adet",
  });
  const [businessData, setBusinessData] = useState(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Ürünler yüklenirken hata:", error);
      toast.error("Ürünler yüklenirken hata oluştu");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const response = await api.get("/business/settings");
        setBusinessData(response.data);
      } catch (error) {
        console.error("Business data fetch error:", error);
      } finally {
        setLoadingBusiness(false);
      }
    };
    fetchBusinessData();
  }, []);

  const handleUpgradePlan = async (plan) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    const nxaDomain = process.env.REACT_APP_NXA_DOMAIN || "https://nxa.example.com";
    const redirectUrl = `${nxaDomain}/sso?auth_token=${token}&redirect_to=/checkout?productId=plan_${plan}`;
    
    window.location.href = redirectUrl;
  };

  if (loadingBusiness) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Yükleniyor...</div>
      </div>
    );
  }

  if (businessData?.plan !== 'full') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-violet-200">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">Full Paket Gerekli</h1>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Bu özellik Full Paket'e özeldir. Stok yönetimi gibi premium özelliklere erişmek için paketinizi yükseltin.
          </p>
          <button
            onClick={() => handleUpgradePlan('full')}
            className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Award className="w-5 h-5" />
            Full Pakete Yükselt
          </button>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({ name: "", stock: 0, unit: "adet" });
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      stock: product.stock,
      unit: product.unit,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct._id, formData);
        toast.success("Ürün güncellendi");
      } else {
        await addProduct(formData);
        toast.success("Ürün eklendi");
      }
      setShowModal(false);
      loadProducts();
    } catch (error) {
      console.error("Ürün kaydedilirken hata:", error);
      toast.error(editingProduct ? "Ürün güncellenemedi" : "Ürün eklenemedi");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
      return;
    }
    try {
      await deleteProduct(id);
      toast.success("Ürün silindi");
      loadProducts();
    } catch (error) {
      console.error("Ürün silinirken hata:", error);
      toast.error("Ürün silinemedi");
    }
  };

  const handleQuickStockUpdate = async (id, newStock) => {
    try {
      const product = products.find(p => p._id === id);
      await updateProduct(id, { ...product, stock: parseInt(newStock) });
      toast.success("Stok güncellendi");
      loadProducts();
    } catch (error) {
      console.error("Stok güncellenirken hata:", error);
      toast.error("Stok güncellenemedi");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Envanter Yönetimi</h1>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ürün Ekle
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürün Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Birim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    Henüz ürün eklenmemiş
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={product.stock}
                        onChange={(e) => handleQuickStockUpdate(product._id, e.target.value)}
                        className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          product.stock > 10
                            ? "bg-green-100 text-green-800"
                            : product.stock > 0
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.stock > 10
                          ? "Stokta"
                          : product.stock > 0
                          ? "Kritik"
                          : "Tükendi"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingProduct ? "Ürün Düzenle" : "Yeni Ürün"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Adı
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok Miktarı
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birim
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="adet">Adet</option>
                    <option value="kg">Kg</option>
                    <option value="litre">Litre</option>
                    <option value="metre">Metre</option>
                    <option value="paket">Paket</option>
                    <option value="kutu">Kutu</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {editingProduct ? "Güncelle" : "Kaydet"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
