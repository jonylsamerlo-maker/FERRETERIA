import "./Navbar.css";
import { Menu } from "lucide-react";

function Navbar() {
    return (
        <nav className="navbar">

            <button
                className="navbar__menu"
                aria-label="Abrir menú"
            >
                <Menu size={28} />
            </button>

            <h1 className="navbar__logo">
                Ferretería JM
            </h1>

        </nav>
    );
}

export default Navbar;