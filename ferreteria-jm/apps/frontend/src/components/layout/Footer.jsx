import "./Footer.css";

function Footer() {
    const enlacesRapidos = [
        ["Inicio", "/"],
        ["Productos", "/#productos"],
        ["Categorías", "/#categorias"],
        ["Iniciar sesión", "/login"],
    ];

    return (
        <footer className="footer">

            <div className="footer__container">

                <div className="footer__grid">

                    <section className="footer__section">
                        <h2 className="footer__title">
                            Ferretería JM
                        </h2>

                        <p className="footer__text">
                            Herramientas, materiales y soluciones para el hogar y la construcción.
                        </p>
                    </section>

                    <section className="footer__section">
                        <h3 className="footer__heading">
                            Enlaces rápidos
                        </h3>

                        <nav aria-label="Enlaces rápidos del pie de página">
                            <ul className="footer__links">
                                {enlacesRapidos.map(([texto, href]) => (
                                    <li key={href}>
                                        <a className="footer__link" href={href}>
                                            {texto}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </section>

                </div>

                <small className="footer__copyright">
                    © 2026 Ferretería JM. Todos los derechos reservados.
                </small>

            </div>

        </footer>
    );
}

export default Footer;
