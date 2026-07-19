import "./ProductCard.css";

function ProductCard({
  image,
  title,
  description,
  price,
}) {
  return (
    <article className="product-card">

      <img
        src={image}
        alt={title}
        className="product-card__image"
      />

      <div className="product-card__content">

        <h3 className="product-card__title">
          {title}
        </h3>

        <p className="product-card__description">
          {description}
        </p>

        <span className="product-card__price">
          ${price}
        </span>

        <button className="product-card__button">
          Ver detalle
        </button>

      </div>

    </article>
  );
}

export default ProductCard;