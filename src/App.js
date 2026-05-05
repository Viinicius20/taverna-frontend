import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CriarPersonagem from './pages/CriarPersonagem';
import Personagens from './pages/Personagens';
import Mestre from './pages/Mestre';
import Ficha from './pages/Ficha';
import RolarDados from './pages/RolarDados';
import Quadro from './pages/Quadro';
import Historico from './pages/Historico';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/personagens" element={<Personagens />} />
        <Route path="/personagens/criar" element={<CriarPersonagem />} />
        <Route path="/mestre" element={<Mestre />} />
        <Route path="/personagens/:id" element={<Ficha />} />
        <Route path="/dados" element={<RolarDados />} />
        <Route path="/quadro" element={<Quadro />} />
        <Route path="/historico" element={<Historico />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;