import { Route, Routes } from "react-router-dom";
import { Card } from "./components/Card";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { MarcaList } from "./pages/marcas/MarcaList";
import "./base.css";

function EmBreve() {
  return (
    <div className="container py-4">
      <Card title="Em breve">
        <p className="mb-0">Esta tela ainda está em construção.</p>
      </Card>
    </div>
  );
}

export default function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1 d-flex flex-column">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marcas" element={<MarcaList />} />
          <Route path="*" element={<EmBreve />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
