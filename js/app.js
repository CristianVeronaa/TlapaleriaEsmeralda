/**
 * app.js — Lógica principal de la Tlapalería Esmeralda
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Inicializar DB ──────────────────────────────────────
  DB.init();

  // ── Referencias DOM ─────────────────────────────────────
  const searchInput      = document.getElementById('search-input');
  const autocompleteList = document.getElementById('autocomplete-list');
  const productsGrid     = document.getElementById('products-grid');
  const cartBadge        = document.getElementById('cart-badge');
  const cartOverlay      = document.getElementById('cart-overlay');
  const cartSidebar      = document.getElementById('cart-sidebar');
  const cartItemsEl      = document.getElementById('cart-items');
  const cartTotalEl      = document.getElementById('cart-total');
  const btnCart          = document.getElementById('btn-cart');
  const btnCloseCart     = document.getElementById('btn-close-cart');
  const filterCategoria  = document.getElementById('filter-categoria');
  const filterMarca      = document.getElementById('filter-marca');
  const filterPrecio     = document.getElementById('filter-precio');
  const filterPrecioVal  = document.getElementById('filter-precio-val');
  const btnReset         = document.getElementById('btn-reset-filters');
  const modalOverlay     = document.getElementById('modal-overlay');
  const modalContent     = document.getElementById('modal-dyn');
  const btnCloseModal    = document.getElementById('btn-close-modal');
  const navbar           = document.getElementById('navbar');
  const hamburger        = document.getElementById('hamburger');
  const mobileMenu       = document.getElementById('mobile-menu');
  const checkoutOverlay  = document.getElementById('checkout-overlay');
  const checkoutBox      = document.getElementById('checkout-box');

  // ── Navbar scroll ────────────────────────────────────────
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  });

  // ── Mobile menu ──────────────────────────────────────────
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });

  // ── Slider de precio ─────────────────────────────────────
  filterPrecio.addEventListener('input', () => {
    filterPrecioVal.textContent = `$${Number(filterPrecio.value).toLocaleString('es-MX')}`;
    renderProducts();
  });

  // ── Filtros ───────────────────────────────────────────────
  [filterCategoria, filterMarca].forEach(el =>
    el.addEventListener('change', renderProducts)
  );

  btnReset.addEventListener('click', () => {
    filterCategoria.value = 'todos';
    filterMarca.value = 'todas';
    const maxP = DB.getMaxPrecio();
    const maxS = Math.ceil(maxP / 500) * 500;
    filterPrecio.max   = maxS;
    filterPrecio.value = maxS;
    filterPrecioVal.textContent = `$${maxS.toLocaleString('es-MX')}`;
    searchInput.value = '';
    renderProducts();
  });

  // ── Barra de búsqueda / Autocompletado ───────────────────
  // Captura la búsqueda del usuario y actualiza las sugerencias y el listado.
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    renderProducts();
    if (q.length < 2) { autocompleteList.classList.remove('visible'); return; }

    const suggestions = DB.getAll()
      .filter(p => p.nombre.toLowerCase().includes(q.toLowerCase()) ||
                   p.marca.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5);

    autocompleteList.innerHTML = suggestions.map(p => `
      <div class="autocomplete-item" data-id="${p.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        ${p.nombre} — <em>${p.marca}</em>
      </div>
    `).join('');
    autocompleteList.classList.toggle('visible', suggestions.length > 0);
  });

  // Selecciona una sugerencia del autocompletado y carga ese producto en la búsqueda.
  autocompleteList.addEventListener('click', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (!item) return;
    const prod = DB.getById(Number(item.dataset.id));
    searchInput.value = prod.nombre;
    autocompleteList.classList.remove('visible');
    renderProducts();
  });

  // Cierra el desplegable de autocompletado cuando el usuario hace clic fuera del buscador.
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      autocompleteList.classList.remove('visible');
    }
  });

  // ── Renderizar Productos ──────────────────────────────────
  function renderProducts() {
    // Recoge los valores actuales de búsqueda y filtros seleccionados.
    const query      = searchInput.value.trim();
    const categoria  = filterCategoria.value;
    const marca      = filterMarca.value;
    const precioMax  = Number(filterPrecio.value);

    // Llama al método de filtrado de la base de datos y muestra los productos resultantes.
    const productos = DB.filter({ categoria, marca, precioMax, query });
    populateGrid(productos);
  }

  const cartIconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;

  function populateGrid(productos) {
    // Si no existe el contenedor donde se debe dibujar el catálogo, terminamos.
    if (!productsGrid) return;

    // Si no hay resultados, mostrar estado vacío con mensaje al usuario.
    if (productos.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>No se encontraron productos con los filtros seleccionados.</p>
        </div>`;
      return;
    }

    productsGrid.innerHTML = productos.map(p => `
      <div class="product-card" data-id="${p.id}">
        <div class="product-image-wrap">
          <img src="${p.imagen}" alt="${p.nombre}" loading="lazy">
          ${p.stock <= 5 && p.stock > 0 ? '<div class="product-badge">Últimas unidades</div>' : ''}
          ${p.stock === 0 ? '<div class="product-badge">Agotado</div>' : ''}
          <div class="quick-view-overlay">
            <p>${p.descripcion.slice(0, 80)}...</p>
            <button class="btn-add-quick btn-cart-action" data-id="${p.id}">
              ${cartIconSVG} Añadir al carrito
            </button>
          </div>
        </div>
        <div class="product-info">
          <div class="product-marca">${p.marca}</div>
          <div class="product-nombre">${p.nombre}</div>
          <div class="product-footer">
            <div class="product-precio">$${p.precio.toLocaleString('es-MX')} <span>MXN</span></div>
            <button class="btn-add-cart btn-cart-action" data-id="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>
              ${cartIconSVG} Añadir
            </button>
          </div>
          <div class="product-stock ${p.stock === 0 ? 'out-of-stock' : ''}">
            ${p.stock === 0 ? 'Sin existencias' : `${p.stock} en existencia`}
          </div>
        </div>
      </div>
    `).join('');

    // Click en tarjeta — abrir modal
    productsGrid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-cart-action')) return;
        openModal(Number(card.dataset.id));
      });
    });

    // Botones para agregar productos directamente al carrito desde la tarjeta.
    productsGrid.querySelectorAll('.btn-cart-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(Number(btn.dataset.id));
      });
    });
  }

  // ── Carrito ───────────────────────────────────────────────
  function updateCartUI() {
    // Actualiza el indicador de cantidad en el carrito y muestra el contenido.
    const count = Cart.count();
    cartBadge.textContent = count;
    cartBadge.classList.toggle('visible', count > 0);

    const carrito = Cart.get();
    if (carrito.length === 0) {
      cartItemsEl.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <p>Tu carrito está vacío</p>
        </div>`;
    } else {
      const removeIconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      cartItemsEl.innerHTML = carrito.map(item => `
        <div class="cart-item-row">
          <img class="cart-item-img" src="${item.imagen}" alt="${item.nombre}">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.nombre}</div>
            <div class="cart-item-price">$${(item.precio * item.cantidad).toLocaleString('es-MX')}</div>
            <div class="cart-item-qty">Cantidad: ${item.cantidad}</div>
          </div>
          <button class="btn-remove-item" data-id="${item.id}" aria-label="Eliminar">${removeIconSVG}</button>
        </div>
      `).join('');

      cartItemsEl.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
          // Elimina el producto seleccionado y vuelve a renderizar la vista del carrito.
          Cart.remove(Number(btn.dataset.id));
          updateCartUI();
        });
      });
    }

    cartTotalEl.textContent = `$${Cart.total().toLocaleString('es-MX')}`;
  }

  function addToCart(id) {
    // Agrega un producto al carrito y actualiza la vista del carrito.
    Cart.add(id);
    updateCartUI();
    showToast('Producto añadido al carrito');
  }

  // Abre el panel lateral del carrito cuando el usuario hace clic en el botón del carrito.
  btnCart.addEventListener('click', () => {
    cartOverlay.classList.add('open');
    cartSidebar.classList.add('open');
  });

  function closeCart() {
    cartOverlay.classList.remove('open');
    cartSidebar.classList.remove('open');
  }
  btnCloseCart.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  // ── Checkout (simulación de pedido) ──────────────────────
  document.getElementById('btn-checkout').addEventListener('click', () => {
    if (Cart.count() === 0) { showToast('Tu carrito está vacío'); return; }
    closeCart();
    openCheckoutModal();
  });

  function generateOrderNumber() {
    const prefix = 'ESM';
    const date   = new Date();
    const year   = date.getFullYear().toString().slice(-2);
    const month  = String(date.getMonth() + 1).padStart(2, '0');
    const day    = String(date.getDate()).padStart(2, '0');
    const rand   = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${year}${month}${day}-${rand}`;
  }

  function openCheckoutModal() {
    // Construye el modal de checkout con los productos en el carrito y un formulario de envío.
    const carrito = Cart.get();
    const total   = Cart.total();

    const itemsHTML = carrito.map(i =>
      `<div class="cs-item">
        <span>${i.nombre} × ${i.cantidad}</span>
        <span>$${(i.precio * i.cantidad).toLocaleString('es-MX')}</span>
      </div>`
    ).join('');

    checkoutBox.innerHTML = `
      <div class="checkout-header">
        <svg viewBox="0 0 24 24">
          <polyline points="20 12 20 22 4 22 4 12"/>
          <rect x="2" y="7" width="20" height="5"/>
          <line x1="12" y1="22" x2="12" y2="7"/>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
        </svg>
        <h2>Finalizar pedido</h2>
        <p>Completa tu información para procesar el envío</p>
      </div>

      <div class="checkout-body">
        <div class="checkout-step-label">Información de contacto</div>

        <div class="form-row">
          <div class="form-field">
            <label for="co-nombre">Nombre</label>
            <input type="text" id="co-nombre" placeholder="Ej. Juan García" />
          </div>
          <div class="form-field">
            <label for="co-telefono">Teléfono</label>
            <input type="tel" id="co-telefono" placeholder="(612) 000-0000" />
          </div>
        </div>

        <div class="form-row full">
          <div class="form-field">
            <label for="co-email">Correo electrónico</label>
            <input type="email" id="co-email" placeholder="ejemplo@correo.com" />
          </div>
        </div>

        <hr class="checkout-divider" />
        <div class="checkout-step-label">Dirección de envío</div>

        <div class="form-row full">
          <div class="form-field">
            <label for="co-calle">Calle y número</label>
            <input type="text" id="co-calle" placeholder="Ej. Av. Álvaro Obregón #200" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="co-colonia">Colonia</label>
            <input type="text" id="co-colonia" placeholder="Col. Centro" />
          </div>
          <div class="form-field">
            <label for="co-cp">Código postal</label>
            <input type="text" id="co-cp" maxlength="5" placeholder="23000" />
          </div>
        </div>

        <hr class="checkout-divider" />
        <div class="checkout-summary-title">Resumen del pedido</div>
        <div class="checkout-summary-items">${itemsHTML}</div>
        <div class="checkout-total-row">
          <span>Total a pagar</span>
          <strong>$${total.toLocaleString('es-MX')} MXN</strong>
        </div>

        <div class="checkout-actions">
          <button class="btn-cancel-checkout" id="btn-cancel-co">Cancelar</button>
          <button class="btn-confirm-order" id="btn-confirm-co">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            Confirmar pedido
          </button>
        </div>
      </div>
    `;

    checkoutOverlay.classList.add('open');

    document.getElementById('btn-cancel-co').addEventListener('click', closeCheckoutModal);

    document.getElementById('btn-confirm-co').addEventListener('click', () => {
      // Validación básica
      const nombre   = document.getElementById('co-nombre').value.trim();
      const telefono = document.getElementById('co-telefono').value.trim();
      const email    = document.getElementById('co-email').value.trim();
      const calle    = document.getElementById('co-calle').value.trim();
      const colonia  = document.getElementById('co-colonia').value.trim();
      const cp       = document.getElementById('co-cp').value.trim();

      // Validación básica de los campos obligatorios antes de guardar el pedido.
      if (!nombre || !telefono || !calle || !colonia) {
        showToast('Por favor completa los campos requeridos');
        return;
      }

      const orderNum = generateOrderNumber();
      const direccion = `${calle}, ${colonia}${cp ? ', C.P. ' + cp : ''}`;

      // Guardar el pedido en localStorage
      const carrito = Cart.get();
      Orders.add({
        numero:    orderNum,
        fecha:     new Date().toISOString(),
        estado:    'pendiente',
        cliente: {
          nombre,
          telefono,
          email: email || 'No proporcionado',
        },
        direccion,
        productos: carrito.map(i => ({
          nombre:   i.nombre,
          cantidad: i.cantidad,
          precio:   i.precio,
          subtotal: i.precio * i.cantidad,
        })),
        total: Cart.total(),
      });

      confirmOrder(orderNum, nombre, direccion);
    });
  }

  function confirmOrder(orderNum, nombre, direccion) {
    // Limpiar carrito
    Cart.clear();
    updateCartUI();

    // Mostrar pantalla de éxito
    checkoutBox.innerHTML = `
      <div class="order-success">
        <svg viewBox="0 0 24 24">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <h3>¡Pedido confirmado!</h3>
        <p>
          Gracias, <strong>${nombre}</strong>. Tu pedido ha sido recibido y se procesará en breve.
          Recibirás una llamada de confirmación al número proporcionado.
        </p>
        <div class="order-number-badge">${orderNum}</div>
        <p style="font-size:.8rem; color:var(--text-muted); margin-bottom:1.4rem;">
          Guarda este número de pedido para cualquier consulta.
          <br>Envío a: <strong style="color:var(--text-secondary)">${direccion}</strong>
        </p>
        <button class="btn-close-success" id="btn-close-success">Listo</button>
      </div>
    `;

    document.getElementById('btn-close-success').addEventListener('click', closeCheckoutModal);
  }

  function closeCheckoutModal() {
    checkoutOverlay.classList.remove('open');
  }

  checkoutOverlay.addEventListener('click', (e) => {
    if (e.target === checkoutOverlay) closeCheckoutModal();
  });

  // ── Modal de producto ─────────────────────────────────────
  function openModal(id) {
    // Abre el modal de detalle de producto usando la información del producto seleccionado.
    const p = DB.getById(id);
    if (!p) return;
    const addCartSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
    modalContent.innerHTML = `
      <div class="modal-img-wrap">
        <img src="${p.imagen}" alt="${p.nombre}">
      </div>
      <div class="modal-details">
        <div class="modal-marca">${p.marca}</div>
        <div class="modal-nombre">${p.nombre}</div>
        <div class="modal-desc">${p.descripcion}</div>
        <div class="modal-price">$${p.precio.toLocaleString('es-MX')} MXN</div>
        <div class="modal-stock">${p.stock === 0 ? 'Sin existencias' : `${p.stock} unidades disponibles`}</div>
        <button class="btn-modal-add" data-id="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>
          ${addCartSVG} Añadir al carrito
        </button>
      </div>
    `;
    modalContent.querySelector('.btn-modal-add')?.addEventListener('click', () => {
      addToCart(p.id);
      closeModal();
    });
    modalOverlay.classList.add('open');
  }

  function closeModal() { modalOverlay.classList.remove('open'); }
  btnCloseModal.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // ── Toast ─────────────────────────────────────────────────
  function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2700);
  }

  // ── Activo en links de navbar ─────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a, .nav-menu-mobile a');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 90) current = s.id;
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  });

  // ── Inicializar slider de precios (dinámico según catálogo) ──
  const maxPrecio = DB.getMaxPrecio();
  const maxSlider = Math.ceil(maxPrecio / 500) * 500; // redondear al siguiente 500
  filterPrecio.max   = maxSlider;
  filterPrecio.value = maxSlider;
  filterPrecioVal.textContent = `$${maxSlider.toLocaleString('es-MX')}`;

  // ── Render inicial ─────────────────────────────────────────
  renderProducts();
  updateCartUI();
});
