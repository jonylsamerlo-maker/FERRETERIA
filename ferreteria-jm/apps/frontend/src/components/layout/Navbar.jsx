import "./Navbar.css";
import { useEffect, useState } from "react";

function obtenerUsuarioGuardado() {
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

            // Si ya es un objeto serializado, parsearlo; si no, devolver raw.
            try {
                return JSON.parse(raw);
            } catch {
                return raw;
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

    useEffect(() => {
        setUsuario(obtenerUsuarioGuardado());

        // Actualiza el estado del usuario si cambia en otra pestaña (evento storage)
        const onStorage = (e) => {
            if (e.key === "usuario" || e.key === "user") {
                setUsuario(obtenerUsuarioGuardado());
            }
        };

        // También refrescar al volver foco a la ventana (por si se actualizó en la misma pestaña)
        const onFocus = () => setUsuario(obtenerUsuarioGuardado());

        window.addEventListener("storage", onStorage);
        window.addEventListener("focus", onFocus);

        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("focus", onFocus);
        };
    }, []);

    const rol = usuario?.rol?.trim().toUpperCase();
    const esAdmin = rol === "ADMIN";
    const estaAutenticado = Boolean(usuario);

    const handleLogout = () => {
        setMenuAbierto(false);
        localStorage.removeItem("usuario");
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
