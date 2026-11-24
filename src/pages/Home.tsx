import { useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import carro from "../assets/carro-suprema.webp";
import fundo from "../assets/fundo-home.webp";
import { Button } from "../components/Button";
import "./Home.css";

const palavras = ["Locação", "de", "veículos"];

export function Home() {
  const hero = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    let pronto = false;
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: () => { pronto = true; } })
          .from(".suprema-bg", { scale: 1.35, opacity: 0, duration: 2.4, ease: "power2.out" }, 0)
          .from(".suprema-kicker", { opacity: 0, letterSpacing: "1.1em", duration: 1.1 }, 0.3)
          .from(".palavra-in", { yPercent: 120, rotate: 6, opacity: 0, duration: 0.9, stagger: 0.14 }, 0.5)
          .from(".suprema-line", { scaleX: 0, duration: 0.9, ease: "power4.inOut" }, 1)
          .from(".suprema-subtitle", { y: 20, opacity: 0, duration: 0.7 }, 1.15)
          .from(".suprema-car", { x: "-75vw", skewX: -16, opacity: 0, duration: 1.7, ease: "power4.out" }, 0.6)
          .from(".suprema-actions .btn", { y: 60, opacity: 0, duration: 0.9, stagger: 0.15, ease: "back.out(1.6)" }, 1.7);
      });

      mm.add("(hover: hover) and (prefers-reduced-motion: no-preference)", () => {
        const carX = gsap.quickTo(".suprema-car", "x", { duration: 0.9, ease: "power3.out" });
        const bgX = gsap.quickTo(".suprema-bg", "x", { duration: 1.4, ease: "power3.out" });
        function mover(e: MouseEvent) {
          if (!pronto) return;
          const p = e.clientX / window.innerWidth - 0.5;
          carX(p * -28);
          bgX(p * 20);
        }
        window.addEventListener("mousemove", mover);
        return () => window.removeEventListener("mousemove", mover);
      });
    }, hero);
    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={hero} className="suprema-hero position-relative overflow-hidden d-flex flex-column text-center" aria-labelledby="suprema-heading">
      <div className="suprema-bg" style={{ backgroundImage: `url(${fundo})` }} aria-hidden="true" />
      <div className="suprema-overlay" aria-hidden="true" />

      <div className="container-xl position-relative">
        <p className="suprema-kicker">A experiência em</p>
        <h1 id="suprema-heading" className="suprema-title d-flex flex-wrap justify-content-center">
          {palavras.map((p, i) => (
            <span className="palavra" key={p}>
              <span className={`palavra-in${i === palavras.length - 1 ? " suprema-accent" : ""}`}>{p}</span>
            </span>
          ))}
        </h1>
        <div className="suprema-line mx-auto" aria-hidden="true" />
      </div>

      <div className="suprema-stage mt-auto d-flex justify-content-center">
        <img className="suprema-car" src={carro} alt="Chevrolet Omega Suprema azul" />
      </div>

      <div className="suprema-actions d-flex flex-wrap justify-content-center gap-3 px-3 pt-4 pb-4 position-relative">
        <Button label="Ver frota →" variant="primary" onClick={() => navigate("/veiculos")} />
        <Button label="Nova locação" variant="secondary" onClick={() => navigate("/locacoes/novo")} />
      </div>
    </section>
  );
}
