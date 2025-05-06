`Commands In Termux`
```
pkg update && pkg upgrade -y    
pkg install git -y   
pkg install nodejs -y  
git clone https://github.com/HanX-ID/base-bot
cd base-bot   
npm install    
npm start   
```
           
`Ubah pengaturan owner di file setting.js`
```javascript
import fs from 'fs';
import { fileURLToPath } from 'url';

export const namabot = 'Bot Whatsapp'; // Name Bot
export const ownername = 'HanX'; // Name Owner
export const botNumber = ''; // Number Bot
export const ownerNumber = ''; // Number Owner

const __filename = fileURLToPath(import.meta.url);


fs.watchFile(__filename, () => {
    fs.unwatchFile(__filename);
    console.log(`Update ${__filename}`);
    import(`${import.meta.url}?update=${Date.now()}`)
        .then(() => console.log('Kode diperbarui!'))
        .catch(err => console.error('Gagal memperbarui:', err));
});
```
