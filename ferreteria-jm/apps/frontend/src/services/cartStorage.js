export const CART_STORAGE_KEY = "ferreteria_jm_carrito";
export const CART_UPDATED_EVENT = "ferreteria-jm:cart-updated";

function navegadorDisponible() {
  return typeof window !== "undefined";
}

function normalizarNumero(valor, valorPorDefecto = 0) {
  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : valorPorDefecto;
}

function normalizarProducto(producto) {
  if (!producto) {
    return null;
  }

  const id =
    producto.id ??
    producto.producto_id ??
    producto.codigo ??
    null;

  if (id === null || id === undefined || id === "") {
    return null;
  }

  return {
    id: String(id),
    nombre:
      producto.nombre ??
      producto.title ??
      "Producto sin nombre",
    precio: Math.max(
      0,
      normalizarNumero(
        producto.precio ?? producto.price
      )
    ),
    imagen:
      producto.imagen ??
      producto.image ??
      "",
    stock: Math.max(
      0,
      normalizarNumero(producto.stock)
    ),
    cantidad: Math.max(
      1,
      Math.trunc(normalizarNumero(producto.cantidad, 1))
    ),
  };
}

function guardarCarritoSinNotificar(carrito) {
  if (!navegadorDisponible()) {
    return;
  }

  try {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(carrito)
    );
  } catch (error) {
    console.error(
      "No se pudo guardar el carrito:",
      error
    );
  }
}

export function obtenerCarrito() {
  if (!navegadorDisponible()) {
    return [];
  }

  try {
    const carritoGuardado =
      window.localStorage.getItem(CART_STORAGE_KEY);

    if (!carritoGuardado) {
      return [];
    }

    const datos = JSON.parse(carritoGuardado);

    if (!Array.isArray(datos)) {
      return [];
    }

    return datos
      .map(normalizarProducto)
      .filter(Boolean)
      .map((producto) => ({
        ...producto,
        cantidad:
          producto.stock > 0
            ? Math.min(
                producto.cantidad,
                producto.stock
              )
            : 0,
      }))
      .filter((producto) => producto.cantidad > 0);
  } catch {
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // No se pudo limpiar el storage corrupto.
    }

    return [];
  }
}

function normalizarCarrito(carrito) {
  if (!Array.isArray(carrito)) {
    return [];
  }

  return carrito
    .map(normalizarProducto)
    .filter(Boolean)
    .map((producto) => ({
      ...producto,
      cantidad:
        producto.stock > 0
          ? Math.min(producto.cantidad, producto.stock)
          : 0,
      }));
}

export function notificarActualizacionCarrito() {
  if (!navegadorDisponible()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, {
      detail: {
        carrito: obtenerCarrito(),
      },
    })
  );
}

export function guardarCarrito(carrito) {
  const carritoNormalizado =
    normalizarCarrito(carrito).filter(
      (producto) => producto.cantidad > 0
    );

  guardarCarritoSinNotificar(carritoNormalizado);
  notificarActualizacionCarrito();

  return carritoNormalizado;
}

export function agregarAlCarrito(producto) {
  const productoNormalizado =
    normalizarProducto(producto);

  if (!productoNormalizado) {
    return {
      ok: false,
      mensaje:
        "No se pudo identificar el producto.",
      carrito: obtenerCarrito(),
    };
  }

  if (productoNormalizado.stock <= 0) {
    return {
      ok: false,
      mensaje: "El producto no tiene stock disponible.",
      carrito: obtenerCarrito(),
    };
  }

  const carrito = obtenerCarrito();

  const indiceProducto = carrito.findIndex(
    (item) => item.id === productoNormalizado.id
  );

  if (indiceProducto === -1) {
    const nuevoCarrito = [
      ...carrito,
      {
        ...productoNormalizado,
        cantidad: 1,
      },
    ];

    guardarCarrito(nuevoCarrito);

    return {
      ok: true,
      mensaje: "Producto agregado al carrito.",
      carrito: nuevoCarrito,
    };
  }

  const productoActual = carrito[indiceProducto];
  const cantidadActual = Math.min(
    productoActual.cantidad,
    productoNormalizado.stock
  );

  if (cantidadActual >= productoNormalizado.stock) {
    return {
      ok: false,
      mensaje:
        "No podés agregar más unidades que el stock disponible.",
      carrito,
    };
  }

  const nuevoCarrito = carrito.map((item) =>
    item.id === productoNormalizado.id
      ? {
          ...item,
          cantidad: cantidadActual + 1,
          stock: productoNormalizado.stock,
          precio: productoNormalizado.precio,
          imagen: productoNormalizado.imagen,
          nombre: productoNormalizado.nombre,
        }
      : item
  );

  guardarCarrito(nuevoCarrito);

  return {
    ok: true,
    mensaje: "Cantidad actualizada.",
    carrito: nuevoCarrito,
  };
}

export function aumentarCantidad(productoId) {
  const id = String(productoId);
  const carrito = obtenerCarrito();

  const producto = carrito.find(
    (item) => item.id === id
  );

  if (!producto) {
    return carrito;
  }

  if (producto.cantidad >= producto.stock) {
    return carrito;
  }

  const nuevoCarrito = carrito.map((item) =>
    item.id === id
      ? {
          ...item,
          cantidad: item.cantidad + 1,
        }
      : item
  );

  return guardarCarrito(nuevoCarrito);
}

export function disminuirCantidad(productoId) {
  const id = String(productoId);
  const carrito = obtenerCarrito();

  const nuevoCarrito = carrito
    .map((item) =>
      item.id === id
        ? {
            ...item,
            cantidad: item.cantidad - 1,
          }
        : item
    )
    .filter((item) => item.cantidad > 0);

  return guardarCarrito(nuevoCarrito);
}

export function eliminarDelCarrito(productoId) {
  const id = String(productoId);

  const nuevoCarrito = obtenerCarrito().filter(
    (item) => item.id !== id
  );

  return guardarCarrito(nuevoCarrito);
}

export function vaciarCarrito() {
  return guardarCarrito([]);
}

export function calcularSubtotal(producto) {
  const precio = normalizarNumero(producto?.precio);
  const cantidad = normalizarNumero(
    producto?.cantidad
  );

  return precio * cantidad;
}

export function calcularTotal(carrito = obtenerCarrito()) {
  if (!Array.isArray(carrito)) {
    return 0;
  }

  return carrito.reduce(
    (total, producto) =>
      total + calcularSubtotal(producto),
    0
  );
}

export function obtenerCantidadTotal(
  carrito = obtenerCarrito()
) {
  if (!Array.isArray(carrito)) {
    return 0;
  }

  return carrito.reduce(
    (total, producto) =>
      total +
      Math.max(
        0,
        normalizarNumero(producto.cantidad)
      ),
    0
  );
}
