import "./Navbar.css";
import { useEffect, useState } from "react";
import { logoutUsuario } from "../../modules/auth/services/usuarioApi";
import { getCategorias } from "../../modules/categorias/services/categoriaApi";
import {
    CART_STORAGE_KEY,
    CART_UPDATED_EVENT,
    obtenerCantidadTotal,
    obtenerCarrito,
} from "../../services/cartStorage";

function obtenerUsuarioGuardado() {
    if (typeof window === "undefined") {
        return null;
    }

    // Intenta obtener el usuario desde localStorage primero, luego sessionStorage.
    const claves = [
        { store: localStorage, key: "usuario" },
        { store: sessionStorage, key: "usuario" },
        { store: localStorage, key: "user" },
        { store: sessionStorage, key: "user" },
    ];

    for (const item of claves) {
        try {
            const raw = item.store.getItem(item.key);
            if (!raw) continue;

            // El usuario guardado debe ser JSON válido.
            try {
                return JSON.parse(raw);
            } catch {
                item.store.removeItem(item.key);
                continue;
            }
        } catch (e) {
            // Ignorar y continuar con la siguiente fuente.
            continue;
        }
    }

    return null;
}

function Navbar() {
    const [usuario, setUsuario] = useState(null);
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [categoriasAbiertas, setCategoriasAbiertas] = useState(false);
    const [cantidadCarrito, setCantidadCarrito] = useState(0);
    const [tema, setTema] = useState("light");
    const [categorias, setCategorias] = useState([]);
    const [cargandoCategorias, setCargandoCategorias] = useState(false);

    useEffect(() => {
        setUsuario(obtenerUsuarioGuardado());
        setCantidadCarrito(
            Math.max(0, obtenerCantidadTotal(obtenerCarrito()))
        );
        const temaActual = document.documentElement.getAttribute("data-theme");

        if (temaActual === "dark" || temaActual === "light") {
            setTema(temaActual);
        }

        const actualizarCantidadCarrito = () => {
            setCantidadCarrito(
                Math.max(0, obtenerCantidadTotal(obtenerCarrito()))
            );
        };

        // Actualiza el estado del usuario si cambia en otra pestaña (evento storage)
        const onStorage = (e) => {
            if (e.key === "usuario" || e.key === "user") {
                setUsuario(obtenerUsuarioGuardado());
            }

            if (e.key === CART_STORAGE_KEY || e.key === null) {
                actualizarCantidadCarrito();
            }
        };

        // También refrescar al volver foco a la ventana (por si se actualizó en la misma pestaña)
        const onFocus = () => {
            setUsuario(obtenerUsuarioGuardado());
            actualizarCantidadCarrito();
        };

        const cargarCategorias = async () => {
            try {
                setCargandoCategorias(true);
                const data = await getCategorias();
                setCategorias(Array.isArray(data) ? data : []);
            } catch {
                setCategorias([]);
            } finally {
                setCargandoCategorias(false);
            }
        };

        cargarCategorias();
        window.addEventListener("storage", onStorage);
        window.addEventListener("focus", onFocus);
        window.addEventListener(
            CART_UPDATED_EVENT,
            actualizarCantidadCarrito
        );

        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("focus", onFocus);
            window.removeEventListener(
                CART_UPDATED_EVENT,
                actualizarCantidadCarrito
            );
        };
    }, []);

    const alternarTema = () => {
        const nuevoTema = tema === "light" ? "dark" : "light";

        document.documentElement.setAttribute("data-theme", nuevoTema);
        try {
            localStorage.setItem("tema", nuevoTema);
        } catch {
            // Si el almacenamiento falla, el tema igual cambia en la sesión actual.
        }
        setTema(nuevoTema);
    };

    const rol = usuario?.rol?.trim().toUpperCase();
    const esAdmin = rol === "ADMIN";
    const estaAutenticado = Boolean(usuario);
    const categoriasVisibles = categorias.filter(
        (categoria) =>
            categoria.nombre?.trim().toLowerCase() !== "ofertas especiales"
    );

    const handleLogout = async () => {
        setMenuAbierto(false);

        try {
            await logoutUsuario();
        } catch {
            // Si el backend no responde, igualmente se limpia el estado local.
        }

        localStorage.removeItem("usuario");
        sessionStorage.removeItem("usuario");
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        window.location.href = "/login";
    };

    const cerrarMenu = () => {
        setMenuAbierto(false);
        setCategoriasAbiertas(false);
    };

    return (
    <nav className="navbar">
        <div className="navbar__brand">
            <a
                className="navbar__logo-link"
                href="/"
                aria-label="Ir al inicio"
            >
                <img
                    className="navbar__logo-image"
                    src="/logo.svg"
                    alt="Ferretería JM"
                />
            </a>

            <h1 className="navbar__logo">
                Ferretería JM
            </h1>

            <div className="navbar__mobile-actions">
                <a
                    className="navbar__mobile-cart"
                    href="/carrito"
                    aria-label={`Carrito, ${cantidadCarrito} ${
                        cantidadCarrito === 1 ? "unidad" : "unidades"
                    }`}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="9" cy="20" r="1"></circle>
                        <circle cx="20" cy="20" r="1"></circle>
                        <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L21 8H6"></path>
                    </svg>
                    <span className="navbar__cart-count" aria-hidden="true">
                        {cantidadCarrito}
                    </span>
                </a>

                <button
                    type="button"
                    className="navbar__menu"
                    aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
                    aria-expanded={menuAbierto}
                    aria-controls="navbar-menu"
                    onClick={() => setMenuAbierto((abierto) => !abierto)}
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 6h16"></path>
                        <path d="M4 12h16"></path>
                        <path d="M4 18h16"></path>
                    </svg>
                </button>
            </div>
        </div>

        <div
            id="navbar-menu"
            className={`navbar__links ${
                menuAbierto ? "navbar__links--open" : ""
            }`}
        >
            <a
                className="navbar__link"
                href="/"
                onClick={cerrarMenu}
            >
                Inicio
            </a>

            <div className="navbar__categories">
                <button
                    type="button"
                    className="navbar__categories-toggle"
                    aria-expanded={categoriasAbiertas}
                    aria-controls="navbar-categorias-panel"
                    onClick={() => setCategoriasAbiertas((abierto) => !abierto)}
                >
                    <span>Categorías</span>
                    <span className="navbar__categories-indicator" aria-hidden="true">
                        {categoriasAbiertas ? "▴" : "▾"}
                    </span>
                </button>

                <div
                    id="navbar-categorias-panel"
                    className={`navbar__categories-panel ${
                        categoriasAbiertas ? "navbar__categories-panel--open" : ""
                    }`}
                >
                    {cargandoCategorias && (
                        <span className="navbar__categories-status">
                            Cargando...
                        </span>
                    )}

                    {!cargandoCategorias && categoriasVisibles.length === 0 && (
                        <span className="navbar__categories-status">
                            No hay categorías disponibles.
                        </span>
                    )}

                    {!cargandoCategorias && categoriasVisibles.length > 0 && (
                        <div className="navbar__categories-list">
                            {categoriasVisibles.map((categoria) => (
                                <a
                                    key={categoria.categoria_id}
                                    className="navbar__category-link"
                                    href={`/?categoria=${encodeURIComponent(categoria.nombre)}#productos`}
                                    onClick={cerrarMenu}
                                >
                                    {categoria.nombre}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <a
                className="navbar__link navbar__link--cart"
                href="/carrito"
                onClick={cerrarMenu}
            >
                Carrito
                <span
                    className="navbar__cart-count"
                    aria-label={`${cantidadCarrito} unidades en el carrito`}
                >
                    {cantidadCarrito}
                </span>
            </a>

            <button
                type="button"
                className="navbar__theme"
                aria-label={
                    tema === "dark"
                        ? "Activar modo claro"
                        : "Activar modo oscuro"
                }
                title={
                    tema === "dark"
                        ? "Activar modo claro"
                        : "Activar modo oscuro"
                }
                onClick={alternarTema}
            >
                {tema === "dark" ? "☀️" : "🌙"}
            </button>

            {!estaAutenticado && (
                <a
                    className="navbar__link"
                    href="/login"
                    onClick={cerrarMenu}
                >
                    Iniciar sesión
                </a>
            )}

            {estaAutenticado && esAdmin && (
                <>
                    <a
                        className="navbar__link"
                        href="/dashboard"
                        onClick={cerrarMenu}
                    >
                        Dashboard
                    </a>

                    <a
                        className="navbar__link"
                        href="/categorias"
                        onClick={cerrarMenu}
                    >
                        Administrar categorías
                    </a>

                    <a
                        className="navbar__link"
                        href="/productos"
                        onClick={cerrarMenu}
                    >
                        Productos
                    </a>
                </>
            )}

            {estaAutenticado && (
                <button
                    type="button"
                    className="navbar__logout"
                    onClick={handleLogout}
                >
                    Cerrar sesión
                </button>
            )}
        </div>
    </nav>
);
}

export default Navbar;
