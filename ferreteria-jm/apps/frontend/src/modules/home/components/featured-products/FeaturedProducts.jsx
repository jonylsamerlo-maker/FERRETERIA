import "./FeaturedProducts.css";
import ProductCard from "../product-card/ProductCard.index";
import products from "../../../../data/products";




function FeaturedProducts() {
  return (
    <section className="featured-products">

      <h2 className="featured-products__title">
        Productos destacados
      </h2>

      <div className="featured-products__grid">

        {products.map((product) => (
          <ProductCard
            key={product.id}
            image={product.image}
            title={product.title}
            description={product.description}
            price={product.price}
          />
        ))}

      </div>

    </section>
  );
}

export default FeaturedProducts;
