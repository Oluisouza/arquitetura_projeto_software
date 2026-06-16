import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import RotaProtegida from "./components/RotaProtegida";
import BarraNavegacao from "./components/BarraNavegacao";
import Login from "./pages/Login";
import PDV from "./pages/PDV";
import Cozinha from "./pages/Cozinha";
import Admin from "./pages/Admin";

const ROTA_DO_PAPEL = {
  gerente: "/admin",
  atendente: "/",
  cozinha: "/cozinha",
};

export default function App() {
  const { usuario } = useAuth();

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            usuario ? <Navigate to={ROTA_DO_PAPEL[usuario.papel] || "/"} replace /> : <Login />
          }
        />

        <Route
          path="/"
          element={
            <RotaProtegida papeis={["atendente", "gerente"]}>
              <PDV />
            </RotaProtegida>
          }
        />

        <Route
          path="/cozinha"
          element={
            <RotaProtegida papeis={["cozinha", "gerente"]}>
              <Cozinha />
            </RotaProtegida>
          }
        />

        <Route
          path="/admin"
          element={
            <RotaProtegida papeis={["gerente"]}>
              <Admin />
            </RotaProtegida>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <BarraNavegacao />
    </>
  );
}