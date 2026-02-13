import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/ui/Layout';
import Generate from './pages/Generate';
import Outputs from './pages/Outputs';
import Help from './pages/Help';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Generate />} />
          <Route path="outputs" element={<Outputs />} />
          <Route path="help" element={<Help />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
