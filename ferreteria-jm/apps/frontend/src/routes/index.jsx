import Home from "../modules/home/vistas/Home";
import Productos from "../modules/productos/vistas/Productos";
import Login from "../modules/auth/vistas/Login/Login";
import Dashboard from "../modules/dashboard/vistas/Dashboard";
import NotFound from "./NotFound";

export default function AppRoutes() {
  const routes = {
    "/": Home,
    "/productos": Productos,
    "/login": Login,
    "/dashboard": Dashboard,
  };

  const pathname =
    typeof window === "undefined" ? "/" : window.location.pathname;

  const Page = routes[pathname] ?? NotFound;

  return <Page />;
}