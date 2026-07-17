/* ============================================================
   YUVAM MOBİLYA – app.js
   ============================================================ */

// ─── HELPERS ─────────────────────────────────────────────────
function formatPrice(amount) {
  return amount.toLocaleString('tr-TR') + ' ₺';
}

// ─── STATE ───────────────────────────────────────────────────

let cart = [];
let wishlist = new Set();
let currentPaymentProduct = null;
let orderCounter = 10847;

// ─── NAVBAR SCROLL ───────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  updateActiveNavLink();
});

function updateActiveNavLink() {
  const sections = ['hero', 'categories', 'products', 'about', 'contact'];
  const scrollPos = window.scrollY + 100;
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const link = document.querySelector(`.nav-link[href="#${id}"]`);
    if (!link) return;
    if (el.offsetTop <= scrollPos && el.offsetTop + el.offsetHeight > scrollPos) {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });
}

// ─── HAMBURGER MENU ──────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('mobile-open');
  const spans = hamburger.querySelectorAll('span');
  const isOpen = navLinks.classList.contains('mobile-open');
  spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
  spans[1].style.opacity = isOpen ? '0' : '1';
  spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
});

navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('mobile-open');
    hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = '1'; });
  });
});

// ─── HERO IMAGE ANIMATION ────────────────────────────────────
window.addEventListener('load', () => {
  const heroImg = document.querySelector('.hero-img');
  if (heroImg) heroImg.classList.add('loaded');
});

// ─── SEARCH ──────────────────────────────────────────────────
const searchBtn = document.getElementById('searchBtn');
const searchOverlay = document.getElementById('searchOverlay');
const searchClose = document.getElementById('searchClose');
const searchInput = document.getElementById('searchInput');

searchBtn.addEventListener('click', () => {
  searchOverlay.classList.add('open');
  setTimeout(() => searchInput.focus(), 100);
});
searchClose.addEventListener('click', () => searchOverlay.classList.remove('open'));
searchOverlay.addEventListener('click', (e) => {
  if (e.target === searchOverlay) searchOverlay.classList.remove('open');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    searchOverlay.classList.remove('open');
    document.getElementById('paymentModal').classList.remove('open');
  }
});

// ─── FILTER TABS ─────────────────────────────────────────────
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    filterProducts(tab.dataset.filter);
  });
});

function filterProducts(category) {
  // Activate corresponding tab
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.filter === category || (category === 'all' && tab.dataset.filter === 'all'));
  });

  const cards = document.querySelectorAll('.product-card');
  cards.forEach((card, i) => {
    const match = category === 'all' || card.dataset.category === category;
    card.style.transition = `all 0.4s ease ${i * 0.05}s`;
    if (match) {
      card.classList.remove('hidden');
      card.style.animation = 'fadeSlideUp 0.5s ease forwards';
    } else {
      card.classList.add('hidden');
    }
  });

  // Scroll to products section
  if (category !== 'all') {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ─── WISHLIST ────────────────────────────────────────────────
const wishlistBadge = document.getElementById('wishlistBadge');
const wishlistBtn = document.getElementById('wishlistBtn');

document.querySelectorAll('.wishlist-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    if (wishlist.has(id)) {
      wishlist.delete(id);
      btn.textContent = '♡';
      btn.classList.remove('wishlisted');
      showToast('Favorilerden kaldırıldı');
    } else {
      wishlist.add(id);
      btn.textContent = '♥';
      btn.classList.add('wishlisted');
      btn.style.color = '#ef4444';
      showToast('❤️ Favorilere eklendi!');
    }
    wishlistBadge.textContent = wishlist.size;
    wishlistBadge.style.display = wishlist.size > 0 ? 'flex' : 'none';
  });
});

// ─── CART ────────────────────────────────────────────────────
const cartBtn = document.getElementById('cartBtn');
const cartSidebar = document.getElementById('cartSidebar');
const cartClose = document.getElementById('cartClose');
const cartBadge = document.getElementById('cartBadge');
const overlayBg = document.getElementById('overlayBg');

cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
overlayBg.addEventListener('click', closeCart);

function openCart() {
  cartSidebar.classList.add('open');
  overlayBg.classList.add('visible');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  cartSidebar.classList.remove('open');
  overlayBg.classList.remove('visible');
  document.body.style.overflow = '';
}

function addToCart(id, name, price) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }
  updateCart();
  showToast(`🛒 "${name}" sepete eklendi!`);

  // Animate badge
  cartBadge.style.transform = 'scale(1.5)';
  setTimeout(() => { cartBadge.style.transform = ''; }, 300);
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCart();
}

function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  updateCart();
}

function updateCart() {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);

  cartBadge.textContent = count;
  document.getElementById('cartItemCount').textContent = `(${count})`;
  document.getElementById('cartSubtotal').textContent = formatPrice(total);
  document.getElementById('cartTotal').innerHTML = `<strong>${formatPrice(total)}</strong>`;

  const cartItems = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <div class="empty-icon">🛒</div>
        <p>Sepetiniz boş</p>
        <span>Ürünleri sepete ekleyerek alışverişe başlayın</span>
      </div>`;
    cartFooter.style.display = 'none';
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item" id="cartItem-${item.id}">
        <div class="cart-item-thumb">🪑</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})">✕</button>
      </div>
    `).join('');
    cartFooter.style.display = 'flex';
  }
}

