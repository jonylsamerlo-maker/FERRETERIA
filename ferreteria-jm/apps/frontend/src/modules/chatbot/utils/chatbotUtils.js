const quitarAcentos = (texto = "") =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const normalizarTexto = (texto = "") =>
  quitarAcentos(String(texto))
    .trim()
    .toLowerCase();

export const obtenerIdProducto = (producto = {}) =>
  producto.producto_id ?? producto.id ?? producto.codigo ?? producto.nombre;

export const obtenerNombreProducto = (producto = {}) =>
  producto.nombre ?? producto.name ?? "Producto sin nombre";

export const obtenerPrecioProducto = (producto = {}) => {
  const precio = Number(producto.precio ?? producto.price ?? 0);

  return Number.isFinite(precio) ? precio : 0;
};

export const obtenerStockProducto = (producto = {}) => {
  const stock = Number(producto.stock ?? 0);

  return Number.isFinite(stock) ? stock : 0;
};

export const obtenerCategoriaProducto = (producto = {}) =>
  producto.categoria ??
  producto.nombre_categoria ??
  producto.categoria_nombre ??
  producto.category ??
  "Sin categoría";

export const formatearPrecio = (precio) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(Number(precio) || 0);

export const tieneStock = (producto = {}) =>
  obtenerStockProducto(producto) > 0;

export const buscarProductoPorMensaje = (productos = [], mensaje = "") => {
  const mensajeNormalizado = normalizarTexto(mensaje);

  if (!mensajeNormalizado || !Array.isArray(productos)) {
    return null;
  }

  return (
    productos.find((producto) => {
      const nombre = normalizarTexto(obtenerNombreProducto(producto));

      return (
        nombre.length >= 3 &&
        (mensajeNormalizado.includes(nombre) ||
          nombre.includes(mensajeNormalizado))
      );
    }) ?? null
  );
};

export const buscarProductosPorPalabras = (
  productos = [],
  mensaje = "",
) => {
  const palabrasIgnoradas = new Set([
    "tenes",
    "tienen",
    "quiero",
    "busco",
    "necesito",
    "producto",
    "productos",
    "precio",
    "cuanto",
    "sale",
    "hay",
    "una",
    "uno",
    "unos",
    "unas",
    "para",
    "con",
    "del",
    "las",
    "los",
    "que",
  ]);

  const palabras = normalizarTexto(mensaje)
    .split(/\s+/)
    .filter((palabra) => palabra.length >= 3)
    .filter((palabra) => !palabrasIgnoradas.has(palabra));

  if (palabras.length === 0 || !Array.isArray(productos)) {
    return [];
  }

  return productos.filter((producto) => {
    const nombre = normalizarTexto(obtenerNombreProducto(producto));
    const categoria = normalizarTexto(
      obtenerCategoriaProducto(producto),
    );
    const descripcion = normalizarTexto(
      producto.descripcion ?? producto.description ?? "",
    );

    return palabras.some(
      (palabra) =>
        nombre.includes(palabra) ||
        categoria.includes(palabra) ||
        descripcion.includes(palabra),
    );
  });
};

export const obtenerProductoMasBarato = (productos = []) => {
  if (!Array.isArray(productos) || productos.length === 0) {
    return null;
  }

  const productosValidos = productos.filter(
    (producto) => obtenerPrecioProducto(producto) > 0,
  );

  if (productosValidos.length === 0) {
    return null;
  }

  return productosValidos.reduce((masBarato, producto) =>
    obtenerPrecioProducto(producto) <
    obtenerPrecioProducto(masBarato)
      ? producto
      : masBarato,
  );
};

export const obtenerProductosEnOferta = (productos = []) =>
  productos.filter(
    (producto) =>
      normalizarTexto(obtenerCategoriaProducto(producto)) ===
      "ofertas especiales",
  );