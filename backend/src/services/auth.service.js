import { User } from "../models/User.js";
import { createError } from "../utils/appError.js";
// DÜZELTME 1: jsonwebtoken yerine kendi yazdığımız güvenli fonksiyonu çağırıyoruz.
// (Eğer jwt.js dosyan utils klasöründe değilse buradaki yolu projene göre ../utils/jwt.js olarak ayarla)
import { signToken } from "../utils/jwt.js";

export const loginUser = async ({ email, password }) => {
  // DİKKAT: .select("+password") kısmı çok önemli! Şifreyi karşılaştırmak için gizliliği geçici kaldırıyoruz.
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw createError("E-posta veya şifre hatalı!", 401);
  }

  // Şifreler eşleşiyor mu kontrol et
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw createError("E-posta veya şifre hatalı!", 401);
  }

  // DÜZELTME 2: jwt.sign YERİNE signToken KULLANIYORUZ!
  // Artık token oluşturulurken içine otomatik olarak issuer ve audience damgaları vurulacak.
  const token = signToken({
    id: user._id,
    role: user.role,
    business_id: user.business_id,
  });

  // Gönderirken şifreyi objeden çıkar ki frontend'e gitmesin
  user.password = undefined;

  return { user, token };
};
