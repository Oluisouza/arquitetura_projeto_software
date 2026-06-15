const API = import.meta.env.VITE_API_URL;
const CHAVE_STORAGE = "cafeteria_auth";

function tokenSalvo() {
  const salvo = localStorage.getItem(CHAVE_STORAGE);
  if (!salvo) return null;
  try {
    return JSON.parse(salvo).access_token;
  } catch {
    return null;
  }
}

export async function apiFetch(caminho, opcoes = {}) {
  const token = tokenSalvo();

  const ehFormData = opcoes.body instanceof FormData;

  const headers = {
    ...(ehFormData ? {} : { "Content-Type": "application/json" }),
    ...(opcoes.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const resp = await fetch(`${API}${caminho}`, { ...opcoes, headers });

  if (resp.status === 401) {
    localStorage.removeItem(CHAVE_STORAGE);
    window.location.href = "/login";
    throw new Error("Sessao expirada");
  }

  return resp;
}