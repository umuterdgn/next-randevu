import { loginUser } from "../services/auth.service.js";
import { logAudit } from "../services/audit.service.js";
import { User } from "../models/User.js";
import { Business } from "../models/Business.js";
import { Staff } from "../models/Staff.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const login = async (req, res) => {
  try {
    const result = await loginUser(req.body);

    await logAudit({
      business_id: result.user.business_id,
      user_id: result.user._id || result.user.id,
      action: "LOGIN_SUCCESS",
      method: req.method,
      path: req.originalUrl,
      status_code: 200,
      ip: req.ip || "",
      user_agent: req.headers["user-agent"] || "",
    });

    // --- EKLENEN HAYATİ KISIM (COOKIE AYARI) ---
    // Eğer login başarılıysa ve token döndüyse, bunu güvenli çerez olarak tarayıcıya ver
    if (result.token) {
      res.cookie('token', result.token, {
        httpOnly: true,       // XSS saldırılarına karşı koruma
        secure: true,         // Vercel (HTTPS) canlı ortamı için zorunlu
        sameSite: 'none',     // Farklı Vercel domainleri arası iletişime izin verir
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Gün
      });
    }
    // -------------------------------------------

    res.json(result);
  } catch (error) {
    await logAudit({
      business_id: "saas_root",
      action: "LOGIN_FAILED",
      method: req.method,
      path: req.originalUrl,
      status_code: error.statusCode || 401,
      ip: req.ip || "",
      user_agent: req.headers["user-agent"] || "",
      meta: { email: req.body?.email || "" },
    });

    res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || "E-posta veya şifre hatalı!"
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    
    // For security, always return success even if user doesn't exist
    if (!user) {
      return res.json({ 
        success: true, 
        message: "Eğer bu e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi." 
      });
    }

    // Generate reset token using model method
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'https://tamvaktinde.com.tr'}/reset-password/${resetToken}`;

    // Create HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Şifre Sıfırlama - Nexa</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3B82F6;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background-color: #3B82F6;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Nexa</div>
          <h2>Şifre Sıfırlama Talebi</h2>
          <p>Nexa hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
          <p>Aşağıdaki bağlantıya tıklayarak yeni şifrenizi belirleyebilirsiniz.</p>
          <p>Bu bağlantı 15 dakika süreyle geçerlidir.</p>
          <a href="${resetUrl}" class="button">Şifremi Sıfırla</a>
          <p>Eğer bu talebi siz oluşturmadıysanız, bu e-postayı yoksayabilirsiniz.</p>
          <div class="footer">
            <p>&copy; 2026 Nexa. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using utility function
    await sendEmail({
      email: user.email,
      subject: "Şifre Sıfırlama - Nexa",
      html: htmlContent,
    });

    res.json({ 
      success: true, 
      message: "Eğer bu e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi." 
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin." 
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the token from URL to compare with stored token
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı."
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Şifreniz başarıyla sıfırlandı. Şimdi giriş yapabilirsiniz."
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."
    });
  }
};

export const ssoLogin = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "SSO token gerekli"
      });
    }

    // Verify SSO token from nxa.com.tr
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SSO_SECRET_KEY || process.env.JWT_SECRET);
    } catch (error) {
      console.error("SSO token verification failed:", error);
      return res.status(401).json({
        success: false,
        message: "Geçersiz veya süresi dolmuş SSO token"
      });
    }

    const { email, name, phone, planType } = decoded;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Token içinde e-posta bulunamadı"
      });
    }

    // Check if Business exists with this email
    let business = await Business.findOne({ email });

    // Check if User exists with this email (for any business)
    let user = await User.findOne({ email });

    // If User doesn't exist, create it automatically
    if (!user) {
      // Generate random secure password
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Create user without business_id initially (will be set after Business creation)
      user = await User.create({
        business_id: 'pending', // Temporary business_id
        business_ref: null,
        name: name || 'İşletme Sahibi',
        email: email,
        phone: phone || '',
        password: hashedPassword,
        role: 'owner',
        is_active: true,
        sso_plan_type: planType || 'physical' // Store plan type from SSO
      });

      console.log("Auto-created User for SSO:", user.email);
    } else {
      // Update existing user with plan type if provided
      if (planType && !user.sso_plan_type) {
        user.sso_plan_type = planType;
        await user.save();
      }
    }

    // Generate JWT token for this application
    const tokenPayload = {
      id: user._id,
      role: user.role,
      business_id: user.business_id,
    };

    const appToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        issuer: process.env.JWT_ISSUER || "saas-appointments",
        audience: process.env.JWT_AUDIENCE || "saas-appointments-client",
        algorithm: "HS256",
      }
    );

    // Set cookie
    res.cookie('token', appToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Gün
    });

    // Log audit
    await logAudit({
      business_id: user.business_id,
      user_id: user._id,
      action: "SSO_LOGIN_SUCCESS",
      method: req.method,
      path: req.originalUrl,
      status_code: 200,
      ip: req.ip || "",
      user_agent: req.headers["user-agent"] || "",
    });

    user.password = undefined;

    // Determine redirect based on Business existence
    const redirectPath = business ? '/business' : '/apply';

    res.json({
      success: true,
      user,
      token: appToken,
      redirect: redirectPath,
      hasBusiness: !!business
    });
  } catch (error) {
    console.error("SSO login error:", error);
    res.status(500).json({
      success: false,
      message: "SSO girişi sırasında bir hata oluştu"
    });
  }
};

export const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "E-posta ve şifre gereklidir"
      });
    }

    // Find staff member by email - NO populate calls
    const staff = await Staff.findOne({ email }).lean();

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Geçersiz e-posta veya şifre"
      });
    }

    // Check if staff is active
    if (!staff.is_active) {
      return res.status(401).json({
        success: false,
        message: "Hesabınız devre dışı bırakılmış"
      });
    }

    // Handle legacy staff accounts without password
    if (!staff.password) {
      return res.status(400).json({
        success: false,
        message: "Bu personelin şifresi ayarlanmamış. Lütfen işletme panelinden bu personeli güncelleyerek bir şifre belirleyin."
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, staff.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Geçersiz e-posta veya şifre"
      });
    }

    // Generate JWT token
    const tokenPayload = {
      id: staff._id,
      role: 'staff',
      business_id: staff.business_id,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        issuer: process.env.JWT_ISSUER || "saas-appointments",
        audience: process.env.JWT_AUDIENCE || "saas-appointments-client",
        algorithm: "HS256",
      }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Gün
    });

    // Log audit
    await logAudit({
      business_id: staff.business_id,
      user_id: staff._id,
      action: "STAFF_LOGIN_SUCCESS",
      method: req.method,
      path: req.originalUrl,
      status_code: 200,
      ip: req.ip || "",
      user_agent: req.headers["user-agent"] || "",
    });

    // Remove password from response
    delete staff.password;

    res.json({
      success: true,
      user: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: 'staff',
        business_id: staff.business_id,
      },
      token,
    });
  } catch (error) {
    console.error("Staff login error:", error);
    await logAudit({
      business_id: "unknown",
      action: "STAFF_LOGIN_FAILED",
      method: req.method,
      path: req.originalUrl,
      status_code: 401,
      ip: req.ip || "",
      user_agent: req.headers["user-agent"] || "",
      meta: { email: req.body?.email || "" },
    });

    res.status(401).json({
      success: false,
      message: "Giriş başarısız"
    });
  }
};
