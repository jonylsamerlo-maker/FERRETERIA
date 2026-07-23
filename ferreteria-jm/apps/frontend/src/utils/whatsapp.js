import {
  calcularSubtotal,
  calcularTotal,
} from "../services/cartStorage";

export const WHATSAPP_NUMBER = "5491139248986";

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Number(valor) || 0);
}

export function generarMensajeWhatsApp(carrito) {
  if (!Array.isArray(carrito) || carrito.length === 0) {
    return "";
  }

  const productos = carrito.map((producto, indice) => {
    const subtotal = calcularSubtotal(producto);

    return [
      `${indice + 1}. ${producto.nombre}`,
      `Cantidad: ${producto.cantidad}`,
      `Precio unitario: ${formatearPrecio(
        producto.precio
      )}`,
      `Subtotal: ${formatearPrecio(subtotal)}`,
    ].join("\n");
  });

  const total = calcularTotal(carrito);

  return [
    "Hola, Ferretería JM.",
    "",
    "Quisiera realizar el siguiente pedido:",
    "",
    productos.join("\n\n"),
    "",
    `Total: ${formatearPrecio(total)}`,
    "",
    "Quedo a la espera de la confirmación. Gracias.",
  ].join("\n");
}

export function generarUrlWhatsApp(carrito) {
  const mensaje = generarMensajeWhatsApp(carrito);

  if (!mensaje) {
    return "";
  }

  const numero = WHATSAPP_NUMBER.replace(/\D/g, "");

  if (!numero || numero.includes("XXXXXXXX")) {
    return "";
  }

  return `https://wa.me/${numero}?text=${encodeURIComponent(
    mensaje
  )}`;
}

export function abrirPedidoEnWhatsApp(carrito) {
  if (typeof window === "undefined") {
    return {
      ok: false,
      mensaje:
        "WhatsApp solo puede abrirse desde el navegador.",
    };
  }

  const url = generarUrlWhatsApp(carrito);

  if (!url) {
    return {
      ok: false,
      mensaje:
        "Configurá el número de WhatsApp antes de enviar el pedido.",
    };
  }

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

  return {
    ok: true,
    mensaje: "Pedido preparado para WhatsApp.",
  };
}
