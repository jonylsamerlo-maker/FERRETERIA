import {
  buscarProductoPorMensaje,
  buscarProductosPorPalabras,
  formatearPrecio,
  obtenerCategoriaProducto,
  obtenerNombreProducto,
  obtenerPrecioProducto,
  obtenerProductoMasBarato,
  obtenerProductosEnOferta,
  obtenerStockProducto,
  normalizarTexto,
  tieneStock,
} from "../utils/chatbotUtils.js";

const contieneAlgunaPalabra = (mensaje, palabras) =>
  palabras.some((palabra) => mensaje.includes(palabra));

const listarProductosBrevemente = (productos = [], limite = 3) =>
  productos
    .slice(0, limite)
    .map(
      (producto) =>
        `${obtenerNombreProducto(producto)} (${formatearPrecio(
          obtenerPrecioProducto(producto),
        )})`,
    )
    .join(", ");

const crearRespuestaDeProducto = (producto) => {
  const nombre = obtenerNombreProducto(producto);
  const precio = formatearPrecio(obtenerPrecioProducto(producto));
  const stock = obtenerStockProducto(producto);
  const categoria = obtenerCategoriaProducto(producto);

  if (!tieneStock(producto)) {
    return {
      text: `Tenemos ${nombre} a ${precio}, pero actualmente figura sin stock.`,
      product: null,
      action: null,
    };
  }

  return {
    text: `Sí, tenemos ${nombre} a ${precio}. Pertenece a ${categoria} y quedan ${stock} unidades. ¿Querés agregarlo al carrito?`,
    product: producto,
    action: "confirm_add_to_cart",
  };
};

export const obtenerRespuestaChatbot = ({
  mensaje,
  productos = [],
  pendingAction = null,
}) => {
  const texto = normalizarTexto(mensaje);

  if (!texto) {
    return {
      text: "Escribime una consulta para poder ayudarte.",
      action: null,
      product: null,
    };
  }

  if (pendingAction?.type === "add_to_cart") {
    const respuestasPositivas = [
      "si",
      "sí",
      "dale",
      "ok",
      "agregar",
      "agregalo",
      "agregalo al carrito",
    ];

    const respuestasNegativas = [
      "no",
      "cancelar",
      "dejalo",
      "mejor no",
    ];

    if (respuestasPositivas.some((respuesta) => texto === respuesta)) {
      return {
        text: `Producto confirmado: ${obtenerNombreProducto(
          pendingAction.product,
        )}.`,
        action: "add_to_cart",
        product: pendingAction.product,
      };
    }

    if (respuestasNegativas.some((respuesta) => texto === respuesta)) {
      return {
        text: "Está bien, no lo agrego al carrito.",
        action: "cancel_add_to_cart",
        product: null,
      };
    }
  }

  if (
    contieneAlgunaPalabra(texto, [
      "hola",
      "buen dia",
      "buenas",
      "buenas tardes",
      "buenas noches",
    ])
  ) {
    return {
      text: "Hola, soy el asistente de Ferretería JM. Puedo ayudarte a buscar productos, consultar precios, stock, ofertas y preparar tu pedido.",
      action: null,
      product: null,
    };
  }

  if (
    contieneAlgunaPalabra(texto, [
      "ayuda",
      "que podes hacer",
      "como funciona",
    ])
  ) {
    return {
      text: "Podés preguntarme por un producto, precio, stock, categoría, descripción, ofertas especiales, el producto más barato, carrito o cómo finalizar el pedido por WhatsApp.",
      action: null,
      product: null,
    };
  }

  if (
    contieneAlgunaPalabra(texto, [
      "barato",
      "mas economico",
      "menor precio",
    ])
  ) {
    const producto = obtenerProductoMasBarato(productos);

    if (!producto) {
      return {
        text: "No encontré productos con un precio válido.",
        action: null,
        product: null,
      };
    }

    return {
      text: `El producto más económico es ${obtenerNombreProducto(
        producto,
      )}, con un precio de ${formatearPrecio(
        obtenerPrecioProducto(producto),
      )}.`,
      action: null,
      product,
    };
  }

  if (
    contieneAlgunaPalabra(texto, [
      "oferta",
      "ofertas",
      "promocion",
      "promociones",
    ])
  ) {
    const ofertas = obtenerProductosEnOferta(productos);

    if (ofertas.length === 0) {
      return {
        text: "Actualmente no encontré productos en la categoría Ofertas Especiales.",
        action: null,
        product: null,
      };
    }

    return {
      text: `Estas son algunas ofertas: ${listarProductosBrevemente(
        ofertas,
      )}.`,
      action: null,
      product: null,
    };
  }

  if (
    contieneAlgunaPalabra(texto, [
      "whatsapp",
      "pedido",
      "finalizar pedido",
      "encargar",
    ])
  ) {
    return {
      text: "Cuando tengas tu carrito listo, podés finalizar el pedido desde la página del carrito y enviarlo por WhatsApp con los productos y cantidades.",
      action: null,
      product: null,
    };
  }

  if (
    contieneAlgunaPalabra(texto, [
      "carrito",
      "comprar",
      "agregar producto",
    ])
  ) {
    return {
      text: "Podés agregar productos desde las tarjetas del catálogo. También podés escribirme el nombre de un producto y te preguntaré si querés agregarlo.",
      action: null,
      product: null,
    };
  }

  if (
    contieneAlgunaPalabra(texto, [
      "producto",
      "productos",
      "catalogo",
      "herramienta",
      "herramientas",
    ]) &&
    productos.length === 0
  ) {
    return {
      text: "En este momento no pude encontrar productos cargados.",
      action: null,
      product: null,
    };
  }

  const productoExacto = buscarProductoPorMensaje(productos, texto);

  if (productoExacto) {
    return crearRespuestaDeProducto(productoExacto);
  }

  const coincidencias = buscarProductosPorPalabras(productos, texto);

  if (coincidencias.length === 1) {
    return crearRespuestaDeProducto(coincidencias[0]);
  }

  if (coincidencias.length > 1) {
    return {
      text: `Encontré varias opciones: ${listarProductosBrevemente(
        coincidencias,
      )}. Escribime el nombre de una para consultar sus detalles.`,
      action: null,
      product: null,
    };
  }

  if (contieneAlgunaPalabra(texto, ["precio", "cuanto sale"])) {
    return {
      text: "Decime el nombre del producto y te informo su precio.",
      action: null,
      product: null,
    };
  }

  if (
    contieneAlgunaPalabra(texto, [
      "descripcion",
      "descripción",
      "detalle",
      "detalles",
    ])
  ) {
    return {
      text: "Decime qué producto querés revisar y te cuento su descripción si está cargada.",
      action: null,
      product: null,
    };
  }

  if (
    contieneAlgunaPalabra(texto, [
      "categoria",
      "categoría",
      "rubro",
    ])
  ) {
    return {
      text: "Podés decirme una categoría o el nombre de un producto y te ayudo a encontrar opciones disponibles.",
      action: null,
      product: null,
    };
  }

  if (contieneAlgunaPalabra(texto, ["stock", "disponible", "hay"])) {
    return {
      text: "Decime qué producto buscás y reviso su disponibilidad.",
      action: null,
      product: null,
    };
  }

  return {
    text: "No pude identificar la consulta. Probá escribiendo el nombre de un producto o preguntame por precios, stock, ofertas o carrito.",
    action: null,
    product: null,
  };
};
