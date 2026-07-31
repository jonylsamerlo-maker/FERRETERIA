import { useState } from "react";
import { loginUsuario } from "../../services/usuarioApi";
import "./LoginForm.css";

function LoginForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (enviando) {
      return;
    }

    const formValues = new FormData(event.currentTarget);
    const loginData = {
      username: formValues.get("username") || "",
      password: formValues.get("password") || "",
    };

    try {
      setEnviando(true);
      setError("");

      const respuesta = await loginUsuario(loginData);

      if (respuesta.success) {
        localStorage.setItem(
          "usuario",
          JSON.stringify(respuesta.usuario)
        );

        window.location.href = "/dashboard";
      } else {
        setError(respuesta.message);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2 className="login-form__title">
        Iniciar sesión
      </h2>

      <div className="login-form__group">
        <label
          htmlFor="username"
          className="login-form__label"
        >
          Usuario
        </label>

        <input
          id="username"
          name="username"
          type="text"
          className="login-form__input"
          placeholder="Ingrese su usuario"
          autoComplete="username"
          value={formData.username}
          onChange={handleChange}
        />
      </div>

      <div className="login-form__group">
        <label
          htmlFor="password"
          className="login-form__label"
        >
          Contraseña
        </label>

        <input
          id="password"
          name="password"
          type="password"
          className="login-form__input"
          placeholder="Ingrese su contraseña"
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
        />
      </div>

      {error && (
        <p className="login-form__message" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="login-form__button"
        disabled={enviando}
      >
        {enviando ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}

export default LoginForm;
