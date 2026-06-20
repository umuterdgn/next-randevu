import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
// import User from "@/models/User"; // Hedef uygulamanın kendi veritabanı modeli
// import { connectMongoDB } from "@/lib/mongodb";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=bilet-yok", req.url));
  }

  try {
    // 1. Nexa ile aynı gizli anahtarı kullanarak şifreyi çözüyoruz
    const secretKey = process.env.SSO_SECRET_KEY; // Nexa'daki şifrenin aynısı!
    const decoded = jwt.verify(token, secretKey) as any;

    // Şifre başarıyla çözüldüyse biletin içindeki bilgilere ulaştık demektir:
    // decoded.email, decoded.name, decoded.nexaUserId

    // 2. Veritabanı Kontrolü (Hedef uygulamanın kendi DB'si)
    // await connectMongoDB();
    // let user = await User.findOne({ email: decoded.email });
    
    // if (!user) {
    //   Kullanıcı ilk defa geliyorsa Nexa'dan gelen bilgilerle anında hesap aç:
    //   user = await User.create({ name: decoded.name, email: decoded.email, role: "user" });
    // }

    // 3. Kullanıcıyı İçeri Al (Oturum Açma)
    // Hedef uygulamada NextAuth kullanıyorsan burada özel bir session cookie oluşturulur 
    // veya doğrudan Dashboard'a fırlatılır.

    // Başarılı giriş sonrası yönlendirme:
    return NextResponse.redirect(new URL("/dashboard", req.url));

  } catch (error) {
    console.error("Geçersiz veya süresi dolmuş bilet:", error);
    return NextResponse.redirect(new URL("/login?error=yetkisiz-erisim", req.url));
  }
}