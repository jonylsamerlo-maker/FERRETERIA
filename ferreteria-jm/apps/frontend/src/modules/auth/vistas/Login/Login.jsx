import "./Login.css";
import LoginForm from "../../componentes/LoginForm/LoginForm.index";

function Login() {
  return (
    <section className="login">
      <div className="login__container">
        <LoginForm />
      </div>
    </section>
  );
}

export default Login;