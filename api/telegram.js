// MIUMEOSHOP — Telegram Admin for Vercel
// IMPORTANT: do NOT put BOT_TOKEN in this file.
// Set BOT_TOKEN, GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH and TELEGRAM_ADMIN_ID
// in Vercel -> Settings -> Environment Variables.

const GITHUB_API = 'https://api.github.com';
const BOT_TOKEN = process.env.BOT_TOKEN;
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const PRODUCT_FILE = process.env.PRODUCT_FILE || 'index.html';
const IMAGE_DIR = process.env.IMAGE_DIR || 'images/products';

const CATS = {
  nam: '👕 Áo nam',
  nu: '👚 Áo nữ',
  quan: '👖 Quần',
  vay: '👗 Váy',
  phukien: '👜 Phụ kiện'
};

function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 45) || 'san-pham';
}

function htmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function jsString(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    .replace(/\r?\n/g, ' ');
}

function allowed(userId) {
  return String(userId) === String(process.env.TELEGRAM_ADMIN_ID || '');
}

async function ghGet(path) {
  const url = `${GITHUB_API}/repos/${process.env.GITHUB_REPO}/contents/${path}?ref=${encodeURIComponent(BRANCH)}`;
  const r = await fetch(url, { headers: ghHeaders() });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub GET ${r.status}`);
  return r.json();
}

async function ghPut(path, bytes, message, sha) {
  const content = Buffer.from(bytes).toString('base64');
  const body = { message, content, branch: BRANCH };
  if (sha) body.sha = sha;
  const r = await fetch(`${GITHUB_API}/repos/${process.env.GITHUB_REPO}/contents/${path}`, {
    method: 'PUT', headers: ghHeaders(), body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`GitHub PUT ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

async function ghDelete(path, sha, message) {
  const r = await fetch(`${GITHUB_API}/repos/${process.env.GITHUB_REPO}/contents/${path}`, {
    method: 'DELETE', headers: ghHeaders(),
    body: JSON.stringify({ message, sha, branch: BRANCH })
  });
  if (!r.ok) throw new Error(`GitHub DELETE ${r.status}`);
  return r.json();
}

async function tg(method, body) {
  const r = await fetch(`${TG_API}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await r.json();
  if (!data.ok) throw new Error(`Telegram ${method}: ${data.description || 'unknown error'}`);
  return data;
}

async function send(chatId, text, extra = {}) {
  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...extra
  });
}

function menu() {
  return { inline_keyboard: [
    [{ text: '➕ THÊM SẢN PHẨM', callback_data: 'add' }],
    [{ text: '📦 SẢN PHẨM MỚI', callback_data: 'list' }],
    [{ text: '❌ HỦY PHIÊN', callback_data: 'cancel' }]
  ]};
}

function categoryMenu(pendingId) {
  return { inline_keyboard: [
    [{ text: CATS.nam, callback_data: `cat|nam|${pendingId}` }],
    [{ text: CATS.nu, callback_data: `cat|nu|${pendingId}` }],
    [{ text: CATS.quan, callback_data: `cat|quan|${pendingId}` }],
    [{ text: CATS.vay, callback_data: `cat|vay|${pendingId}` }],
    [{ text: CATS.phukien, callback_data: `cat|phukien|${pendingId}` }],
    [{ text: '↩️ Hủy', callback_data: `cancel|${pendingId}` }]
  ]};
}

async function telegramPhotoBytes(fileId) {
  const meta = await tg('getFile', { file_id: fileId });
  const r = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${meta.result.file_path}`);
  if (!r.ok) throw new Error('Không tải được ảnh từ Telegram');
  return Buffer.from(await r.arrayBuffer());
}

async function saveImage(slug, bytes) {
  const path = `${IMAGE_DIR}/${slug}.jpg`;
  const old = await ghGet(path);
  await ghPut(path, bytes, `bot: ảnh ${slug}`, old?.sha);
  return path;
}

async function savePending(id, data) {
  const path = `.miumeoshop-pending/${id}.json`;
  await ghPut(path, Buffer.from(JSON.stringify(data, null, 2)), `bot: pending ${id}`);
  return path;
}

async function getPending(id) {
  const file = await ghGet(`.miumeoshop-pending/${id}.json`);
  if (!file) return null;
  return { file, data: JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')) };
}

async function addProduct(data) {
  const file = await ghGet(PRODUCT_FILE);
  if (!file) throw new Error(`Không tìm thấy ${PRODUCT_FILE}`);
  const raw = Buffer.from(file.content, 'base64').toString('utf8');
  const startMarker = '// BOT_PRODUCTS_START';
  const endMarker = '// BOT_PRODUCTS_END';
  const start = raw.indexOf(startMarker);
  const end = raw.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error('index.html thiếu marker BOT_PRODUCTS_START/END');

  const block = raw.slice(start, end);
  const duplicate = new RegExp(`slug\\s*:\\s*[\\\"']${data.slug.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}[\\\"']`).test(block);
  if (duplicate) throw new Error('Sản phẩm này đã tồn tại trên web');

  const insertAt = raw.lastIndexOf('];', end);
  if (insertAt < 0) throw new Error('Không tìm thấy cuối mảng products');

  const obj = ` {slug:'${jsString(data.slug)}', name:'${jsString(data.name)}', price:'Liên hệ', oldPrice:'', cat:'${jsString(data.cat)}', hot:true, sold:0},\n`;
  const next = raw.slice(0, insertAt) + obj + raw.slice(insertAt);
  await ghPut(PRODUCT_FILE, Buffer.from(next), `bot: thêm ${data.name}`, file.sha);
}

async function listProducts(chatId) {
  const file = await ghGet(PRODUCT_FILE);
  if (!file) throw new Error(`Không tìm thấy ${PRODUCT_FILE}`);
  const raw = Buffer.from(file.content, 'base64').toString('utf8');
  const start = raw.indexOf('// BOT_PRODUCTS_START');
  const end = raw.indexOf('// BOT_PRODUCTS_END', start);
  const block = start >= 0 && end >= 0 ? raw.slice(start, end) : raw;
  const names = [...block.matchAll(/name\s*:\s*['"]([^'"]+)['"]/g)]
    .map(m => m[1]).slice(-15).reverse();
  const text = names.length
    ? names.map((n, i) => `${i + 1}. ${htmlEscape(n)}`).join('\n')
    : 'Chưa có sản phẩm.';
  return send(chatId, `<b>💗 MIUMEOSHOP</b>\n\n<b>15 sản phẩm mới nhất:</b>\n${text}`, { reply_markup: menu() });
}

async function help(chatId) {
  return send(chatId,
    `<b>💗 MIUMEOSHOP ADMIN</b>\n\n` +
    `📸 Gửi <b>ảnh + tên áo trong caption</b> → chọn mục → bot tự cập nhật GitHub → Vercel tự deploy.\n\n` +
    `<b>Ví dụ caption:</b>\n<code>Hoodie England đen</code>\n\n` +
    `<b>Lệnh:</b> /start · /add · /list · /cancel`,
    { reply_markup: menu() }
  );
}

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  if (!allowed(msg.from?.id)) return; // don't reveal admin bot to strangers

  if (msg.text === '/start' || msg.text === '/menu' || msg.text === '/help') return help(chatId);
  if (msg.text === '/list') return listProducts(chatId);
  if (msg.text === '/cancel') return send(chatId, '🗑️ Đã hủy thao tác hiện tại.', { reply_markup: menu() });
  if (msg.text === '/add') return send(chatId, '📸 <b>BƯỚC 1</b>\nGửi <b>ảnh áo</b> và ghi <b>tên áo vào caption</b>.', { reply_markup: menu() });

  if (msg.photo?.length) {
    const name = String(msg.caption || '').trim();
    if (!name) return send(chatId, '⚠️ Hãy gửi <b>ảnh + tên áo trong caption</b>.\nVí dụ: <code>Hoodie England đen</code>');

    const slug = slugify(name);
    const pendingId = `${msg.from?.id || chatId}-${msg.message_id}`;
    try {
      const bytes = await telegramPhotoBytes(msg.photo[msg.photo.length - 1].file_id);
      await saveImage(slug, bytes);
      await savePending(pendingId, { name, slug, chatId, createdAt: Date.now() });
      return send(chatId,
        `🖼️ <b>ĐÃ NHẬN ẢNH</b>\n\n👕 ${htmlEscape(name)}\n🔗 <code>${htmlEscape(slug)}</code>\n\n🏷️ <b>BƯỚC 2 — chọn mục:</b>`,
        { reply_markup: categoryMenu(pendingId) }
      );
    } catch (e) {
      console.error(e);
      return send(chatId, `❌ <b>Không xử lý được</b>\n<code>${htmlEscape(String(e.message).slice(0, 700))}</code>`);
    }
  }

  return send(chatId, 'Dùng <b>/add</b> hoặc gửi <b>ảnh + tên áo trong caption</b>.', { reply_markup: menu() });
}

async function handleCallback(q) {
  if (!allowed(q.from?.id)) {
    return tg('answerCallbackQuery', { callback_query_id: q.id, text: 'Không có quyền', show_alert: true });
  }

  await tg('answerCallbackQuery', { callback_query_id: q.id });
  const chatId = q.message.chat.id;
  const data = String(q.data || '');

  if (data === 'add') return send(chatId, '📸 Gửi <b>ảnh + tên áo trong caption</b>.');
  if (data === 'list') return listProducts(chatId);
  if (data === 'cancel') return send(chatId, '🗑️ Đã hủy thao tác.', { reply_markup: menu() });

  if (data.startsWith('cancel|')) {
    const id = data.split('|')[1];
    const p = await getPending(id);
    if (p) await ghDelete(`.miumeoshop-pending/${id}.json`, p.file.sha, `bot: hủy pending ${id}`);
    return send(chatId, '🗑️ Đã hủy phiên thêm sản phẩm.', { reply_markup: menu() });
  }

  if (data.startsWith('cat|')) {
    const [, cat, pendingId] = data.split('|');
    if (!CATS[cat]) return send(chatId, '❌ Mục không hợp lệ.');

    try {
      const p = await getPending(pendingId);
      if (!p) throw new Error('Phiên sản phẩm không còn tồn tại. Gửi lại ảnh + tên áo.');
      const item = p.data;
      if (String(item.chatId) !== String(chatId)) throw new Error('Phiên này không thuộc tài khoản admin.');

      await addProduct({ name: item.name, slug: item.slug, cat });
      await ghDelete(`.miumeoshop-pending/${pendingId}.json`, p.file.sha, `bot: hoàn tất ${pendingId}`);

      return send(chatId,
        `✅ <b>ĐÃ LÊN WEB</b>\n\n` +
        `👕 <b>${htmlEscape(item.name)}</b>\n` +
        `🏷️ ${CATS[cat]}\n` +
        `🖼️ <code>${htmlEscape(item.slug)}.jpg</code>\n\n` +
        `🚀 GitHub đã cập nhật → Vercel sẽ tự deploy.`,
        { reply_markup: menu() }
      );
    } catch (e) {
      console.error(e);
      return send(chatId, `❌ <b>Không thêm được</b>\n<code>${htmlEscape(String(e.message).slice(0, 700))}</code>`, { reply_markup: menu() });
    }
  }
}

async function handleUpdate(update) {
  if (update.message) return handleMessage(update.message);
  if (update.callback_query) return handleCallback(update.callback_query);
}

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ ok: true, service: 'MIUMEOSHOP Telegram Admin' });
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  if (!BOT_TOKEN || !process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO || !process.env.TELEGRAM_ADMIN_ID) {
    console.error('Missing required environment variables');
    return res.status(500).json({ ok: false, error: 'Server environment is not configured' });
  }

  try {
    await handleUpdate(req.body || {});
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
}
