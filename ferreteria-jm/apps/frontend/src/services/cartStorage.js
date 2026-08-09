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

  const stock = Math.max(
    0,
    normalizarNumero(producto.stock)
  );
  const disponible = producto.disponible !== false;
  const cantidadMinima = stock <= 0 || !disponible ? 0 : 1;

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
    stock,
    cantidad: Math.max(
      cantidadMinima,
      Math.trunc(normalizarNumero(producto.cantidad, 1))
    ),
    disponible,
    avisos: Array.isArray(producto.avisos)
      ? producto.avisos.filter(
          (aviso) => typeof aviso === "string" && aviso.trim()
        )
      : [],
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

    return datos.map(normalizarProducto).filter(Boolean);
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

  return carrito.map(normalizarProducto).filter(Boolean);
}

export function reconciliarCarrito(carrito, catalogoPublico) {
  const carritoActual = normalizarCarrito(carrito);
  const catalogo = Array.isArray(catalogoPublico)
    ? catalogoPublico
    : [];
  const productosPublicos = new Map(
    catalogo
      .map((producto) => {
        const id = producto?.producto_id ?? producto?.id;

        return id === null || id === undefined || id === ""
          ? null
          : [String(id), producto];
      })
      .filter(Boolean)
  );

  let huboCambios = false;

  const carritoReconciliado = carritoActual.map((producto) => {
    const productoActual = productosPublicos.get(producto.id);

    if (!productoActual) {
      const avisos = ["Este producto ya no está disponible públicamente."];

      if (
        producto.disponible !== false ||
        JSON.stringify(producto.avisos) !== JSON.stringify(avisos)
      ) {
        huboCambios = true;
      }

      return {
        ...producto,
        disponible: false,
        avisos,
      };
    }

    const stockActual = Math.max(
      0,
      normalizarNumero(productoActual.stock)
    );
    const precioActual = Math.max(
      0,
      normalizarNumero(productoActual.precio)
    );
    const avisos = [];
    let cantidad = producto.cantidad;

    if (stockActual < producto.stock) {
      if (cantidad > stockActual) {
        cantidad = stockActual;

        if (stockActual <= 0) {
          avisos.push("El producto se quedó sin stock.");
        } else {
          avisos.push(
            `La cantidad se ajustó a ${stockActual} por un cambio de stock.`
          );
        }
      } else {
        avisos.push(`El stock disponible cambió a ${stockActual}.`);
      }
    }

    if (precioActual !== producto.precio) {
      avisos.push("El precio fue actualizado según el catálogo actual.");
    }

    if (
      stockActual !== producto.stock ||
      precioActual !== producto.precio ||
      cantidad !== producto.cantidad ||
      producto.disponible === false ||
      JSON.stringify(producto.avisos) !== JSON.stringify(avisos)
    ) {
      huboCambios = true;
    }

    return {
      ...producto,
      stock: stockActual,
      precio: precioActual,
      cantidad,
      disponible: true,
      avisos,
    };
  });

  return {
    carrito: carritoReconciliado,
    huboCambios,
  };
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
  const carritoNormalizado = normalizarCarrito(carrito);

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

  if (
    producto.disponible === false ||
    producto.stock <= 0 ||
    producto.cantidad >= producto.stock
  ) {
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
