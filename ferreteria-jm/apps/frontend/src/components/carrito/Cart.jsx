import { useEffect, useState } from "react";
import {
  CART_STORAGE_KEY,
  CART_UPDATED_EVENT,
  aumentarCantidad,
  calcularTotal,
  disminuirCantidad,
  eliminarDelCarrito,
  obtenerCarrito,
  vaciarCarrito,
} from "../../services/cartStorage";
import {
  abrirPedidoEnWhatsApp,
} from "../../utils/whatsapp";
import CartItem from "./CartItem";
import "./Cart.css";

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Number(valor) || 0);
}

function Cart() {
  const [carrito, setCarrito] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const actualizarCarrito = () => {
    setCarrito(obtenerCarrito());
  };

  useEffect(() => {
    actualizarCarrito();

    const manejarActualizacion = () => {
      actualizarCarrito();
    };

    const manejarStorage = (event) => {
      if (
        event.key === null ||
        event.key === CART_STORAGE_KEY
      ) {
        actualizarCarrito();
      }
    };

    window.addEventListener(
      CART_UPDATED_EVENT,
      manejarActualizacion
    );

    window.addEventListener(
      "storage",
      manejarStorage
    );

    return () => {
      window.removeEventListener(
        CART_UPDATED_EVENT,
        manejarActualizacion
      );

      window.removeEventListener(
        "storage",
        manejarStorage
      );
    };
  }, []);

  const handleAumentar = (productoId) => {
    const nuevoCarrito =
      aumentarCantidad(productoId);

    setCarrito(nuevoCarrito);
    setMensaje("");
  };

  const handleDisminuir = (productoId) => {
    const nuevoCarrito =
      disminuirCantidad(productoId);

    setCarrito(nuevoCarrito);
    setMensaje("");
  };

  const handleEliminar = (productoId) => {
    const nuevoCarrito =
      eliminarDelCarrito(productoId);

    setCarrito(nuevoCarrito);
    setMensaje("Producto eliminado del carrito.");
  };

  const handleVaciar = () => {
    const confirmar = window.confirm(
      "¿Seguro que querés vaciar el carrito?"
    );

    if (!confirmar) {
      return;
    }

    const nuevoCarrito = vaciarCarrito();

    setCarrito(nuevoCarrito);
    setMensaje("El carrito fue vaciado.");
  };

  const handleWhatsApp = () => {
    const resultado =
      abrirPedidoEnWhatsApp(carrito);

    setMensaje(resultado.mensaje);
  };

  const total = calcularTotal(carrito);

  if (carrito.length === 0) {
    return (
      <section className="cart">
        <div className="cart__header">
          <p className="cart__eyebrow">
            Ferretería JM
          </p>

          <h1 className="cart__title">
            Tu carrito
          </h1>
        </div>

        <div className="cart__empty">
          <h2 className="cart__empty-title">
            El carrito está vacío
          </h2>

          <p className="cart__empty-text">
            Agregá productos desde la página de inicio
            para preparar tu pedido.
          </p>

          <a className="cart__continue-link" href="/">
            Ver productos
          </a>

          {mensaje && (
            <p
              className="cart__message"
              role="status"
            >
              {mensaje}
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="cart">
      <div className="cart__header">
        <div>
          <p className="cart__eyebrow">
            Ferretería JM
          </p>

          <h1 className="cart__title">
            Tu carrito
          </h1>
        </div>

        <button
          type="button"
          className="cart__clear-button"
          onClick={handleVaciar}
        >
          Vaciar carrito
        </button>
      </div>

      {mensaje && (
        <p
          className="cart__message"
          role="status"
        >
          {mensaje}
        </p>
      )}

      <div className="cart__layout">
        <div className="cart__items">
          {carrito.map((producto) => (
            <CartItem
              key={producto.id}
              producto={producto}
              onAumentar={handleAumentar}
              onDisminuir={handleDisminuir}
              onEliminar={handleEliminar}
            />
          ))}
        </div>

        <aside className="cart__summary">
          <h2 className="cart__summary-title">
            Resumen del pedido
          </h2>

          <div className="cart__summary-row">
            <span>Productos diferentes</span>
            <span>{carrito.length}</span>
          </div>

          <div className="cart__summary-row cart__summary-row--total">
            <span>Total</span>
            <strong>
              {formatearPrecio(total)}
            </strong>
          </div>

          <button
            type="button"
            className="cart__whatsapp-button"
            onClick={handleWhatsApp}
          >
            Finalizar pedido por WhatsApp
          </button>

          <a className="cart__continue-link" href="/">
            Seguir comprando
          </a>

          <p className="cart__summary-note">
            El pedido será enviado por WhatsApp. No se
            realizará ningún pago desde este sitio.
          </p>
        </aside>
      </div>
    </section>
  );
}

export default Cart;
