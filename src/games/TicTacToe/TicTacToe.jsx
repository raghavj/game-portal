import { useState, useCallback } from 'react';
import './TicTacToe.css';

function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [vsAI, setVsAI] = useState(true);

  const checkWinner = useCallback((squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    return null;
  }, []);

  const getAIMove = useCallback((squares) => {
    // Try to win
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        const test = [...squares];
        test[i] = 'O';
        if (checkWinner(test)?.winner === 'O') return i;
      }
    }

    // Block player win
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        const test = [...squares];
        test[i] = 'X';
        if (checkWinner(test)?.winner === 'X') return i;
      }
    }

    // Take center
    if (!squares[4]) return 4;

    // Take corner
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => !squares[i]);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Take any
    const available = squares.map((s, i) => s ? -1 : i).filter(i => i !== -1);
    return available[Math.floor(Math.random() * available.length)];
  }, [checkWinner]);

  const handleClick = (index) => {
    if (board[index] || checkWinner(board)) return;

    const newBoard = [...board];
    newBoard[index] = isXTurn ? 'X' : 'O';
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setScores(prev => ({ ...prev, [result.winner]: prev[result.winner] + 1 }));
    } else if (newBoard.every(cell => cell)) {
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
    } else if (vsAI && isXTurn) {
      // AI move
      setTimeout(() => {
        const aiMove = getAIMove(newBoard);
        if (aiMove !== undefined) {
          const aiBoard = [...newBoard];
          aiBoard[aiMove] = 'O';
          setBoard(aiBoard);

          const aiResult = checkWinner(aiBoard);
          if (aiResult) {
            setScores(prev => ({ ...prev, [aiResult.winner]: prev[aiResult.winner] + 1 }));
          } else if (aiBoard.every(cell => cell)) {
            setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
          }
        }
      }, 400);
    } else {
      setIsXTurn(!isXTurn);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
  };

  const resetScores = () => {
    setScores({ X: 0, O: 0, draws: 0 });
    resetGame();
  };

  const toggleMode = () => {
    setVsAI(!vsAI);
    resetScores();
  };

  const result = checkWinner(board);
  const isDraw = !result && board.every(cell => cell);

  return (
    <div className="tictactoe-game">
      <div className="mode-toggle">
        <button className={vsAI ? 'active' : ''} onClick={() => !vsAI && toggleMode()}>vs AI</button>
        <button className={!vsAI ? 'active' : ''} onClick={() => vsAI && toggleMode()}>2 Players</button>
      </div>

      <div className="scoreboard">
        <div className="score x-score">
          <span className="player">X {vsAI ? '(You)' : ''}</span>
          <span className="points">{scores.X}</span>
        </div>
        <div className="score draw-score">
          <span className="player">Draw</span>
          <span className="points">{scores.draws}</span>
        </div>
        <div className="score o-score">
          <span className="player">O {vsAI ? '(AI)' : ''}</span>
          <span className="points">{scores.O}</span>
        </div>
      </div>

      <div className="ttt-board">
        {board.map((cell, index) => (
          <div
            key={index}
            className={`ttt-cell ${cell ? 'filled' : ''} ${cell === 'X' ? 'x' : ''} ${cell === 'O' ? 'o' : ''} ${result?.line.includes(index) ? 'winner' : ''}`}
            onClick={() => handleClick(index)}
          >
            {cell}
          </div>
        ))}
      </div>

      <div className="game-status">
        {result ? (
          <span className="winner-text">{result.winner} Wins!</span>
        ) : isDraw ? (
          <span className="draw-text">It's a Draw!</span>
        ) : (
          <span>{vsAI ? (isXTurn ? 'Your turn' : 'AI thinking...') : `${isXTurn ? 'X' : 'O'}'s turn`}</span>
        )}
      </div>

      <div className="ttt-buttons">
        <button className="reset-btn" onClick={resetGame}>New Round</button>
        <button className="reset-btn secondary" onClick={resetScores}>Reset Scores</button>
      </div>
    </div>
  );
}

export default TicTacToe;
