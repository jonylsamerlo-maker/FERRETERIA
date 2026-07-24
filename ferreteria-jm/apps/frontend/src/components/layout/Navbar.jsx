import "./Navbar.css";
import { useEffect, useState } from "react";
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
    const [cantidadCarrito, setCantidadCarrito] = useState(0);

    useEffect(() => {
        setUsuario(obtenerUsuarioGuardado());
        setCantidadCarrito(
            Math.max(0, obtenerCantidadTotal(obtenerCarrito()))
        );

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

    const rol = usuario?.rol?.trim().toUpperCase();
    const esAdmin = rol === "ADMIN";
    const estaAutenticado = Boolean(usuario);

    const handleLogout = () => {
        setMenuAbierto(false);
        localStorage.removeItem("usuario");
        sessionStorage.removeItem("usuario");
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        window.location.href = "/login";
    };

    const cerrarMenu = () => {
        setMenuAbierto(false);
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

            <button
                type="button"
                className="navbar__menu"
                aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={menuAbierto}
                onClick={() => setMenuAbierto((abierto) => !abierto)}
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 6h16"></path>
                    <path d="M4 12h16"></path>
                    <path d="M4 18h16"></path>
                </svg>
            </button>
        </div>

        <div
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
                        Categorías
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
