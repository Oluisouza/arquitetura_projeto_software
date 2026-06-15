import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROTA_DO_PAPEL = {
  gerente: "/admin",
  atendente: "/",
  cozinha: "/cozinha",
};

export default function RotaProtegida({ papeis, children }) {
  const { usuario, carregando } = useAuth();

  if (carregando) return null; 

  if (!usuario) return <Navigate to="/login" replace />;

  if (papeis && !papeis.includes(usuario.papel)) {
    return <Navigate to={ROTA_DO_PAPEL[usuario.papel] || "/login"} replace />;
  }

  return children;
}