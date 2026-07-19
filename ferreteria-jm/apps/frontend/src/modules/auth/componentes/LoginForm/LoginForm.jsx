import { useState } from "react";
import "./LoginForm.css";

function LoginForm() {
    const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const handleChange = (event) => {
  const { name, value } = event.target;

  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};
  return (
    <form className="login-form">

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
  value={formData.password}
  onChange={handleChange}
/>
    

      </div>

      <button
        type="submit"
        className="login-form__button"
      >
        Ingresar
      </button>

    </form>
  );
}

export default LoginForm;