import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import RackView from './components/RackView';
import NetworkMap from './components/NetworkMap';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<RackView />} />
          <Route path="/network-map" element={<NetworkMap />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
