const fs = require('fs');
const path = require('path');

const UPLOADS_ROOT = process.env.UPLOADS_PATH || '/app/uploads';

/**
 * Deleta um arquivo do disco com segurança.
 * @param {string} relativePath - Caminho relativo a partir de UPLOADS_ROOT
 */
function deleteFile(relativePath) {
    if (!relativePath) return;
    try {
        // Aceita tanto path relativo quanto absoluto
        const fullPath = relativePath.startsWith(UPLOADS_ROOT)
            ? relativePath
            : path.join(UPLOADS_ROOT, relativePath.replace(/^\/uploads\//, ''));

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`[FileManager] Arquivo removido: ${fullPath}`);
        }
    } catch (err) {
        console.error(`[FileManager] Erro ao remover arquivo: ${err.message}`);
    }
}

/**
 * Deleta a pasta inteira de um negócio (logo + galeria).
 * @param {number|string} businessId - ID do negócio
 */
function deleteBusinessFolder(businessId) {
    if (!businessId) return;
    try {
        const folderPath = path.join(UPLOADS_ROOT, String(businessId));
        if (fs.existsSync(folderPath)) {
            fs.rmSync(folderPath, { recursive: true, force: true });
            console.log(`[FileManager] Pasta do negócio ${businessId} removida.`);
        }
    } catch (err) {
        console.error(`[FileManager] Erro ao remover pasta: ${err.message}`);
    }
}

/**
 * Garante que um diretório existe (cria recursivamente se necessário).
 * @param {string} dirPath - Caminho absoluto
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Retorna o caminho absoluto de upload para um negócio.
 * @param {number|string} businessId
 * @param {'logo'|'gallery'|'banner'} type
 * @returns {string}
 */
function getUploadPath(businessId, type = 'gallery') {
    let dir;
    if (type === 'logo' || type === 'banner') {
        dir = path.join(UPLOADS_ROOT, String(businessId));
    } else {
        dir = path.join(UPLOADS_ROOT, String(businessId), 'gallery');
    }
    ensureDir(dir);
    return dir;
}

module.exports = { deleteFile, deleteBusinessFolder, ensureDir, getUploadPath, UPLOADS_ROOT };
