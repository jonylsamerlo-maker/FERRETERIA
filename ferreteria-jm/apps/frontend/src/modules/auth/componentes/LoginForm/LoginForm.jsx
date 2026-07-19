import "./LoginForm.css";

function LoginForm() {
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
          type="text"
          className="login-form__input"
          placeholder="Ingrese su usuario"
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
          type="password"
          className="login-form__input"
          placeholder="Ingrese su contraseña"
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