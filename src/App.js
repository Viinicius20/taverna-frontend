import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext'; 
import Home from './pages/Home';
import CriarPersonagem from './pages/CriarPersonagem';
import Personagens from './pages/Personagens';
import Mestre from './pages/Mestre';
import Ficha from './pages/Ficha';
import RolarDados from './pages/RolarDados';
import Quadro from './pages/Quadro';
import Historico from './pages/Historico';
import Login from './pages/Login'; 
import Bestiario from './pages/Bestiario';
import Galeria from './pages/Galeria';

function App() {
  return (
    <UserProvider> {/* ← wrappa tudo */}
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} /> {/* ← adiciona */}
          <Route path="/" element={<Home />} />
          <Route path="/personagens" element={<Personagens />} />
          <Route path="/personagens/criar" element={<CriarPersonagem />} />
          <Route path="/mestre" element={<Mestre />} />
          <Route path="/personagens/:id" element={<Ficha />} />
          <Route path="/dados" element={<RolarDados />} />
          <Route path="/quadro" element={<Quadro />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/mestre/bestiario" element={<Bestiario />} />
          <Route path="/galeria" element={<Galeria />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;