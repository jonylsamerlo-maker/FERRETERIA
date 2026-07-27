import "./Login.css";
import LoginBanner from "../../componentes/LoginBanner/LoginBanner";
import LoginForm from "../../componentes/LoginForm/LoginForm.index";

function Login() {
  return (
    <section className="login">
      <div className="login__container">
        <div className="login__form-panel">
          <LoginForm />
        </div>

        <LoginBanner />
      </div>
    </section>
  );
}

export default Login;
