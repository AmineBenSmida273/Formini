const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../uploads/cvs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Parser multipart/form-data simple sans dépendance externe
function parseMultipart(req, res, next) {
  const contentType = req.headers['content-type'] || '';
  
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  const boundary = contentType.split('boundary=')[1];
  if (!boundary) {
    return res.status(400).json({ message: 'Boundary manquant dans Content-Type' });
  }

  let body = '';
  const chunks = [];

  req.on('data', (chunk) => {
    chunks.push(chunk);
  });

  req.on('end', () => {
    try {
      const buffer = Buffer.concat(chunks);
      const parts = buffer.toString('binary').split('--' + boundary);

      req.body = {};
      let cvFile = null;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part || part.trim() === '' || part.trim() === '--') continue;

        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;

        const headers = part.substring(0, headerEnd);
        const content = part.substring(headerEnd + 4);

        // Extraire le nom du champ
        const nameMatch = headers.match(/name="([^"]+)"/);
        if (!nameMatch) continue;

        const fieldName = nameMatch[1];

        // Vérifier si c'est un fichier
        const filenameMatch = headers.match(/filename="([^"]+)"/);
        
        if (filenameMatch && fieldName === 'cv') {
          // C'est le fichier CV
          const filename = filenameMatch[1];
          
          // Vérifier l'extension
          if (!filename.toLowerCase().endsWith('.pdf')) {
            return res.status(400).json({ 
              message: 'Seuls les fichiers PDF sont autorisés' 
            });
          }

          // Extraire le contenu du fichier (enlever les \r\n de fin)
          const fileContent = content.replace(/\r\n$/, '');
          const fileBuffer = Buffer.from(fileContent, 'binary');

          // Vérifier la taille (5MB max)
          if (fileBuffer.length > 5 * 1024 * 1024) {
            return res.status(400).json({ 
              message: 'Le fichier est trop volumineux (max 5MB)' 
            });
          }

          // Générer un nom de fichier unique
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const email = req.body.email ? req.body.email.split('@')[0] : 'user';
          const newFileName = `${email}-${uniqueSuffix}.pdf`;
          const newFilePath = path.join(uploadsDir, newFileName);

          // Sauvegarder le fichier
          fs.writeFileSync(newFilePath, fileBuffer);
          req.uploadedCV = `/uploads/cvs/${newFileName}`;
        } else {
          // C'est un champ texte normal
          const fieldValue = content.replace(/\r\n$/, '').trim();
          req.body[fieldName] = fieldValue;
        }
      }

      next();
    } catch (error) {
      console.error('Erreur parsing multipart:', error);
      return res.status(500).json({ 
        message: 'Erreur lors du traitement de la requête',
        error: error.message 
      });
    }
  });

  req.on('error', (error) => {
    return res.status(500).json({ 
      message: 'Erreur lors de la réception des données',
      error: error.message 
    });
  });
}

module.exports = {
  uploadMiddleware: parseMultipart,
  validatePDF: (req, res, next) => {
    // La validation est déjà faite dans parseMultipart
    next();
  }
};
