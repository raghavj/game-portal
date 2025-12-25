import GameGrid from '../components/GameGrid';
import './Home.css';

function Home() {
  return (
    <main className="home">
      <div className="hero">
        <h1>Welcome to GameZone</h1>
        <p>Choose a game and start playing!</p>
      </div>
      <GameGrid />
    </main>
  );
}

export default Home;
