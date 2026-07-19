import "./Categories.css";

const categories = [
  {
    id: 1,
    icon: "🔨",
    title: "Herramientas",
    description: "Manual y eléctricas",
  },
  {
    id: 2,
    icon: "⚡",
    title: "Electricidad",
    description: "Cables y accesorios",
  },
  {
    id: 3,
    icon: "🚿",
    title: "Plomería",
    description: "Caños y conexiones",
  },
  {
    id: 4,
    icon: "🎨",
    title: "Pintura",
    description: "Pinceles y pinturas",
  },
  {
    id: 5,
    icon: "🧱",
    title: "Construcción",
    description: "Materiales y herramientas",
  },
  {
    id: 6,
    icon: "🌱",
    title: "Jardín",
    description: "Riego y mantenimiento",
  },
];

function Categories() {
  return (
    <section className="categories">

      <div className="categories__container">

        <h2 className="categories__title">
          Explorar categorías
        </h2>

        <p className="categories__subtitle">
          Encontrá rápidamente lo que necesitás.
        </p>

        <div className="categories__grid">

          {categories.map((category) => (

            <article
              key={category.id}
              className="categories__card"
            >

              <span className="categories__icon">
                {category.icon}
              </span>

              <h3 className="categories__card-title">
                {category.title}
              </h3>

              <p className="categories__description">
                {category.description}
              </p>

            </article>

          ))}

        </div>

      </div>

    </section>
  );
}

export default Categories;