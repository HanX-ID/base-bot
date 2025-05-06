import './setting.js';
import * as baileys from '@whiskeysockets/baileys';
import fs from 'fs';
import pino from 'pino';
import PhoneNumber from 'awesome-phonenumber';
import { smsg } from './function.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { proto, makeWASocket, useMultiFileAuthState, makeInMemoryStore, jidDecode } = baileys;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./HanX');
  
  const hanx = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });

  // Register phone number if not registered
  if (!hanx.authState.creds.registered) {
    console.log('Number Whatsapp : ');

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const phoneNumber = await new Promise(resolve => {
      rl.question('', answer => {
        rl.close();
        resolve(answer.trim());
      });
    });

    const code = await hanx.requestPairingCode(phoneNumber);
    console.log('Pairing Code : ' + code);
  }

  store.bind(hanx.ev);

  // Decode JID function
  hanx.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server) ? `${decode.user}@${decode.server}` : jid;
    }
    return jid;
  };

  // Handle connection updates
  hanx.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
      console.log('Koneksi terputus, mencoba menyambung ulang...', shouldReconnect);
      if (shouldReconnect) connectToWhatsApp();
    } else if (connection === 'open') {
      console.log('Bot berhasil terhubung!');
    }
  });

  // Save credentials
  hanx.ev.on('creds.update', saveCreds);

  // Handle incoming messages
  hanx.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      let mek = chatUpdate.messages?.[0];
      if (!mek?.message) return;

      mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage')
        ? mek.message.ephemeralMessage.message
        : mek.message;

      if (mek.key?.remoteJid === 'status@broadcast') return;
      if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
      if (mek.key.id.startsWith('hann')) return;

      const m = smsg(hanx, mek, store);
      const { default: handlemsg } = await import('./case.js');
      handlemsg(hanx, m, chatUpdate, store);
    } catch (err) {
      console.log("Error on messages.upsert:", err);
    }
  });

  // Get contact name
  hanx.getName = async (jid, withoutContact = false) => {
    const id = hanx.decodeJid(jid);
    withoutContact = hanx.withoutContact || withoutContact;
    let v;

    if (id.endsWith("@g.us")) {
      return new Promise(async (resolve) => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject)) v = await hanx.groupMetadata(id) || {};
        resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'));
      });
    } else {
      v = id === '0@s.whatsapp.net' ? { id, name: 'WhatsApp' } :
        id === hanx.decodeJid(hanx.user.id) ? hanx.user :
        (store.contacts[id] || {});

      return (withoutContact ? '' : v.name) || v.subject || v.verifiedName ||
        PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
    }
  };
}

// Connect to WhatsApp
connectToWhatsApp();

// Watch file for updates
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename);
  console.log(`Update ${__filename}`);

  import(`${import.meta.url}?update=${Date.now()}`)
    .then(() => console.log('Kode diperbarui!'))
    .catch(err => console.error('Gagal memperbarui:', err));
});