import Header from "./components/layout/Header.index";
import Footer from "./components/layout/Footer.index";
import AppRoutes from "./routes";

function App() {
  return (
    <>
      <Header />
      <main>
        <AppRoutes />
      </main>
      <Footer />
    </>
  );
}

export default App;
