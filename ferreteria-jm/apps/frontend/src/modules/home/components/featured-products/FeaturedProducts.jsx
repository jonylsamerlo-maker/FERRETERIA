import "./FeaturedProducts.css";
import ProductCard from "../product-card/ProductCard.index";

const products = [
  {
    id: 1,
    image: "https://via.placeholder.com/400x300?text=Taladro",
    title: "Taladro Bosch",
    description: "Taladro percutor de 800W.",
    price: "125.000",
  },
  {
    id: 2,
    image: "https://via.placeholder.com/400x300?text=Amoladora",
    title: "Amoladora",
    description: "Ideal para trabajos profesionales.",
    price: "98.000",
  },
  {
    id: 3,
    image: "https://via.placeholder.com/400x300?text=Martillo",
    title: "Martillo",
    description: "Acero forjado de alta resistencia.",
    price: "15.500",
  },
  {
    id: 4,
    image: "https://via.placeholder.com/400x300?text=Destornillador",
    title: "Destornillador",
    description: "Punta imantada de precisión.",
    price: "8.900",
  },
];

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