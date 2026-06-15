import { createContext, useContext, useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;
const CHAVE_STORAGE = "cafeteria_auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Restaura a sessao salva ao abrir o app.
  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE_STORAGE);
    if (salvo) {
      try {
        setUsuario(JSON.parse(salvo));
      } catch {
        localStorage.removeItem(CHAVE_STORAGE);
      }
    }
    setCarregando(false);
  }, []);

  async function login(email, senha) {
    const resp = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    if (!resp.ok) {
      const erro = await resp.json().catch(() => ({}));
      throw new Error(erro.detail || "Falha no login");
    }

    const dados = await resp.json();
    setUsuario(dados);
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));
    return dados;
  }

  function logout() {
    setUsuario(null);
    localStorage.removeItem(CHAVE_STORAGE);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);