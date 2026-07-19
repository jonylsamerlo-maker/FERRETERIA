import Hero from "../../../components/hero/Hero.index";
import Carousel from "../../../components/carousel/Carousel.index";
import Categories from "../../../components/categories/Categories.index";
import FeaturedProducts from "../components/featured-products/FeaturedProducts.index";

import "./Home.css";

function Home() {
  return (
    <section className="home">

      <Hero />

      <Carousel />

      <Categories />

      <FeaturedProducts />

    </section>
  );
}

export default Home;
