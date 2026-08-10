import { useState } from "react";
import { agregarAlCarrito } from "../../../services/cartStorage";

function AgregarProductoCarrito({ producto }) {
  const [mensaje, setMensaje] = useState("");
  const stock = Math.max(0, Number(producto?.stock) || 0);
  const sinStock = stock <= 0;

  const handleAgregar = () => {
    const resultado = agregarAlCarrito({
      id: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio) || 0,
      imagen: producto.imagen,
      stock,
    });

    setMensaje(resultado.mensaje);
  };

  return (
    <div className="producto-detalle__compra">
      <button
        className="producto-detalle__agregar"
        type="button"
        onClick={handleAgregar}
        disabled={sinStock}
      >
        {sinStock ? "Sin stock" : "Agregar al carrito"}
      </button>

      <p
        className="producto-detalle__feedback"
        role="status"
        aria-live="polite"
      >
        {mensaje}
      </p>
    </div>
  );
}

export default AgregarProductoCarrito;
