import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/logo-suprema.svg";
import "./Navbar.css";

interface Modulo {
  to: string;
  label: string;
  descricao: string;
}

interface GrupoModulos {
  titulo: string;
  itens: Modulo[];
}

const grupos: GrupoModulos[] = [
  {
    titulo: "Frota",
    itens: [
      { to: "/marcas", label: "Marcas", descricao: "Fabricantes dos veículos" },
      { to: "/categorias", label: "Categorias", descricao: "Classes e valor da diária" },
      { to: "/modelos", label: "Modelos", descricao: "Marca e categoria" },
      { to: "/veiculos", label: "Veículos", descricao: "Frota e disponibilidade" },
      { to: "/manutencoes", label: "Manutenções", descricao: "Histórico por veículo" },
    ],
  },
  {
    titulo: "Atendimento",
    itens: [
      { to: "/clientes", label: "Clientes", descricao: "Dados pessoais e CNH" },
      { to: "/locacoes", label: "Locações", descricao: "Retirada, devolução e pagamentos" },
    ],
  },
];

export function Navbar() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [modulosAberto, setModulosAberto] = useState(false);
  const modulosRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();

  const emModulo = grupos.some((g) => g.itens.some((i) => pathname.startsWith(i.to)));

  useEffect(() => {
    if (!modulosAberto) return;

    function aoClicarFora(e: MouseEvent) {
      if (modulosRef.current && !modulosRef.current.contains(e.target as Node)) {
        setModulosAberto(false);
      }
    }
    function aoPressionarTecla(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setModulosAberto(false);
        botaoRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoPressionarTecla);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [modulosAberto]);

  function fecharTudo() {
    setModulosAberto(false);
    setMenuAberto(false);
  }

  return (
    <header className="topbar">
      <nav className="topbar-inner container-xl" aria-label="Principal">
        <NavLink to="/" className="topbar-brand" onClick={fecharTudo}>
          <img src={logo} alt="" className="topbar-logo" />
          <span className="topbar-divisor" aria-hidden="true" />
          <span className="topbar-nome">
            <span>Locadora</span>
            <span>Suprema</span>
          </span>
        </NavLink>

        <button
          type="button"
          className="topbar-toggler"
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          aria-controls="menu-principal"
          onClick={() => setMenuAberto(!menuAberto)}
        >
          <span className="barra" />
          <span className="barra" />
          <span className="barra" />
        </button>

        <div id="menu-principal" className={`topbar-menu${menuAberto ? " aberto" : ""}`}>
          <NavLink to="/" end className="topbar-link" onClick={fecharTudo}>
            Home
          </NavLink>

          <div className="modulos" ref={modulosRef}>
            <button
              ref={botaoRef}
              type="button"
              className={`modulos-botao${emModulo ? " em-modulo" : ""}`}
              aria-expanded={modulosAberto}
              aria-controls="painel-modulos"
              onClick={() => setModulosAberto(!modulosAberto)}
            >
              Módulos
              <span className="chevron" aria-hidden="true" />
            </button>

            {modulosAberto && (
              <div id="painel-modulos" className="modulos-painel">
                {grupos.map((grupo) => (
                  <div key={grupo.titulo}>
                    <p className="modulos-titulo">{grupo.titulo}</p>
                    {grupo.itens.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `modulo-item${isActive ? " ativo" : ""}`}
                        onClick={fecharTudo}
                      >
                        <span className="modulo-nome">{item.label}</span>
                        <span className="modulo-desc">{item.descricao}</span>
                      </NavLink>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
