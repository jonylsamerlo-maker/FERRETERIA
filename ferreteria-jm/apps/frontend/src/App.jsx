import Header from "./shared/components/layout/Header";
import Footer from "./shared/components/layout/Footer";
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
