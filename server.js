require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const crypto = require('crypto');
const db = require('./lib/db');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error('Thieu BOT_TOKEN trong file .env. Xem README.md de biet cach lay token.');
  process.exit(1);
}

let products = db.load('products.json', []);
let ctvs = db.load('ctv.json', []);
let orders = db.load('orders.json', []);

const bot = new Telegraf(BOT_TOKEN);

function isAdmin(ctx) {
  return ADMIN_CHAT_ID && String(ctx.chat.id) === String(ADMIN_CHAT_ID);
}

function money(n) {
  return Number(n || 0).toLocaleString('vi-VN') + 'd';
}

// ---------- BOT: chi admin moi dung duoc ----------

bot.start((ctx) => {
  const msg = isAdmin(ctx)
    ? 'Xin chao Admin! Go /help de xem cac lenh quan ly Miumeoshop.'
    : `Chat ID cua ban: ${ctx.chat.id}\nBot nay chi phuc vu quan ly noi bo shop.`;
  ctx.reply(msg);
});

bot.help((ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.reply(
    'CAC LENH QUAN LY\n\n' +
    'Them san pham: gui 1 anh, phan chu thich (caption) ghi "Ten san pham | Gia"\n' +
    'Vi du caption: Ao thun trang | 120000\n\n' +
    '/dssp - xem danh sach san pham\n' +
    '/suagia [ma_sp] [gia moi] - sua gia\n' +
    '/xoasp [ma_sp] - xoa san pham\n\n' +
    '/themctv [ten CTV] - tao ma dang nhap cho CTV moi\n' +
    '/dsctv - xem danh sach CTV va ma\n' +
    '/xoactv [ma] - xoa 1 CTV\n\n' +
    '/dondathang - xem 10 don hang gan nhat'
  );
});

// Them san pham bang cach gui anh + caption "Ten | Gia"
bot.on('photo', async (ctx) => {
  if (!isAdmin(ctx)) return;
  const caption = ctx.message.caption || '';
  const parts = caption.split('|').map((s) => s.trim());
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    return ctx.reply('Thieu thong tin. Ghi caption dang: Ten san pham | Gia\nVi du: Ao thun trang | 120000');
  }
  const [name, priceRaw] = parts;
  const price = parseInt(priceRaw.replace(/\D/g, ''), 10) || 0;

  const photos = ctx.message.photo;
  const fileId = photos[photos.length - 1].file_id;
  const fileLink = await ctx.telegram.getFileLink(fileId);

  const id = crypto.randomBytes(3).toString('hex');
  const product = { id, name, price, image: fileLink.href, createdAt: Date.now() };
  products.push(product);
  db.save('products.json', products);

  ctx.reply(`Da them san pham:\n${name} - ${money(price)}\nMa san pham: ${id}`);
});

bot.command('dssp', (ctx) => {
  if (!isAdmin(ctx)) return;
  if (!products.length) return ctx.reply('Chua co san pham nao. Gui anh + caption "Ten | Gia" de them.');
  const text = products.map((p) => `${p.id} | ${p.name} | ${money(p.price)}`).join('\n');
  ctx.reply(text);
});

bot.command('suagia', (ctx) => {
  if (!isAdmin(ctx)) return;
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length < 2) return ctx.reply('Cu phap: /suagia [ma_sp] [gia moi]');
  const [id, priceRaw] = args;
  const p = products.find((x) => x.id === id);
  if (!p) return ctx.reply('Khong tim thay san pham voi ma nay. Go /dssp de xem danh sach.');
  p.price = parseInt(priceRaw.replace(/\D/g, ''), 10) || p.price;
  db.save('products.json', products);
  ctx.reply(`Da cap nhat gia "${p.name}" -> ${money(p.price)}`);
});

