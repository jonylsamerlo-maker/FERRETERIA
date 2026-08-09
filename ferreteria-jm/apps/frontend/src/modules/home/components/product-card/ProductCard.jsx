import { useState } from "react";
import {
  agregarAlCarrito,
} from "../../../../services/cartStorage";
import "./ProductCard.css";

const UMBRAL_STOCK_BAJO = 5;

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Number(valor) || 0);
}

function obtenerEstadoStock(valor) {
  const numero = Number(valor);
  const stock = Number.isFinite(numero) ? numero : 0;

  if (stock <= 0) {
    return { stock, texto: "Sin stock", tipo: "empty" };
  }

  if (stock === 1) {
    return { stock, texto: "Última unidad", tipo: "low" };
  }

  if (stock < UMBRAL_STOCK_BAJO) {
    return {
      stock,
      texto: `Últimas ${stock} unidades`,
      tipo: "low",
    };
  }

  return { stock, texto: "Disponible", tipo: "available" };
}

function ProductCard({
  id,
  image,
  title,
  description,
  price,
  stock,
  category,
}) {
  const [mensaje, setMensaje] = useState("");
  const estadoStock = obtenerEstadoStock(stock);
  const stockDisponible = estadoStock.stock;
  const sinStock = stockDisponible <= 0;

  const handleAgregarAlCarrito = () => {
    const resultado = agregarAlCarrito({
      id,
      nombre: title,
      precio: Number(price) || 0,
      imagen: image,
      stock: stockDisponible,
    });

    setMensaje(resultado.mensaje);
  };

  return (
    <article className="product-card">

      {image && (
        <img
          src={image}
          alt={title}
          className="product-card__image"
        />
      )}

      <div className="product-card__content">

        <h3 className="product-card__title">
          {title}
        </h3>

        {description && (
          <p className="product-card__description">
            {description}
          </p>
        )}

        <span className="product-card__price">
          {formatearPrecio(price)}
        </span>

        <div className="product-card__meta">
          {category && (
            <span className="product-card__category">
              {category}
            </span>
          )}

          <span
            className={`product-card__stock product-card__stock--${estadoStock.tipo}`}
          >
            {estadoStock.texto}
          </span>
        </div>

        <button
          className="product-card__button"
          type="button"
          onClick={handleAgregarAlCarrito}
          disabled={sinStock}
        >
          {sinStock ? "Sin stock" : "Agregar al carrito"}
        </button>

        {mensaje && (
          <p
            className="product-card__message"
            role="status"
          >
            {mensaje}
          </p>
        )}

      </div>

    </article>
  );
}

export default ProductCard;
