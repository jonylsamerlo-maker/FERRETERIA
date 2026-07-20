import "./Navbar.css";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

function obtenerUsuarioGuardado() {
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!usuarioGuardado) {
        return null;
    }

    try {
        return JSON.parse(usuarioGuardado);
    } catch {
        return null;
    }
}

function Navbar() {
    const [usuario, setUsuario] = useState(null);
    const [menuAbierto, setMenuAbierto] = useState(false);

    useEffect(() => {
        setUsuario(obtenerUsuarioGuardado());
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
                <a className="navbar__logo-link" href="/" aria-label="Ir al inicio">
                    <img
                        className="navbar__logo-image"
                        src="/logo.svg"
                        alt="Ferretería JM"
                    />
                </a>

                <button
                    className="navbar__menu"
                    aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
                    aria-expanded={menuAbierto}
                    onClick={() => setMenuAbierto((abierto) => !abierto)}
                >
                    <Menu size={28} />
                </button>
            </div>

            <h1 className="navbar__logo">
                Ferretería JM
            </h1>

            <div
                className={`navbar__links ${menuAbierto ? "navbar__links--open" : ""}`}
            >
                <a className="navbar__link" href="/" onClick={cerrarMenu}>
                    Inicio
                </a>

                {!estaAutenticado && (
                    <a className="navbar__link" href="/login" onClick={cerrarMenu}>
                        Iniciar sesión
                    </a>
                )}

                {estaAutenticado && esAdmin && (
                    <>
                        <a className="navbar__link" href="/dashboard" onClick={cerrarMenu}>
                            Dashboard
                        </a>

                        <a className="navbar__link" href="/categorias" onClick={cerrarMenu}>
                            Categorías
                        </a>

                        <a className="navbar__link" href="/productos" onClick={cerrarMenu}>
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
