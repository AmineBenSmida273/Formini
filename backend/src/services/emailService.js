
const nodemailer = require('nodemailer');

const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 465;
const SMTP_USER = "aminebensmida46@gmail.com";
const SMTP_PASS = "fqycqeyobqepbqax"; 
const FROM_EMAIL = "aminebensmida46@gmail.com";

const createTransporter = () => {
  if (!SMTP_USER || !SMTP_PASS) {
    console.log("⚠️  Mode console activé — SMTP manquant");
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT == 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: { rejectUnauthorized: false }
  });
};

exports.sendVerificationCode = async (email, code) => {

  console.log("\n" + "🔐".repeat(20));
  console.log("🎯 CODE MFA POUR " + email);
  console.log("🔐 " + code);
  console.log("⏱️  Valable 10 minutes");
  console.log("🔐".repeat(20) + "\n");

  if (!SMTP_USER || !SMTP_PASS) {
    console.log("💡 SMTP non configuré — Mode console activé");
    return true;
  }

  try {
    const transporter = createTransporter();
    if (!transporter) return true;

    await transporter.verify();
    console.log("✅ Connexion SMTP OK");

    const mailOptions = {
      from: `Formini <${FROM_EMAIL}>`,
      to: email,
      subject: "Formini - Code de Vérification MFA",
      attachments: [{
        filename: 'logo.png',
        path: 'C:/Users/MSI/Desktop/Formini/frontend/src/assets/images/logo.png',
        cid: 'formini_logo'
      }],
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; background: #d26111ff; color: white; padding: 20px;">
            <img src="cid:formini_logo" alt="Formini" style="width:120px;" />
            <p style="margin:5px 0 0 0;">Vérification de compte</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #1f2937;">Votre code de vérification</h2>
            <p>Bonjour, voici votre code :</p>
            <div style="background:#f97316; color:white; padding:20px; font-size:32px; text-align:center; letter-spacing:8px; border-radius:10px; margin:20px 0; font-family:monospace;">
              ${code}
            </div>
            <p style="color:#6b7280; font-size:14px;">
              ⏱️ Code valide 10 minutes<br>
              🔒 Ne le partagez avec personne.
            </p>
          </div>
          <div style="text-align:center; padding:20px; border-top:1px solid #ddd; color:#999; font-size:12px;">
            Formini Platform
          </div>
        </div>
      `
    };


    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé →", email);
    console.log("📨 Message ID:", info.messageId);

    return true;

  } catch (error) {
    console.log("❌ Erreur SMTP:", error.message);
    console.log("💡 Le code a été affiché — Mode fallback OK");

    return true;
  }
};

// Envoyer email à l'admin pour demande d'approbation formateur
exports.sendInstructorApprovalRequest = async (instructor) => {
  console.log("\n" + "📧".repeat(20));
  console.log("📨 DEMANDE D'APPROBATION FORMATEUR");
  console.log(`👤 Formateur: ${instructor.prenom} ${instructor.nom}`);
  console.log(`📧 Email: ${instructor.email}`);
  console.log(`🏢 Centre: ${instructor.centreProfession}`);
  console.log("📧".repeat(20) + "\n");

  if (!SMTP_USER || !SMTP_PASS) {
    console.log("💡 SMTP non configuré — Mode console activé");
    return true;
  }

  try {
    const transporter = createTransporter();
    if (!transporter) return true;

    // Utiliser l'email de l'admin unique depuis la config
    const { ADMIN_EMAIL } = require('../utils/adminConfig');
    const adminEmail = ADMIN_EMAIL;

    const mailOptions = {
      from: `Formini <${FROM_EMAIL}>`,
      to: adminEmail,
      subject: `Formini - Nouvelle demande d'inscription formateur`,
      attachments: [{
        filename: 'logo.png',
        path: 'C:/Users/MSI/Desktop/Formini/frontend/src/assets/images/logo.png',
        cid: 'formini_logo'
      }],
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; background: #d26111ff; color: white; padding: 20px;">
            <img src="cid:formini_logo" alt="Formini" style="width:120px;" />
            <p style="margin:5px 0 0 0;">Nouvelle demande formateur</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #1f2937;">Demande d'inscription formateur</h2>
            <p>Un nouveau formateur a soumis une demande d'inscription :</p>
            <div style="background:#f9fafb; padding:20px; border-radius:10px; margin:20px 0;">
              <p><strong>Nom:</strong> ${instructor.prenom} ${instructor.nom}</p>
              <p><strong>Email:</strong> ${instructor.email}</p>
              <p><strong>Centre de profession:</strong> ${instructor.centreProfession}</p>
              <p><strong>Date de demande:</strong> ${new Date(instructor.dateDemande).toLocaleDateString('fr-FR')}</p>
            </div>
            <p style="color:#6b7280; font-size:14px;">
              Veuillez examiner la demande et approuver ou rejeter le formateur depuis le dashboard administrateur.
            </p>
            <div style="text-align:center; margin-top:30px;">
              <a href="${process.env.FRONTEND_URL || 'https://formini-front-end.onrender.com'}/dashboard" 
                 style="background:#f97316; color:white; padding:12px 24px; text-decoration:none; border-radius:8px; display:inline-block;">
                Voir le dashboard admin
              </a>
            </div>
          </div>
          <div style="text-align:center; padding:20px; border-top:1px solid #ddd; color:#999; font-size:12px;">
            Formini Platform
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé à l'admin →", adminEmail);
    console.log("📨 Message ID:", info.messageId);

    return true;

  } catch (error) {
    console.log("❌ Erreur SMTP:", error.message);
    return false;
  }
};

// Envoyer email au formateur pour notification d'approbation/rejet
exports.sendInstructorApprovalNotification = async (instructor, approved) => {
  console.log("\n" + "📧".repeat(20));
  console.log(`📨 NOTIFICATION ${approved ? 'APPROBATION' : 'REJET'} FORMATEUR`);
  console.log(`👤 Formateur: ${instructor.prenom} ${instructor.nom}`);
  console.log(`📧 Email: ${instructor.email}`);
  console.log("📧".repeat(20) + "\n");

  if (!SMTP_USER || !SMTP_PASS) {
    console.log("💡 SMTP non configuré — Mode console activé");
    return true;
  }

  try {
    const transporter = createTransporter();
    if (!transporter) return true;

    const mailOptions = {
      from: `Formini <${FROM_EMAIL}>`,
      to: instructor.email,
      subject: `Formini - ${approved ? 'Demande approuvée' : 'Demande rejetée'}`,
      attachments: [{
        filename: 'logo.png',
        path: 'C:/Users/MSI/Desktop/Formini/frontend/src/assets/images/logo.png',
        cid: 'formini_logo'
      }],
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; background: ${approved ? '#10b981' : '#ef4444'}; color: white; padding: 20px;">
            <img src="cid:formini_logo" alt="Formini" style="width:120px;" />
            <p style="margin:5px 0 0 0;">${approved ? 'Demande approuvée' : 'Demande rejetée'}</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #1f2937;">${approved ? '✅ Votre demande a été approuvée' : '❌ Votre demande a été rejetée'}</h2>
            <p>Bonjour ${instructor.prenom},</p>
            <p>${approved 
              ? 'Félicitations ! Votre demande d\'inscription en tant que formateur a été approuvée par l\'administrateur. Vous pouvez maintenant vous connecter et commencer à créer des cours.'
              : 'Nous sommes désolés, mais votre demande d\'inscription en tant que formateur a été rejetée. Pour plus d\'informations, veuillez contacter l\'administrateur.'}
            </p>
            ${approved ? `
              <div style="text-align:center; margin-top:30px;">
                <a href="${process.env.FRONTEND_URL || 'https://formini-front-end.onrender.com'}/login" 
                   style="background:#f97316; color:white; padding:12px 24px; text-decoration:none; border-radius:8px; display:inline-block;">
                  Se connecter
                </a>
              </div>
            ` : ''}
          </div>
          <div style="text-align:center; padding:20px; border-top:1px solid #ddd; color:#999; font-size:12px;">
            Formini Platform
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé au formateur → ${instructor.email}`);
    console.log("📨 Message ID:", info.messageId);

    return true;

  } catch (error) {
    console.log("❌ Erreur SMTP:", error.message);
    return false;
  }
};