bot.command('xoasp', (ctx) => {
  if (!isAdmin(ctx)) return;
  const id = ctx.message.text.split(' ')[1];
  const before = products.length;
  products = products.filter((x) => x.id !== id);
  db.save('products.json', products);
  ctx.reply(before === products.length ? 'Khong tim thay san pham nay.' : 'Da xoa san pham.');
});

bot.command('themctv', (ctx) => {
  if (!isAdmin(ctx)) return;
  const name = ctx.message.text.split(' ').slice(1).join(' ').trim();
  if (!name) return ctx.reply('Cu phap: /themctv [ten CTV]');
  const code = crypto.randomBytes(4).toString('hex').toUpperCase();
  ctvs.push({ code, name, createdAt: Date.now() });
  db.save('ctv.json', ctvs);
  ctx.reply(`Da tao CTV "${name}"\nMa dang nhap: ${code}\n(Gui ma nay cho CTV de ho vao web)`);
});

bot.command('dsctv', (ctx) => {
  if (!isAdmin(ctx)) return;
  if (!ctvs.length) return ctx.reply('Chua co CTV nao. Go /themctv [ten] de tao.');
  const text = ctvs.map((c) => `${c.name} - ma: ${c.code}`).join('\n');
  ctx.reply(text);
});

bot.command('xoactv', (ctx) => {
  if (!isAdmin(ctx)) return;
  const code = (ctx.message.text.split(' ')[1] || '').toUpperCase();
  const before = ctvs.length;
  ctvs = ctvs.filter((c) => c.code !== code);
  db.save('ctv.json', ctvs);
  ctx.reply(before === ctvs.length ? 'Khong tim thay ma nay.' : 'Da xoa CTV.');
});

bot.command('dondathang', (ctx) => {
  if (!isAdmin(ctx)) return;
  if (!orders.length) return ctx.reply('Chua co don hang nao.');
  const recent = orders.slice(-10).reverse();
  const text = recent
    .map((o) => {
      const items = o.items.map((i) => `  - ${i.name} x${i.qty}`).join('\n');
      return `Don #${o.id} - ${o.ctvName}\n${items}\nGhi chu: ${o.note || '(khong co)'}`;
    })
    .join('\n\n');
  ctx.reply(text);
});

bot.launch();
console.log('Bot Telegram da khoi dong.');

// ---------- WEB API cho trang CTV ----------

const app = express();
app.use(express.json());
app.use(express.static('public'));

function findCtv(code) {
  return ctvs.find((c) => c.code === String(code || '').toUpperCase());
}

app.post('/api/login', (req, res) => {
  const ctv = findCtv(req.body.code);
  if (!ctv) return res.status(401).json({ error: 'Ma khong dung' });
  res.json({ ok: true, name: ctv.name });
});

app.get('/api/products', (req, res) => {
  if (!findCtv(req.query.code)) return res.status(401).json({ error: 'Chua dang nhap' });
  res.json(products);
});

app.post('/api/order', (req, res) => {
  const { code, items, note } = req.body;
  const ctv = findCtv(code);
  if (!ctv) return res.status(401).json({ error: 'Ma khong dung' });
  if (!items || !items.length) return res.status(400).json({ error: 'Chua chon san pham nao' });

  const order = {
    id: orders.length + 1,
    ctvCode: ctv.code,
    ctvName: ctv.name,
    items,
    note: note || '',
    createdAt: Date.now(),
  };
  orders.push(order);
  db.save('orders.json', orders);

  const summary = items.map((i) => `- ${i.name} x${i.qty}`).join('\n');
  if (ADMIN_CHAT_ID) {
    bot.telegram
      .sendMessage(
        ADMIN_CHAT_ID,
        `DON HANG MOI #${order.id}\nCTV: ${ctv.name}\n${summary}\nGhi chu: ${note || '(khong co)'}`
      )
      .catch((e) => console.error('Khong gui duoc thong bao Telegram:', e.message));
  }
  res.json({ ok: true, orderId: order.id });
});

app.listen(PORT, () => console.log(`Web CTV dang chay tai cong ${PORT}`));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
