const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getUploadPath, UPLOADS_ROOT } = require('../utils/fileManager');

// ─── Storage dinâmico por business_id ────────────────────────────────────────
const storageFactory = (type) =>
    multer.diskStorage({
        destination: (req, file, cb) => {
            // businessId vem de req.params ou req.user (para clientes)
            const businessId = req.params.businessId || req.params.id || req.user?.businessId;
            if (!businessId) return cb(new Error('ID do negócio não encontrado para upload.'));
            const dest = getUploadPath(businessId, type);
            cb(null, dest);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const safeName = type === 'logo' ? `logo${ext}` : `${uuidv4()}${ext}`;
            cb(null, safeName);
        },
    });

// ─── Filtro: apenas imagens ───────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.'), false);
    }
};

// ─── Upload de logo ───────────────────────────────────────────────────────────
const uploadLogo = multer({
    storage: storageFactory('logo'),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: imageFilter,
}).single('logo');

// ─── Upload de banner (destaques) ───────────────────────────────────────────
const uploadBanner = multer({
    storage: storageFactory('banner'),
    limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
    fileFilter: imageFilter,
}).single('banner');

// ─── Upload de galeria (múltiplos arquivos) ───────────────────────────────────
const uploadGallery = multer({
    storage: storageFactory('gallery'),
    limits: { fileSize: 10 * 1024 * 1024, files: 20 }, // 10 MB cada, máx 20
    fileFilter: imageFilter,
}).array('images', 20);

// ─── Wrapper com tratamento de erro ──────────────────────────────────────────
function wrapMulter(uploadFn) {
    return (req, res, next) => {
        uploadFn(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: `Erro no upload: ${err.message}` });
            } else if (err) {
                return res.status(400).json({ error: err.message });
            }
            next();
        });
    };
}

module.exports = {
    uploadLogo: wrapMulter(uploadLogo),
    uploadBanner: wrapMulter(uploadBanner),
    uploadGallery: wrapMulter(uploadGallery),
};
