import { Routes, Route, Navigate } from 'react-router-dom'
import PDV from './pages/PDV'
import Cozinha from './pages/Cozinha'
import Admin from './pages/Admin'

function App() {
  return (
    <Routes>
      <Route path="/"        element={<PDV />} />
      <Route path="/cozinha" element={<Cozinha />} />
      <Route path="/admin"   element={<Admin />} />
      <Route path="*"        element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App