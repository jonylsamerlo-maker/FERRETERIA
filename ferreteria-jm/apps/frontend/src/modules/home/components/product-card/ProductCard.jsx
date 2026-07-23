import { useState } from "react";
import {
  agregarAlCarrito,
} from "../../../../services/cartStorage";
import "./ProductCard.css";

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
  const stockDisponible = Number(stock) || 0;
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
          ${price}
        </span>

        <div className="product-card__meta">
          {category && (
            <span className="product-card__category">
              {category}
            </span>
          )}

          <span className="product-card__stock">
            Stock: {stock}
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
