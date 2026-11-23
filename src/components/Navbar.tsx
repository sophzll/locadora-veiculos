import { useState } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/marcas", label: "Marcas" },
  { to: "/categorias", label: "Categorias" },
  { to: "/modelos", label: "Modelos" },
  { to: "/veiculos", label: "Veículos" },
  { to: "/manutencoes", label: "Manutenções" },
  { to: "/clientes", label: "Clientes" },
  { to: "/locacoes", label: "Locações" },
];

export function Navbar() {
  const [aberto, setAberto] = useState(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <NavLink className="navbar-brand" to="/">
          Locadora
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          aria-label="Alternar menu"
          onClick={() => setAberto(!aberto)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse${aberto ? " show" : ""}`}>
          <ul className="navbar-nav ms-auto">
            {links.map((link) => (
              <li className="nav-item" key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                  onClick={() => setAberto(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
