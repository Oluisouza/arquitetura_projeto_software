import { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Coffee, ChefHat, Settings, LogOut, GripVertical } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const TELAS = [
  { rota: "/",        rotulo: "PDV",     Icone: Coffee },
  { rota: "/cozinha", rotulo: "Cozinha", Icone: ChefHat },
  { rota: "/admin",   rotulo: "Admin",   Icone: Settings },
];

const CHAVE_POS = "cafeteria_barra_pos";

function lerPos() {
  try {
    const s = localStorage.getItem(CHAVE_POS);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export default function BarraNavegacao() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const barraRef = useRef(null);
  const [pos, setPos] = useState(lerPos); 
  if (!usuario || pathname === "/login") return null;

  const ehGerente = usuario.papel === "gerente";

  function sair() {
    logout();
    navigate("/login", { replace: true });
  }

  function aoPressionar(e) {
    e.preventDefault();
    const rect = barraRef.current.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;

    function mover(ev) {
      const largura = barraRef.current?.offsetWidth || 0;
      const altura  = barraRef.current?.offsetHeight || 0;
      const left = Math.max(8, Math.min(ev.clientX - dx, window.innerWidth  - largura - 8));
      const top  = Math.max(8, Math.min(ev.clientY - dy, window.innerHeight - altura - 8));
      setPos({ left, top });
    }
    function soltar() {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      setPos((p) => {
        if (p) localStorage.setItem(CHAVE_POS, JSON.stringify(p));
        return p;
      });
    }
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  }

  const estiloPos = pos ? { left: pos.left, top: pos.top } : { right: 16, bottom: 16 };

  const botaoBase = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: "none",
    borderRadius: "var(--r-sm)",
    padding: "0.45rem 0.7rem",
    fontSize: 13,
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    background: "transparent",
    color: "var(--mist)",
  };

  return (
    <div
      ref={barraRef}
      style={{
        position: "fixed",
        ...estiloPos,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: "var(--cream)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        padding: 5,
        boxShadow: "var(--shadow-l)",
        userSelect: "none",
      }}
    >
      {/* Alca de arrastar */}
      <div
        onPointerDown={aoPressionar}
        title="Arrastar"
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 2px",
          cursor: "grab",
          color: "var(--border)",
          touchAction: "none",
        }}
      >
        <GripVertical size={16} />
      </div>

      {/* Troca de telas: visivel apenas para o gerente */}
      {ehGerente &&
        TELAS.map(({ rota, rotulo, Icone }) => {
          const ativo = pathname === rota;
          return (
            <button
              key={rota}
              onClick={() => navigate(rota)}
              style={{
                ...botaoBase,
                background: ativo ? "var(--caramel-l)" : "transparent",
                color: ativo ? "var(--roast)" : "var(--mist)",
                fontWeight: ativo ? 600 : 400,
              }}
            >
              <Icone size={15} />
              {rotulo}
            </button>
          );
        })}

      {ehGerente && (
        <span style={{ width: 1, height: 22, background: "var(--border)", margin: "0 2px" }} />
      )}

      {/* Sair: para qualquer papel logado */}
      <button onClick={sair} style={{ ...botaoBase, color: "var(--red)" }} title="Sair">
        <LogOut size={15} />
        Sair
      </button>
    </div>
  );
}