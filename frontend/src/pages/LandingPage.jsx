import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MessageCircle, Building2, ArrowRight, LogIn, Check, Zap, Shield, Users, Gift, CreditCard, Sparkles, Clock } from "lucide-react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToPricing = () => {
    document.getElementById("pricing").scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                TamVaktinde
              </span>
              <span className="text-xs text-slate-400 font-medium">by Nxa</span>
            </div>
            <Link
              to="/login"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-200"
            >
              <LogIn className="w-4 h-4" />
              Sisteme Giriş Yap
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-8 tracking-tight">
              İşletmenizi
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
                Tam Vaktinde Yönetin
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Randevu, müşteri yönetimi ve otomatik hatırlatıcılar tek bir ekranda. İşletmenizi büyütmek için ihtiyacınız olan tüm araçlar.
            </p>
            <button
              onClick={scrollToPricing}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-3 mx-auto shadow-xl shadow-blue-200 hover:shadow-blue-300"
            >
              Hemen Başla
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Güçlü Özellikler
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              İşletmenizi bir adım öne taşıyacak kapsamlı çözümler
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Kusursuz Randevu Yönetimi</h3>
              <p className="text-slate-600 leading-relaxed">
                Müşterilerinize 7/24 online randevu alma imkanı sunun. Akıllı takvim ve çakışma kontrolü ile randevularınızı profesyonelce yönetin.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Personel ve Takvim</h3>
              <p className="text-slate-600 leading-relaxed">
                Ekibinizdeki her personelin kendi çalışma saatlerini ve takvimini yönetin. Randevuları otomatik olarak uygun personele atayın.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Otomatik Hatırlatıcılar</h3>
              <p className="text-slate-600 leading-relaxed">
                Randevu öncesi WhatsApp ve SMS bildirimleriyle 'gelmeyen müşteri' sorununu bitirin. Randevu kaçırma oranlarını %80 azaltın.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">CRM ve Sadakat Programı</h3>
              <p className="text-slate-600 leading-relaxed">
                Müşterilerinize puanlar kazandırın, indirim kodları (Örn: NXA-1234) oluşturun. Sadakat programı ile müşteri bağlılığını artırın.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Bayi ve Şube Altyapısı</h3>
              <p className="text-slate-600 leading-relaxed">
                Kendi satış ağınızı kurun, komisyonlarınızı otomatik yönetin. Birden fazla şubeyi tek panelden merkezi olarak kontrol edin.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Güvenli Online Ödeme</h3>
              <p className="text-slate-600 leading-relaxed">
                PayTR entegrasyonu ile hizmetlerinizin ödemesini anında ve güvenle alın. Online ödeme seçenekleriyle gelirlerinizi artırın.
              </p>
            </div>

            {/* Feature 7 - Coming Soon */}
            <div className="group p-8 bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-full">
                Avantaj Özellik
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Yapay Zeka Stüdyosu</h3>
              <p className="text-slate-600 leading-relaxed">
                Sosyal medya görsellerinizi ve kampanyalarınızı saniyeler içinde AI ile üretin. Profesyonel içerik oluşturma artık çok kolay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Size Uygun Paket
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              İşletmenizin ihtiyaçlarına göre esnek paket seçenekleri
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Fiziksel Plan */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Fiziksel</h3>
                <p className="text-slate-600 text-sm">Mağaza ve salonlar için ideal</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold text-slate-900">₺15.000</span>
                <span className="text-slate-600">/yıl</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Sınırsız randevu yönetimi</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">WhatsApp hatırlatıcıları</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Tek şube desteği</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Müşteri takip sistemi</span>
                </li>
              </ul>
              <a
                href="https://nxa.com.tr/checkout?product=tamvaktinde&plan=fiziksel"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 text-center shadow-lg shadow-blue-200"
              >
                Satın Al
              </a>
            </div>

            {/* Online Plan - Featured */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 relative hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-lg">
                En Popüler
              </div>
              <div className="mb-8">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Online</h3>
                <p className="text-blue-100 text-sm">Online hizmet verenler için</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold text-white">₺13.000</span>
                <span className="text-blue-100">/yıl</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-blue-50">Tüm Fiziksel özellikleri</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-blue-50">Google Meet entegrasyonu</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-blue-50">Online ödeme sistemi</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-blue-50">Özel randevu linki</span>
                </li>
              </ul>
              <a
                href="https://nxa.com.tr/checkout?product=tamvaktinde&plan=online"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-6 py-3 bg-white hover:bg-blue-50 text-blue-900 font-medium rounded-lg transition-all duration-200 text-center shadow-lg"
              >
                Satın Al
              </a>
            </div>

            {/* Full Plan */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Full</h3>
                <p className="text-slate-600 text-sm">Büyük işletmeler için kapsamlı</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold text-slate-900">₺20000</span>
                <span className="text-slate-600">/yıl</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Tüm Online özellikleri</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Sınırsız şube desteği</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Bayi/Personel yönetimi</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Özel API erişimi</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Öncelikli destek</span>
                </li>
              </ul>
              <a
                href="https://nxa.com.tr/checkout?product=tamvaktinde&plan_full"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 text-center shadow-lg shadow-blue-200"
              >
                Satın Al
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-semibold">TamVaktinde</span>
                <p className="text-slate-400 text-sm">by Nxa</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm">
              © 2024 TamVaktinde. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
