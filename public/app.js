const state = {
  code: localStorage.getItem('ctv_code') || '',
  name: localStorage.getItem('ctv_name') || '',
  products: [],
  qty: {}, // productId -> quantity chosen (before adding to cart)
  cart: {}, // productId -> { name, price, qty }
};

const $ = (id) => document.getElementById(id);

function money(n) {
  return Number(n || 0).toLocaleString('vi-VN') + 'đ';
}

function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => (t.hidden = true), 2200);
}

// ---------- LOGIN ----------

async function tryLogin(code) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Mã không đúng');
  return data.name;
}

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = $('codeInput').value.trim().toUpperCase();
  if (!code) return;
  $('loginError').hidden = true;
  try {
    const name = await tryLogin(code);
    state.code = code;
    state.name = name;
    localStorage.setItem('ctv_code', code);
    localStorage.setItem('ctv_name', name);
    enterShop();
  } catch (err) {
    $('loginError').textContent = err.message;
    $('loginError').hidden = false;
  }
});

$('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('ctv_code');
  localStorage.removeItem('ctv_name');
  state.code = '';
  state.cart = {};
  $('shopScreen').hidden = true;
  $('loginScreen').hidden = false;
  $('cartOverlay').hidden = true;
});

// ---------- SHOP ----------

async function enterShop() {
  $('loginScreen').hidden = true;
  $('shopScreen').hidden = false;
  $('ctvName').textContent = state.name;

  const res = await fetch(`/api/products?code=${encodeURIComponent(state.code)}`);
  if (!res.ok) {
    $('logoutBtn').click();
    return;
  }
  state.products = await res.json();
  renderProducts();
}

function renderProducts() {
  const grid = $('productGrid');
  grid.innerHTML = '';
  $('emptyState').hidden = state.products.length > 0;

  for (const p of state.products) {
    state.qty[p.id] = state.qty[p.id] || 1;

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" loading="lazy" />
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">${money(p.price)}</div>
        <div class="qty-row">
          <button data-action="dec" aria-label="Giảm">−</button>
          <span data-role="qty">${state.qty[p.id]}</span>
          <button data-action="inc" aria-label="Tăng">+</button>
        </div>
        <button class="add-btn" data-action="add">Thêm vào giỏ</button>
      </div>
    `;

    const qtySpan = card.querySelector('[data-role="qty"]');
    const addBtn = card.querySelector('[data-action="add"]');

    card.querySelector('[data-action="dec"]').addEventListener('click', () => {
      state.qty[p.id] = Math.max(1, state.qty[p.id] - 1);
      qtySpan.textContent = state.qty[p.id];
    });
    card.querySelector('[data-action="inc"]').addEventListener('click', () => {
      state.qty[p.id] = state.qty[p.id] + 1;
      qtySpan.textContent = state.qty[p.id];
    });
    addBtn.addEventListener('click', () => {
      state.cart[p.id] = { name: p.name, price: p.price, qty: state.qty[p.id] };
      addBtn.textContent = 'Đã thêm ✓';
      addBtn.classList.add('in-cart');
      updateCartFab();
      showToast(`Đã thêm ${p.name} vào giỏ`);
    });

    grid.appendChild(card);
  }
}

// ---------- CART ----------

function cartEntries() {
  return Object.entries(state.cart);
}

function cartTotal() {
  return cartEntries().reduce((sum, [, item]) => sum + item.price * item.qty, 0);
}

function updateCartFab() {
  const count = cartEntries().length;
  const fab = $('cartBtn');
  fab.hidden = count === 0;
  $('cartCount').textContent = count;
  $('cartTotal').textContent = money(cartTotal());
}

$('cartBtn').addEventListener('click', () => {
  renderCartSheet();
  $('cartOverlay').hidden = false;
});
$('closeCart').addEventListener('click', () => ($('cartOverlay').hidden = true));
$('cartOverlay').addEventListener('click', (e) => {
  if (e.target === $('cartOverlay')) $('cartOverlay').hidden = true;
});

function renderCartSheet() {
  const wrap = $('cartItems');
  wrap.innerHTML = '';
  for (const [id, item] of cartEntries()) {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <span>${item.name} × ${item.qty}</span>
      <span>${money(item.price * item.qty)}</span>
      <button class="remove-item">Xoá</button>
    `;
    row.querySelector('.remove-item').addEventListener('click', () => {
      delete state.cart[id];
      const btn = document.querySelector(`.product-card [data-action="add"].in-cart`);
      renderProducts();
      renderCartSheet();
      updateCartFab();
    });
    wrap.appendChild(row);
  }
  $('cartFooterTotal').textContent = money(cartTotal());
}

$('submitOrderBtn').addEventListener('click', async () => {
  const items = cartEntries().map(([id, item]) => ({
    id,
    name: item.name,
    price: item.price,
    qty: item.qty,
  }));
  if (!items.length) return;

  const note = $('orderNote').value.trim();
  const res = await fetch('/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: state.code, items, note }),
  });
  const data = await res.json();
  if (!res.ok) {
    showToast(data.error || 'Có lỗi xảy ra, thử lại nhé');
    return;
  }

  state.cart = {};
  $('orderNote').value = '';
  $('cartOverlay').hidden = true;
  renderProducts();
  updateCartFab();
  showToast(`Đã gửi đơn #${data.orderId} cho shop 🎀`);
});

// ---------- INIT ----------

if (state.code) {
  enterShop().catch(() => {});
}
