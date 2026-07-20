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

    useEffect(() => {
        setUsuario(obtenerUsuarioGuardado());
    }, []);

    const rol = usuario?.rol?.trim().toUpperCase();
    const esAdmin = rol === "ADMIN";
    const estaAutenticado = Boolean(usuario);

    const handleLogout = () => {
        localStorage.removeItem("usuario");
        window.location.href = "/login";
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
                    aria-label="Abrir menú"
                >
                    <Menu size={28} />
                </button>
            </div>

            <h1 className="navbar__logo">
                Ferretería JM
            </h1>

            <div className="navbar__links">
                <a className="navbar__link" href="/">
                    Inicio
                </a>

                {!estaAutenticado && (
                    <a className="navbar__link" href="/login">
                        Iniciar sesión
                    </a>
                )}

                {estaAutenticado && esAdmin && (
                    <>
                        <a className="navbar__link" href="/dashboard">
                            Dashboard
                        </a>

                        <a className="navbar__link" href="/categorias">
                            Categorías
                        </a>

                        <a className="navbar__link" href="/productos">
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
