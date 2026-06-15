import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROTA_DO_PAPEL = {
  gerente: "/admin",
  atendente: "/",
  cozinha: "/cozinha",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const dados = await login(email, senha);
      navigate(ROTA_DO_PAPEL[dados.papel] || "/", { replace: true });
    } catch (err) {
      setErro(err.message || "Nao foi possivel entrar");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "var(--chalk)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: "2rem",
          boxShadow: "var(--shadow-m)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              color: "var(--espresso)",
            }}
          >
            ☕ Café Teria
          </h1>
          <p style={{ color: "var(--mist)", marginTop: 4, fontSize: 13 }}>
            Entre para continuar
          </p>
        </div>

        <form onSubmit={aoEnviar}>
          <div style={{ marginBottom: "0.85rem" }}>
            <label className="label-xs" style={{ display: "block", marginBottom: "0.3rem" }}>
              E-mail
            </label>
            <input
              type="email"
              className="input-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: "0.85rem" }}>
            <label className="label-xs" style={{ display: "block", marginBottom: "0.3rem" }}>
              Senha
            </label>
            <input
              type="password"
              className="input-base"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          {erro && (
            <p
              style={{
                fontSize: 13,
                color: "var(--red)",
                background: "var(--red-l)",
                borderRadius: "var(--r-sm)",
                padding: "0.5rem 0.75rem",
                marginBottom: "0.85rem",
              }}
            >
              {erro}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={carregando}
            style={{ width: "100%" }}
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}