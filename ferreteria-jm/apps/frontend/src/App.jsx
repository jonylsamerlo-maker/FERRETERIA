import Header from "./shared/components/layout/Header/Header.index";
import Footer from "./shared/components/layout/Footer/Footer.index";
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
