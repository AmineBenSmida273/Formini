const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../uploads/cvs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware simple pour parser multipart/form-data manuellement
const parseMultipart = (req, res, next) => {
  // Si ce n'est pas une requête multipart, passer au suivant
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  // Pour l'instant, on va utiliser une approche différente
  // On va laisser Express gérer le body et utiliser formidable si disponible
  // Sinon, on va créer une solution simple
  
  // Solution temporaire : on va utiliser busboy si disponible, sinon on va utiliser une approche différente
  try {
    // Essayer d'utiliser formidable (plus fiable que multer)
    const formidable = require('formidable');
    
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      multiples: false
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        return res.status(400).json({ 
          message: 'Erreur lors de l\'upload',
          error: err.message 
        });
      }

      // Convertir fields en objet normal
      req.body = {};
      for (const [key, value] of Object.entries(fields)) {
        req.body[key] = Array.isArray(value) ? value[0] : value;
      }

      // Gérer le fichier CV
      if (files.cv) {
        const file = Array.isArray(files.cv) ? files.cv[0] : files.cv;
        
        // Vérifier que c'est un PDF
        if (file.mimetype !== 'application/pdf' && !file.originalFilename.endsWith('.pdf')) {
          // Supprimer le fichier uploadé
          fs.unlinkSync(file.filepath);
          return res.status(400).json({ 
            message: 'Seuls les fichiers PDF sont autorisés' 
          });
        }

        // Renommer le fichier avec un nom unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const email = req.body.email ? req.body.email.split('@')[0] : 'user';
        const newFileName = `${email}-${uniqueSuffix}.pdf`;
        const newFilePath = path.join(uploadsDir, newFileName);

        fs.renameSync(file.filepath, newFilePath);
        req.uploadedCV = `/uploads/cvs/${newFileName}`;
      }

      next();
    });
  } catch (error) {
    // Si formidable n'est pas disponible, utiliser une solution de base
    console.log('Formidable non disponible, utilisation de la solution de base');
    
    // Solution de base : accepter les données mais ne pas traiter le fichier pour l'instant
    // L'utilisateur devra installer formidable ou multer manuellement
    return res.status(500).json({
      message: 'Module d\'upload non disponible. Veuillez installer formidable: npm install formidable',
      error: 'MODULE_NOT_FOUND'
    });
  }
};

module.exports = {
  uploadMiddleware: parseMultipart,
  validatePDF: (req, res, next) => {
    // La validation est déjà faite dans parseMultipart
    next();
  }
};