function openCartPayment() {
  if (cart.length === 0) return;
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const names = cart.map(i => i.name).join(', ');
  closeCart();
  openPaymentModal(names, total);
}

// ─── PAYMENT MODAL ───────────────────────────────────────────
const paymentModal = document.getElementById('paymentModal');
const paymentClose = document.getElementById('paymentClose');

paymentClose.addEventListener('click', closePayment);
paymentModal.addEventListener('click', (e) => {
  if (e.target === paymentModal) closePayment();
});

function openPayment(id, name, price) {
  currentPaymentProduct = { id, name, price };
  openPaymentModal(name, price);
}

function openPaymentModal(name, price) {
  document.getElementById('summaryProduct').textContent = name;
  document.getElementById('summaryPrice').textContent = formatPrice(price);
  document.getElementById('summaryTotal').textContent = formatPrice(price);

  // Reset steps
  document.getElementById('payStep1').classList.remove('hidden');
  document.getElementById('payStep2').classList.add('hidden');
  document.getElementById('payStep3').classList.add('hidden');
  resetStepIndicators();
  document.getElementById('step1').classList.add('active');

  paymentModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePayment() {
  paymentModal.classList.remove('open');
  document.body.style.overflow = '';
  currentPaymentProduct = null;
}

function resetStepIndicators() {
  ['step1', 'step2', 'step3'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('active', 'done');
  });
}

function goToStep2() {
  // Basic validation
  const name = document.getElementById('payFirstName').value.trim();
  const email = document.getElementById('payEmail').value.trim();
  const phone = document.getElementById('payPhone').value.trim();

  if (!name || !email || !phone) {
    showToast('⚠️ Lütfen gerekli alanları doldurun.');
    return;
  }

  document.getElementById('payStep1').classList.add('hidden');
  document.getElementById('payStep2').classList.remove('hidden');

  // Update step indicators
  resetStepIndicators();
  document.getElementById('step1').classList.add('done');
  document.getElementById('step1').querySelector('.step-num').textContent = '✓';
  document.getElementById('step2').classList.add('active');

  // Scroll modal to top
  document.getElementById('paymentModalBox').scrollTop = 0;
}

function backToStep1() {
  document.getElementById('payStep2').classList.add('hidden');
  document.getElementById('payStep1').classList.remove('hidden');
  resetStepIndicators();
  document.getElementById('step1').classList.add('active');
  document.getElementById('paymentModalBox').scrollTop = 0;
}

function processPayment() {
  const cardNum = document.getElementById('cardNumber').value.replace(/\s/g, '');
  const cardName = document.getElementById('cardName').value.trim();
  const cardExp = document.getElementById('cardExp').value.trim();
  const cardCVV = document.getElementById('cardCVV').value.trim();

  if (cardNum.length < 16 || !cardName || cardExp.length < 5 || cardCVV.length < 3) {
    showToast('⚠️ Lütfen kart bilgilerini eksiksiz girin.');
    return;
  }

  // Show processing state
  const btn = document.querySelector('#payStep2 .btn-primary');
  btn.textContent = '⏳ İşlem yapılıyor...';
  btn.disabled = true;

  setTimeout(() => {
    // Success
    orderCounter++;
    const orderNum = `#YM-${String(orderCounter).padStart(6, '0')}`;
    document.getElementById('orderNumber').textContent = orderNum;

    // Show success details
    const firstName = document.getElementById('payFirstName').value;
    const lastName = document.getElementById('payLastName').value;
    const city = document.getElementById('payCity').value;
    const productName = document.getElementById('summaryProduct').textContent;
    const totalAmount = document.getElementById('summaryTotal').textContent;

    document.getElementById('successDetails').innerHTML = `
      <strong style="color: var(--clr-gold)">Sipariş Detayları</strong><br/>
      🪑 ${productName}<br/>
      💰 Toplam: ${totalAmount}<br/>
      👤 ${firstName} ${lastName}<br/>
      📍 ${city}<br/>
      📅 Tahmini Teslimat: ${getDeliveryDate()}
    `;

    document.getElementById('payStep2').classList.add('hidden');
    document.getElementById('payStep3').classList.remove('hidden');

    // Update step indicators
    resetStepIndicators();
    ['step1', 'step2', 'step3'].forEach(id => {
      document.getElementById(id).classList.add('done');
      const numEl = document.getElementById(id).querySelector('.step-num');
      numEl.textContent = '✓';
    });

    // Clear cart if this was a cart checkout
    cart = [];
    updateCart();

    btn.textContent = 'Ödemeyi Tamamla 🔒';
    btn.disabled = false;

    document.getElementById('paymentModalBox').scrollTop = 0;
  }, 2200);
}

function getDeliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * 4) + 3);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── CARD DISPLAY UPDATES ────────────────────────────────────
function formatCard(input) {
  let val = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = val.replace(/(.{4})/g, '$1 ').trim();
  const display = val.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
  document.getElementById('cardNumDisplay').textContent = display.replace(/\d/g, '•').replace(/•{4}/g, (m, i) => val.substring(i/5*4, i/5*4+4).padEnd(4,'•'));

  // Smarter display: show last 4 as revealed
  const masked = val.substring(0, Math.max(0, val.length - 4)).replace(/\d/g, '•') + val.substring(Math.max(0, val.length - 4));
  const padded = masked.padEnd(16, '•');
  document.getElementById('cardNumDisplay').textContent =
    padded.replace(/(.{4})/g, '$1 ').trim();

  updateCardLogo(val);
}

function updateCardLogo(num) {
  const logo = document.getElementById('card-logo') || document.querySelector('.card-logo');
  if (!logo) return;
  if (num.startsWith('4')) logo.textContent = 'VISA';
  else if (num.startsWith('5')) logo.textContent = 'MC';
  else if (num.startsWith('9')) logo.textContent = 'TROY';
  else logo.textContent = 'VISA';
}

function updateCardDisplay() {
  const name = document.getElementById('cardName').value.toUpperCase() || 'AD SOYAD';
  document.getElementById('cardNameDisplay').textContent = name;
}

function formatExp(input) {
  let val = input.value.replace(/\D/g, '').substring(0, 4);
  if (val.length >= 3) val = val.substring(0, 2) + '/' + val.substring(2);
  input.value = val;
  document.getElementById('cardExpDisplay').textContent = val || 'MM/YY';
}

// ─── QUICK VIEW (Enhanced) ───────────────────────────────────
document.querySelectorAll('.quick-view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    showToast('🔍 Hızlı önizleme yakında!');
  });
});

// ─── CONTACT FORM ────────────────────────────────────────────
function submitContact(e) {
  e.preventDefault();
  const btn = document.querySelector('#contactForm button[type="submit"]');
  btn.textContent = '⏳ Gönderiliyor...';
  btn.disabled = true;

  setTimeout(() => {
    showToast('✅ Mesajınız başarıyla gönderildi! En kısa sürede dönüş yapacağız.');
    document.getElementById('contactForm').reset();
    btn.textContent = 'Mesaj Gönder';
    btn.disabled = false;
  }, 1500);
}

// ─── TOAST ───────────────────────────────────────────────────
let toastTimeout;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── INTERSECTION OBSERVER (Reveal on scroll) ────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.product-card, .cat-card, .feature-card, .testimonial-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ─── SMOOTH SCROLL for nav links ─────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── PRODUCT GALLERY ─────────────────────────────────────────
const galleries = {
  verona: { index: 0, images: ['pictures/Verona_koltuk_takımı_1.jpeg', 'pictures/Verona_koltuk_takımı_2.jpeg', 'pictures/Verona_koltuk_takımı_3.jpeg', 'pictures/Verona_koltuk_takımı_4.jpeg', 'pictures/Verona_koltuk_takımı_5.jpeg'] },
  derin: { index: 0, images: ['pictures/derin_yemek_odası_1.jpeg', 'pictures/derin_yemek_odası_2.jpeg', 'pictures/derin_yemek_odası_3.jpeg', 'pictures/derin_yemek_odası_4.jpeg'] },
  latte: { index: 0, images: ['pictures/latte_yata_odası_1.jpeg', 'pictures/latte_yata_odası_2.jpeg', 'pictures/latte_yata_odası_3.jpeg', 'pictures/latte_yata_odası_4.jpeg', 'pictures/latte_yata_odası_5.jpeg', 'pictures/latte_yata_odası_6.jpeg', 'pictures/latte_yata_odası_7.jpeg', 'pictures/latte_yata_odası_8.jpeg', 'pictures/latte_yata_odası_9.jpeg'] }
};

function setGallery(product, index, thumbEl) {
  galleries[product].index = index;
  updateGalleryUI(product);
}

function galPrev(product) {
  galleries[product].index--;
  if (galleries[product].index < 0) galleries[product].index = galleries[product].images.length - 1;
  updateGalleryUI(product);
}

function galNext(product) {
  galleries[product].index++;
  if (galleries[product].index >= galleries[product].images.length) galleries[product].index = 0;
  updateGalleryUI(product);
}

function updateGalleryUI(product) {
  const mainImg = document.getElementById(product + 'Main');
  const src = galleries[product].images[galleries[product].index];
  
  // Fade transition
  mainImg.style.transition = 'opacity 0.2s ease-in-out';
  mainImg.style.opacity = '0';
  
  setTimeout(() => {
    mainImg.src = src;
    mainImg.style.opacity = '1';
  }, 200);

  // Update thumbs
  const showcase = document.getElementById(product);
  showcase.querySelectorAll('.thumb').forEach((t, i) => {
    t.classList.toggle('active', i === galleries[product].index);
  });
}

// ─── INIT ────────────────────────────────────────────────────
updateCart();
wishlistBadge.style.display = 'none';
