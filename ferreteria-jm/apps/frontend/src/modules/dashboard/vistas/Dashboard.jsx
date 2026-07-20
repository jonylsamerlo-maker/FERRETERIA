import { useEffect, useState } from "react";

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));

    if (!usuarioGuardado) {
      window.location.href = "/login";
      return;
    }

    setUsuario(usuarioGuardado);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    window.location.href = "/login";
  };

  if (!usuario) {
    return null;
  }

  return (
    <div>
      <h1>Panel de Administración</h1>
      <p>Bienvenido, {usuario.nombre}</p>
      <button type="button" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </div>
  );
}
