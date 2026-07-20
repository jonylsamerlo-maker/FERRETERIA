import "./ProductCard.css";

function ProductCard({
  image,
  title,
  description,
  price,
  stock,
  category,
}) {
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

        <button className="product-card__button">
          Ver detalle
        </button>

      </div>

    </article>
  );
}

export default ProductCard;
