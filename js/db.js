/**
 * db.js — Base de Datos Simulada en LocalStorage
 * Tlapalería Esmeralda
 */

const DB_KEY = 'esmeralda_productos';

// Datos iniciales de ejemplo que se cargan en localStorage la primera vez
// que se abre la aplicación. Representan productos de la tlapalería.
const PRODUCTOS_INICIALES = [
  {
    id: 1,
    nombre: 'Rotomartillo SDS-Plus 900W',
    descripcion: 'Motor de 900W, 3 modos de operación (taladro, martillo, cincel). Ideal para concreto y mampostería. Incluye maletín y brocas SDS.',
    precio: 2850,
    stock: 12,
    categoria: 'construccion',
    marca: 'Bosch',
    imagen: 'img/rotomartillo_pro.png',
  },
  {
    id: 2,
    nombre: 'Esmeriladora Angular 4½" 1400W',
    descripcion: 'Motor 1400W, disco de 4½", velocidad sin carga 11,000 RPM. Cuerpo ergonómico con protección anti-vibración. Perfecta para corte y desbaste.',
    precio: 980,
    stock: 25,
    categoria: 'construccion',
    marca: 'Dewalt',
    imagen: 'img/esmeriladora_pro.png',
  },
  {
    id: 3,
    nombre: 'Taladro Inalámbrico 20V Max',
    descripcion: 'Motor sin escobillas de 20V, 2 velocidades (0-450 / 0-1500 RPM), 15 posiciones de torque. Batería de ion-litio incluida con cargador rápido.',
    precio: 1650,
    stock: 18,
    categoria: 'electricidad',
    marca: 'Milwaukee',
    imagen: 'img/taladro_inalambrico.png',
  },
  {
    id: 4,
    nombre: 'Caja de Herramientas Profesional 26"',
    descripcion: 'Gabinete rodante de acero calibre 24 con 5 cajones y cerradura doble. Capacidad de 200 kg. Ruedas de 3" para mayor movilidad.',
    precio: 3200,
    stock: 7,
    categoria: 'otros',
    marca: 'Stanley',
    imagen: 'img/caja_herramientas.png',
  },
];

const DB_INIT_FLAG = 'esmeralda_inicializado';

// Objeto DB: gestiona lectura, escritura y consulta de productos en localStorage.
const DB = {
  init() {
    // Solo cargar productos iniciales la PRIMERA vez que se abre la app.
    // Después de eso, respetar lo que el admin haga (agregar/borrar).
    if (!localStorage.getItem(DB_INIT_FLAG)) {
      localStorage.setItem(DB_KEY, JSON.stringify(PRODUCTOS_INICIALES));
      localStorage.setItem(DB_INIT_FLAG, 'true');
      return;
    }
    // Si ya fue inicializado pero los datos están corruptos, reparar
    try {
      const datos = JSON.parse(localStorage.getItem(DB_KEY));
      if (!Array.isArray(datos)) throw new Error('corrupto');
    } catch (e) {
      localStorage.setItem(DB_KEY, JSON.stringify(PRODUCTOS_INICIALES));
    }
  },

  getAll() {
    return JSON.parse(localStorage.getItem(DB_KEY)) || [];
  },

  getById(id) {
    return this.getAll().find(p => p.id === Number(id));
  },

  add(producto) {
    const productos = this.getAll();
    const nextId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;
    const nuevo = { ...producto, id: nextId };
    productos.push(nuevo);
    localStorage.setItem(DB_KEY, JSON.stringify(productos));
    return nuevo;
  },

  update(id, datos) {
    let productos = this.getAll();
    const idx = productos.findIndex(p => p.id === Number(id));
    if (idx === -1) return null;
    productos[idx] = { ...productos[idx], ...datos };
    localStorage.setItem(DB_KEY, JSON.stringify(productos));
    return productos[idx];
  },

  delete(id) {
    let productos = this.getAll();
    productos = productos.filter(p => p.id !== Number(id));
    localStorage.setItem(DB_KEY, JSON.stringify(productos));
  },

  reset() {
    localStorage.setItem(DB_KEY, JSON.stringify(PRODUCTOS_INICIALES));
  },

  // Aplica los filtros seleccionados y la búsqueda de texto al catálogo de productos.
  filter({ categoria, marca, precioMax, query }) {
    let productos = this.getAll();
    if (categoria && categoria !== 'todos') {
      productos = productos.filter(p => p.categoria === categoria);
    }
    if (marca && marca !== 'todas') {
      productos = productos.filter(p => p.marca.toLowerCase() === marca.toLowerCase());
    }
    // Solo aplicar filtro de precio si el slider no está en su máximo
    // para evitar ocultar productos con precio mayor al máximo inicial
    if (precioMax && Number(precioMax) < this.getMaxPrecio()) {
      productos = productos.filter(p => p.precio <= Number(precioMax));
    }
    if (query) {
      const q = query.toLowerCase();
      productos = productos.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q) ||
        p.marca.toLowerCase().includes(q)
      );
    }
    return productos;
  },

  // Retorna el precio máximo entre todos los productos en catálogo
  getMaxPrecio() {
    const todos = this.getAll();
    if (todos.length === 0) return 5000;
    return Math.max(...todos.map(p => p.precio));
  },
};

