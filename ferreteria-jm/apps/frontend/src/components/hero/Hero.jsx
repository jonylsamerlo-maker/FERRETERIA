import "./Hero.css";

function Hero() {
    return (
        <section className="hero">

            <div className="hero__content">

                <span className="hero__subtitle">
                    Bienvenido
                </span>

                <h1 className="hero__title">
                    Ferretería JM
                </h1>

                <p className="hero__description">
                    Todo para la construcción, el hogar y la industria.
                </p>

                <a className="hero__button" href="/#productos">
                    Ver productos
                </a>

            </div>

        </section>
    );
}

export default Hero;
