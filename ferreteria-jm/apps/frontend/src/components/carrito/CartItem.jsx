import {
  calcularSubtotal,
} from "../../services/cartStorage";

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Number(valor) || 0);
}

function CartItem({
  producto,
  onAumentar,
  onDisminuir,
  onEliminar,
}) {
  const sinStockDisponible =
    producto.cantidad >= producto.stock;

  return (
    <article className="cart-item">
      <div className="cart-item__image-container">
        {producto.imagen ? (
          <img
            className="cart-item__image"
            src={producto.imagen}
            alt={producto.nombre}
          />
        ) : (
          <div
            className="cart-item__image-placeholder"
            aria-hidden="true"
          >
            Sin imagen
          </div>
        )}
      </div>

      <div className="cart-item__content">
        <div className="cart-item__information">
          <h2 className="cart-item__title">
            {producto.nombre}
          </h2>

          <p className="cart-item__price">
            {formatearPrecio(producto.precio)}
          </p>

          <p className="cart-item__stock">
            Stock disponible: {producto.stock}
          </p>
        </div>

        <div className="cart-item__controls">
          <div
            className="cart-item__quantity"
            aria-label={`Cantidad de ${producto.nombre}`}
          >
            <button
              type="button"
              className="cart-item__quantity-button"
              onClick={() =>
                onDisminuir(producto.id)
              }
              aria-label={`Disminuir cantidad de ${producto.nombre}`}
            >
              −
            </button>

            <span
              className="cart-item__quantity-value"
              aria-live="polite"
            >
              {producto.cantidad}
            </span>

            <button
              type="button"
              className="cart-item__quantity-button"
              onClick={() =>
                onAumentar(producto.id)
              }
              disabled={sinStockDisponible}
              aria-label={`Aumentar cantidad de ${producto.nombre}`}
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="cart-item__remove"
            onClick={() => onEliminar(producto.id)}
          >
            Eliminar
          </button>
        </div>

        <p className="cart-item__subtotal">
          Subtotal:{" "}
          <strong>
            {formatearPrecio(
              calcularSubtotal(producto)
            )}
          </strong>
        </p>
      </div>
    </article>
  );
}

export default CartItem;