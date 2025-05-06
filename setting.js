import fs from 'fs';
import { fileURLToPath } from 'url';

export const namabot = 'Bot Whatsapp';
export const ownername = 'HanX';
export const botNumber = '';
export const ownerNumber = '';

const __filename = fileURLToPath(import.meta.url);

fs.watchFile(__filename, () => {
    fs.unwatchFile(__filename);
    console.log(`Update ${__filename}`);
    import(`${import.meta.url}?update=${Date.now()}`)
        .then(() => console.log('Kode diperbarui!'))
        .catch(err => console.error('Gagal memperbarui:', err));
});