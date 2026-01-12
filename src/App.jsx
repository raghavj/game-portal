import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Landing from './pages/Landing';
import Home from './pages/Home';
import GamePage from './pages/GamePage';
import './App.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/games" element={
          <div className="app">
            <Header />
            <Home />
          </div>
        } />
        <Route path="/game/:gameId" element={
          <div className="app">
            <Header />
            <GamePage />
          </div>
        } />
      </Routes>
    </HashRouter>
  );
}

export default App;
