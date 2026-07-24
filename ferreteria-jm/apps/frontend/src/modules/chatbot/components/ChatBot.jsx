import { useEffect, useRef, useState } from "react";
import { obtenerRespuestaChatbot } from "../services/chatbotService.js";
import { obtenerNombreProducto } from "../utils/chatbotUtils.js";
import "../styles/ChatBot.css";

let siguienteMensajeId = 0;

function crearIdMensaje() {
  siguienteMensajeId += 1;
  return `chatbot-msg-${siguienteMensajeId}`;
}

function ChatBot({ productos = [], addToCart = null }) {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [accionPendiente, setAccionPendiente] = useState(null);

  const [mensajes, setMensajes] = useState([
    {
      id: crearIdMensaje(),
      from: "bot",
      text: "Hola, soy el asistente de Ferretería JM. Puedo ayudarte con productos, precios, stock, carrito y pedidos por WhatsApp.",
    },
  ]);

  const mensajesRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop =
        mensajesRef.current.scrollHeight;
    }
  }, [mensajes]);

  useEffect(() => {
    if (estaAbierto) {
      inputRef.current?.focus();
    }
  }, [estaAbierto]);

  const agregarMensaje = (nuevoMensaje) => {
    setMensajes((mensajesActuales) => [
      ...mensajesActuales,
      {
        id: crearIdMensaje(),
        ...nuevoMensaje,
      },
    ]);
  };

  const procesarRespuesta = (textoUsuario) => {
    const respuesta = obtenerRespuestaChatbot({
      mensaje: textoUsuario,
      productos,
      pendingAction: accionPendiente,
    });

    if (
      respuesta.action === "confirm_add_to_cart" &&
      respuesta.product
    ) {
      setAccionPendiente({
        type: "add_to_cart",
        product: respuesta.product,
      });
    }

    if (respuesta.action === "cancel_add_to_cart") {
      setAccionPendiente(null);
    }

    if (
      respuesta.action === "add_to_cart" &&
      respuesta.product
    ) {
      if (typeof addToCart === "function") {
        const resultado = addToCart(respuesta.product);

        if (resultado?.ok === false) {
          respuesta.text =
            resultado.mensaje ||
            "No se pudo agregar el producto al carrito.";
        } else {
          respuesta.text = `¡${obtenerNombreProducto(
            respuesta.product,
          )} fue agregado al carrito!`;
        }
      } else {
        respuesta.text =
          "Encontré el producto, pero el chatbot todavía no está conectado con el carrito.";
      }

      setAccionPendiente(null);
    }

    return respuesta.text;
  };

  const enviarMensaje = () => {
    const textoUsuario = mensaje.trim();

    if (!textoUsuario) {
      return;
    }

    agregarMensaje({
      from: "user",
      text: textoUsuario,
    });

    const textoRespuesta = procesarRespuesta(textoUsuario);

    agregarMensaje({
      from: "bot",
      text: textoRespuesta,
    });

    setMensaje("");
  };

  const manejarTecla = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      enviarMensaje();
    }

    if (event.key === "Escape") {
      setEstaAbierto(false);
    }
  };

  const alternarChat = () => {
    setEstaAbierto((estadoActual) => !estadoActual);
  };

  return (
    <div className="ferreteria-chatbot">
      {estaAbierto && (
        <section
          className="ferreteria-chatbot__window"
          aria-label="Asistente virtual de Ferretería JM"
        >
          <header className="ferreteria-chatbot__header">
            <div className="ferreteria-chatbot__header-content">
              <span className="ferreteria-chatbot__badge">
                Asistente virtual
              </span>

              <h2 className="ferreteria-chatbot__title">
                Ferretería JM
              </h2>

              <p className="ferreteria-chatbot__subtitle">
                Productos, precios, stock y pedidos
              </p>
            </div>

            <button
              type="button"
              className="ferreteria-chatbot__close"
              onClick={() => setEstaAbierto(false)}
              aria-label="Cerrar chatbot"
            >
              ×
            </button>
          </header>

          <div
            ref={mensajesRef}
            className="ferreteria-chatbot__messages"
            aria-live="polite"
          >
            {mensajes.map((item) => (
              <div
                key={item.id}
                className={`ferreteria-chatbot__message ferreteria-chatbot__message--${item.from}`}
              >
                <span className="ferreteria-chatbot__message-text">
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          <div className="ferreteria-chatbot__composer">
            <input
              ref={inputRef}
              type="text"
              className="ferreteria-chatbot__field"
              value={mensaje}
              onChange={(event) => setMensaje(event.target.value)}
              onKeyDown={manejarTecla}
              placeholder="Escribí tu consulta..."
              aria-label="Mensaje para el asistente"
            />

            <button
              type="button"
              className="ferreteria-chatbot__send"
              onClick={enviarMensaje}
              disabled={!mensaje.trim()}
            >
              Enviar
            </button>
          </div>
        </section>
      )}

      <button
        type="button"
        className="ferreteria-chatbot__toggle"
        onClick={alternarChat}
        aria-label={
          estaAbierto ? "Cerrar chatbot" : "Abrir chatbot"
        }
        aria-expanded={estaAbierto}
      >
        {estaAbierto ? "×" : "Chat"}
      </button>
    </div>
  );
}

export default ChatBot;
