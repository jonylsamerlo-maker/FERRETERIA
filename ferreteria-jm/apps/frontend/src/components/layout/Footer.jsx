import "./Footer.css";

function Footer() {
    // Datos configurables para un cliente real.
    const contacto = {
        telefono: "(011) 4000-0000",
        whatsapp: "+54 9 11 4000-0000",
        correo: "contacto@ferreteriajm.com",
        direccion: ["Av. Principal 1234", "Ciudad (Demo)"],
    };

    const enlacesRapidos = [
        ["Inicio", "/"],
        ["Productos", "/productos"],
        ["Categorías", "/categorias"],
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

                    <section className="footer__section">
                        <h3 className="footer__heading">
                            Contacto
                        </h3>

                        <address className="footer__contact">
                            <p>
                                <strong>Teléfono</strong>
                                <a className="footer__link" href="tel:+541140000000">
                                    {contacto.telefono}
                                </a>
                            </p>

                            <p>
                                <strong>WhatsApp</strong>
                                <a className="footer__link" href="https://wa.me/5491140000000">
                                    {contacto.whatsapp}
                                </a>
                            </p>

                            <p>
                                <strong>Correo</strong>
                                <a className="footer__link" href={`mailto:${contacto.correo}`}>
                                    {contacto.correo}
                                </a>
                            </p>

                            <p>
                                <strong>Dirección</strong>
                                {contacto.direccion.map((linea) => (
                                    <span key={linea}>{linea}</span>
                                ))}
                            </p>
                        </address>
                    </section>

                    <section className="footer__section">
                        <h3 className="footer__heading">
                            Dónde encontrarnos
                        </h3>

                        <div className="footer__map">
                            {/* Reemplazar esta URL por la dirección real del cliente. */}
                            <iframe
                                title="Ubicación de demostración de Ferretería JM"
                                src="https://www.google.com/maps?q=Av.%20Principal%201234%2C%20Buenos%20Aires%2C%20Argentina&output=embed"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                allowFullScreen
                            />
                        </div>
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