// Carro de Compras
const CART_KEY = 'esmeralda_carrito';

// Objeto Cart: gestiona el carrito de compras en localStorage.
const Cart = {
  // Devuelve el contenido actual del carrito desde localStorage.
  get() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  },

  add(productoId, cantidad = 1) {
    const carrito = this.get();
    const producto = DB.getById(productoId);
    if (!producto) return;
    const existing = carrito.find(i => i.id === productoId);
    if (existing) {
      existing.cantidad += cantidad;
    } else {
      carrito.push({ id: productoId, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen, cantidad });
    }
    localStorage.setItem(CART_KEY, JSON.stringify(carrito));
    return carrito;
  },

  remove(productoId) {
    let carrito = this.get().filter(i => i.id !== productoId);
    localStorage.setItem(CART_KEY, JSON.stringify(carrito));
    return carrito;
  },

  clear() {
    localStorage.removeItem(CART_KEY);
  },

  total() {
    return this.get().reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  },

  count() {
    return this.get().reduce((sum, i) => sum + i.cantidad, 0);
  },
};

// ── Pedidos (Orders) ──────────────────────────────────────
const ORDERS_KEY = 'esmeralda_pedidos';

// Objeto Orders: gestiona el historial de pedidos guardados en localStorage.
const Orders = {
  getAll() {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  },

  getById(orderNum) {
    return this.getAll().find(o => o.numero === orderNum);
  },

  add(order) {
    const pedidos = this.getAll();
    pedidos.unshift(order); // Más recientes primero
    localStorage.setItem(ORDERS_KEY, JSON.stringify(pedidos));
    return order;
  },

  updateStatus(orderNum, newStatus) {
    const pedidos = this.getAll();
    const idx = pedidos.findIndex(o => o.numero === orderNum);
    if (idx === -1) return null;
    pedidos[idx].estado = newStatus;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(pedidos));
    return pedidos[idx];
  },

  delete(orderNum) {
    let pedidos = this.getAll().filter(o => o.numero !== orderNum);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(pedidos));
  },

  // Estadísticas para el dashboard
  stats() {
    const pedidos = this.getAll();
    const total = pedidos.length;
    const pendientes = pedidos.filter(o => o.estado === 'pendiente').length;
    const procesando = pedidos.filter(o => o.estado === 'procesando').length;
    const completados = pedidos.filter(o => o.estado === 'completado').length;
    const cancelados = pedidos.filter(o => o.estado === 'cancelado').length;
    const ingresos = pedidos
      .filter(o => o.estado !== 'cancelado')
      .reduce((sum, o) => sum + o.total, 0);
    return { total, pendientes, procesando, completados, cancelados, ingresos };
  },
};
