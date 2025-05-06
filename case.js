import * as config from './setting.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import util from 'util';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function (hanx, m) {
  try {
    let body = '';

    // Menentukan body dari pesan yang diterima
    if (m.message) {
      body = m.message.conversation ||
        m.message.imageMessage?.caption ||
        m.message.videoMessage?.caption ||
        m.message.extendedTextMessage?.text ||
        m.message.buttonsResponseMessage?.selectedButtonId ||
        m.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        m.message.templateButtonReplyMessage?.selectedId ||
        m.text || '';
    }

    const budy = typeof m.text === 'string' ? m.text : '';
    const prefix = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(body)
      ? body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0]
      : '';

    const isCmd = body.startsWith(prefix);
    const command = isCmd
      ? body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase()
      : '';

    const args = body.trim().split(/ +/).slice(1);
    const pushname = m.pushName || 'no name';
    const sender = m.key.remoteJid;
    const isOwner = m.sender.includes(config.ownerNumber);

    console.log(`[PESAN] ${pushname} : ${body}`);

    // Menjalankan command shell jika dikirim oleh owner
    if (body.startsWith('$') && isOwner) {
      const shellCommand = body.slice(1).trim();
      exec(shellCommand, (err, stdout, stderr) => {
        const result = err ? (stderr || err.message) : stdout;
        hanx.sendMessage(sender, { text: result || '✓' }, { quoted: m });
      });
      return;
    }

    switch (command) {
      case 'bot':
        await hanx.sendMessage(sender, { text: '*Bot Online ✓*' });
        break;

      case 'sticker':
      case 's':
      case 'stiker':
        if (m.message.imageMessage || (m.quoted && m.quoted.message && m.quoted.message.imageMessage)) {
          let quotedMsg = m.quoted ? m.quoted : m;
          let media = await hanx.downloadMediaMessage(quotedMsg);
          await hanx.sendMessage(sender, {
            sticker: media,
            packname: 'Bot WhatsApp',
            author: 'HanX'
          }, { quoted: m });
        } else {
          await hanx.sendMessage(sender, { text: 'reply/kirim foto dengan commands .s' }, { quoted: m });
        }
        break;


      default:
        break;
    }
  } catch (err) {
    const errId = '0@s.whatsapp.net';
    await hanx.sendMessage(errId, { text: util.format(err) }, { quoted: m });
    console.error('❌ Error:\n', err);
  }
}

// Menjaga agar file tetap terupdate saat ada perubahan
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename);
  console.log(`Update ${__filename}`);

  import(`${import.meta.url}?update=${Date.now()}`)
    .then(() => console.log('Kode diperbarui!'))
    .catch(err => console.error('Gagal memperbarui:', err));
});