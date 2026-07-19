import Home from "../modules/home/pages/Home";
import Productos from "../modules/productos/pages/Productos";
import Login from "../modules/auth/pages/Login";
import Dashboard from "../modules/dashboard/pages/Dashboard";
import NotFound from "./NotFound";

export default function AppRoutes() {
  const routes = {
    "/": Home,
    "/productos": Productos,
    "/login": Login,
    "/dashboard": Dashboard,
  };

  const pathname = typeof window === "undefined" ? "/" : window.location.pathname;
  const Page = routes[pathname] ?? NotFound;

  return <Page />;
}
