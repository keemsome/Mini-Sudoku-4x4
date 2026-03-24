import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eraser,
  Heart,
  Info,
  LogOut,
  PartyPopper,
  RefreshCw,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';

const SIZE = 4;
const DIFFICULTY = {
  EASY: 'Beginner 🌟',
  MEDIUM: 'Explorer 🔎',
  HARD: 'Master 👑',
} as const;

type Difficulty = (typeof DIFFICULTY)[keyof typeof DIFFICULTY];
type Status = 'playing' | 'won' | 'given_up';
type MessageType = 'error' | 'info' | 'success';

type Cell = {
  row: number;
  col: number;
  value: number;
  isFixed: boolean;
  isError: boolean;
};

type Position = {
  r: number;
  c: number;
};

type Message = {
  text: string;
  type: MessageType;
};

const shuffle = <T,>(array: T[]) => {
  const next = [...array];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const generateSolution = () => {
  const grid = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1],
  ];

  const nums = shuffle([1, 2, 3, 4]);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      grid[r][c] = nums[grid[r][c] - 1];
    }
  }

  if (Math.random() > 0.5) [grid[0], grid[1]] = [grid[1], grid[0]];
  if (Math.random() > 0.5) [grid[2], grid[3]] = [grid[3], grid[2]];

  const swapCols = (c1: number, c2: number) => {
    for (let r = 0; r < SIZE; r++) {
      [grid[r][c1], grid[r][c2]] = [grid[r][c2], grid[r][c1]];
    }
  };

  if (Math.random() > 0.5) swapCols(0, 1);
  if (Math.random() > 0.5) swapCols(2, 3);
  return grid;
};

const countSolutions = (board: number[][], limit = 2) => {
  const rows = Array.from({ length: SIZE }, () => new Set<number>());
  const cols = Array.from({ length: SIZE }, () => new Set<number>());
  const boxes = Array.from({ length: SIZE }, () => new Set<number>());
  const empties: Position[] = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = board[r][c];
      if (value === 0) {
        empties.push({ r, c });
        continue;
      }

      const box = Math.floor(r / 2) * 2 + Math.floor(c / 2);
      if (rows[r].has(value) || cols[c].has(value) || boxes[box].has(value)) {
        return 0;
      }
      rows[r].add(value);
      cols[c].add(value);
      boxes[box].add(value);
    }
  }

  let count = 0;
  const search = (index: number) => {
    if (count >= limit) return;
    if (index === empties.length) {
      count += 1;
      return;
    }

    const { r, c } = empties[index];
    const box = Math.floor(r / 2) * 2 + Math.floor(c / 2);
    for (let value = 1; value <= SIZE; value++) {
      if (rows[r].has(value) || cols[c].has(value) || boxes[box].has(value)) continue;

      rows[r].add(value);
      cols[c].add(value);
      boxes[box].add(value);
      search(index + 1);
      rows[r].delete(value);
      cols[c].delete(value);
      boxes[box].delete(value);
    }
  };

  search(0);
  return count;
};

const createGame = (difficulty: Difficulty) => {
  let cluesToKeep = 12;
  if (difficulty === DIFFICULTY.MEDIUM) cluesToKeep = 9;
  if (difficulty === DIFFICULTY.HARD) cluesToKeep = 6;

  while (true) {
    const solution = generateSolution();
    const indices = shuffle(Array.from({ length: SIZE * SIZE }, (_, i) => i));
    const keepIndices = new Set(indices.slice(0, cluesToKeep));
    const valuesGrid: number[][] = [];

    for (let r = 0; r < SIZE; r++) {
      const row: number[] = [];
      for (let c = 0; c < SIZE; c++) {
        row.push(keepIndices.has(r * SIZE + c) ? solution[r][c] : 0);
      }
      valuesGrid.push(row);
    }

    if (countSolutions(valuesGrid) !== 1) continue;

    const initialGrid: Cell[][] = valuesGrid.map((row, r) =>
      row.map((value, c) => ({
        row: r,
        col: c,
        value,
        isFixed: value !== 0,
        isError: false,
      }))
    );

    return { initialGrid, solution };
  }
};

type BoardProps = {
  grid: Cell[][];
  selectedCell: Position | null;
  onCellClick: (r: number, c: number) => void;
  status: Status;
};

const Board = ({ grid, selectedCell, onCellClick, status }: BoardProps) => {
  if (!grid || grid.length < SIZE) {
    return <div className="h-[280px] flex items-center justify-center text-slate-400">Magic loading... 🌈</div>;
  }

  const quadrants = [
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    [
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
    ],
    [
      [2, 0],
      [2, 1],
      [3, 0],
      [3, 1],
    ],
    [
      [2, 2],
      [2, 3],
      [3, 2],
      [3, 3],
    ],
  ] as const;

  return (
    <div className="bg-white p-3 sm:p-5 rounded-[32px] sm:rounded-[40px] shadow-soft border-2 sm:border-4 border-white select-none relative max-w-[95vw] mx-auto">
      <div className="absolute left-1/2 top-4 bottom-4 sm:top-6 sm:bottom-6 w-[3px] sm:w-[4px] bg-brand-100 transform -translate-x-1/2 z-0 rounded-full"></div>
      <div className="absolute top-1/2 left-4 right-4 sm:left-6 sm:right-6 h-[3px] sm:h-[4px] bg-brand-100 transform -translate-y-1/2 z-0 rounded-full"></div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6 relative z-10">
        {quadrants.map((quad, qIdx) => (
          <div key={qIdx} className="grid grid-cols-2 gap-2 sm:gap-3">
            {quad.map(([r, c]) => {
              const cell = grid[r][c];
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const isPlaying = status === 'playing';

              let baseStyle =
                'w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center text-2xl sm:text-4xl font-extrabold rounded-xl sm:rounded-2xl cursor-pointer cell-anim relative ';

              if (cell.isFixed) {
                baseStyle += 'bg-slate-50 text-slate-300 shadow-inner-light';
              } else if (cell.isError) {
                baseStyle += 'bg-orange-50 text-orange-500 border-2 sm:border-4 border-orange-200';
              } else if (cell.value !== 0) {
                baseStyle += 'bg-brand-50 text-brand-600 border-2 sm:border-4 border-brand-100';
              } else {
                baseStyle += 'bg-white text-slate-700 border-2 sm:border-4 border-slate-50 hover:border-brand-100';
              }

              if (isSelected && isPlaying) {
                baseStyle += ' ring-4 sm:ring-8 ring-brand-100 ring-offset-0 scale-105 z-10';
              }

              return (
                <div key={`${r}-${c}`} onClick={() => isPlaying && onCellClick(r, c)} className={baseStyle}>
                  {cell.value !== 0 ? cell.value : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

type ControlsProps = {
  onInput: (value: number) => void;
  onCheck: () => void;
  onHint: () => void;
  onGiveUp: () => void;
  onNewGame: () => void;
  status: Status;
  hintUsed: boolean;
  canUseHint: boolean;
};

const Controls = ({
  onInput,
  onCheck,
  onHint,
  onGiveUp,
  onNewGame,
  status,
  hintUsed,
  canUseHint,
}: ControlsProps) => {
  const isPlaying = status === 'playing';
  const actionGridClass = canUseHint ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 gap-3';

  return (
    <div className="w-full max-w-sm mt-6 sm:mt-8 space-y-4 sm:space-y-6">
      <div className={`grid grid-cols-5 gap-2 sm:gap-3 transition-opacity duration-300 ${!isPlaying ? 'opacity-30 pointer-events-none' : ''}`}>
        {[1, 2, 3, 4].map((num) => (
          <button
            key={num}
            onClick={() => onInput(num)}
            className="aspect-square bg-white border-b-4 sm:border-b-8 border-slate-200 rounded-xl sm:rounded-[24px] text-2xl sm:text-3xl font-black text-slate-700 active:border-b-0 active:translate-y-1 sm:active:translate-y-2 transition-all shadow-sm hover:bg-slate-50 btn-press"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => onInput(0)}
          className="aspect-square bg-slate-100 border-b-4 sm:border-b-8 border-slate-300 rounded-xl sm:rounded-[24px] text-slate-500 active:border-b-0 active:translate-y-1 sm:active:translate-y-2 transition-all shadow-sm hover:bg-slate-200 flex items-center justify-center btn-press"
        >
          <Eraser size={24} className="sm:hidden" />
          <Eraser size={28} className="hidden sm:block" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className={actionGridClass}>
          <button
            onClick={onCheck}
            disabled={!isPlaying}
            className="flex items-center justify-center gap-2 sm:gap-3 bg-brand-500 hover:bg-brand-600 text-white py-4 sm:py-5 rounded-2xl sm:rounded-[28px] text-lg sm:text-xl font-black shadow-lg shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50 btn-press"
          >
            <CheckCircle2 size={20} className="sm:size-24" strokeWidth={3} /> Check!
          </button>
          {canUseHint ? (
            <button
              onClick={onHint}
              disabled={!isPlaying || hintUsed}
              className={`flex items-center justify-center gap-2 sm:gap-3 py-4 sm:py-5 rounded-2xl sm:rounded-[28px] text-lg sm:text-xl font-black active:scale-95 transition-all btn-press border-b-4 sm:border-b-8 ${
                hintUsed
                  ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                  : 'bg-amber-400 text-white border-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-500/20'
              }`}
            >
              <Zap size={20} className="sm:size-24" fill="currentColor" /> {hintUsed ? 'Used' : 'Hint!'}
            </button>
          ) : null}
        </div>

        <button
          onClick={onGiveUp}
          disabled={!isPlaying}
          className="flex items-center justify-center gap-2 py-3 rounded-xl sm:rounded-2xl text-slate-400 hover:text-slate-600 font-bold active:scale-95 transition-all btn-press border-2 border-slate-100 hover:bg-white disabled:opacity-30"
        >
          <LogOut size={18} /> I'm Done for Now
        </button>
      </div>

      <div className="text-center pt-2">
        <button
          onClick={onNewGame}
          className="text-brand-600 font-bold text-base flex items-center justify-center gap-2 mx-auto transition-colors hover:bg-white px-4 py-2 rounded-full"
        >
          <RefreshCw size={18} /> Start a New Game
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTY.EASY);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [status, setStatus] = useState<Status>('playing');
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [msg, setMsg] = useState<Message | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [motto, setMotto] = useState('');

  const canUseHint = difficulty !== DIFFICULTY.HARD;

  const startNewGame = useCallback((diff: Difficulty = difficulty) => {
    const { initialGrid, solution: nextSolution } = createGame(diff);
    setGrid(initialGrid);
    setSolution(nextSolution);
    setStatus('playing');
    setHintUsed(false);
    setSelectedCell(null);
    setMsg(null);
    setMistakes(0);
    setMotto('');
  }, [difficulty]);

  useEffect(() => {
    startNewGame(DIFFICULTY.EASY);
  }, []);

  const handleInput = useCallback((value: number) => {
    if (status !== 'playing' || !selectedCell || grid.length < SIZE) return;

    const { r, c } = selectedCell;
    if (!grid[r]?.[c] || grid[r][c].isFixed) return;

    setGrid((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      next[r][c].value = value;
      next[r][c].isError = false;
      return next;
    });

    if (msg?.type !== 'success') {
      setMsg(null);
    }
  }, [grid, msg, selectedCell, status]);

  const handleCheck = useCallback(() => {
    if (status !== 'playing' || grid.length < SIZE) return;

    const nextGrid = grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        isError: cell.value !== 0 && cell.value !== solution[cell.row][cell.col],
      }))
    );
    setGrid(nextGrid);

    const hasErr = nextGrid.some((row) => row.some((cell) => cell.isError));
    const isFull = nextGrid.every((row) => row.every((cell) => cell.value !== 0));

    if (hasErr) {
      setMistakes((current) => current + 1);
      setMsg({ text: "Oopsie! Let's check! 🕵️‍♂️", type: 'error' });
    } else if (!isFull) {
      setMsg({ text: 'Yay! Looking great! 🌟', type: 'info' });
    } else {
      setStatus('won');
      setMotto(mistakes === 0 ? "You're a Math Superhero! 🦸‍♂️✨" : 'Great job! You never gave up! 💪🌈');
      setMsg(null);
      setSelectedCell(null);
    }
  }, [grid, mistakes, solution, status]);

  const handleHint = useCallback(() => {
    if (!canUseHint || status !== 'playing' || hintUsed || grid.length < SIZE) return;

    let target: Position | null = null;
    if (
      selectedCell &&
      !grid[selectedCell.r][selectedCell.c].isFixed &&
      grid[selectedCell.r][selectedCell.c].value === 0
    ) {
      target = selectedCell;
    } else {
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (!grid[r][c].isFixed && grid[r][c].value === 0) {
            target = { r, c };
            break;
          }
        }
        if (target) break;
      }
    }

    if (!target) return;

    setGrid((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      next[target.r][target.c].value = solution[target.r][target.c];
      next[target.r][target.c].isError = false;
      return next;
    });
    setHintUsed(true);
    setMsg({ text: 'A little bit of magic! ✨', type: 'success' });
  }, [canUseHint, grid, hintUsed, selectedCell, solution, status]);

  const handleGiveUp = useCallback(() => {
    if (status !== 'playing') return;
    setStatus('given_up');
    setMotto('You tried your best! Every puzzle makes you smarter! 🧠💖');
    setMsg(null);
    setSelectedCell(null);
  }, [status]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (status !== 'playing' || grid.length < SIZE) return;

      if (['1', '2', '3', '4'].includes(event.key)) handleInput(Number.parseInt(event.key, 10));
      if (event.key === 'Backspace' || event.key === 'Delete') handleInput(0);
      if (event.key === 'Enter') handleCheck();

      if (selectedCell) {
        let { r, c } = selectedCell;
        if (event.key === 'ArrowUp') r = (r - 1 + SIZE) % SIZE;
        if (event.key === 'ArrowDown') r = (r + 1) % SIZE;
        if (event.key === 'ArrowLeft') c = (c - 1 + SIZE) % SIZE;
        if (event.key === 'ArrowRight') c = (c + 1) % SIZE;
        setSelectedCell({ r, c });
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [grid, handleCheck, handleInput, selectedCell, status]);

  return (
    <div className="w-full max-w-lg flex flex-col items-center app-container">
      <div className="text-center mb-6 sm:mb-10 w-full header-section">
        <div className="flex flex-col items-center justify-center gap-2 mb-4">
          <div className="bg-white p-3 sm:p-4 rounded-full shadow-lg text-brand-500 mb-1 bounce-in">
            <Sparkles size={32} className="sm:size-40" fill="currentColor" strokeWidth={3} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-[900] text-brand-900 tracking-tight">Magic Sudoku</h1>
          <p className="text-brand-600 font-bold text-sm sm:text-base">The Number Puzzle Adventure!</p>
        </div>

        <div className="bg-brand-100 p-1.5 rounded-2xl sm:rounded-[28px] flex w-full">
          {Object.values(DIFFICULTY).map((level) => (
            <button
              key={level}
              onClick={() => {
                setDifficulty(level);
                startNewGame(level);
              }}
              className={`flex-1 py-2 sm:py-3 text-sm sm:text-base font-[800] rounded-xl sm:rounded-[22px] transition-all ${
                difficulty === level ? 'bg-white text-brand-600 shadow-md scale-105' : 'text-brand-900/40 hover:text-brand-600'
              }`}
            >
              {level.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Board grid={grid} selectedCell={selectedCell} onCellClick={(r, c) => setSelectedCell({ r, c })} status={status} />

        <div
          className={`absolute -bottom-14 sm:-bottom-16 left-0 right-0 flex justify-center transition-all duration-300 pointer-events-none z-20 ${
            msg ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-90'
          }`}
        >
          <div
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-black shadow-xl flex items-center gap-2 sm:gap-3 border-2 sm:border-4 ${
              msg?.type === 'error'
                ? 'bg-orange-50 text-orange-600 border-orange-200'
                : msg?.type === 'success'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-brand-600 text-white border-brand-500'
            }`}
          >
            {msg?.type === 'info' ? <Heart size={18} fill="currentColor" /> : <Info size={18} />}
            {msg?.text}
          </div>
        </div>
      </div>

      {(status === 'won' || status === 'given_up') && (
        <div
          className={`mt-16 sm:mt-20 w-full p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-2xl text-center transform scale-105 sm:scale-110 transition-all duration-700 ${
            status === 'won' ? 'bg-gradient-to-br from-brand-500 to-green-600 animate-bounce' : 'bg-gradient-to-br from-slate-400 to-slate-500'
          }`}
        >
          {status === 'won' ? (
            <PartyPopper size={48} className="mx-auto text-white mb-4 sm:size-60" />
          ) : (
            <Star size={48} className="mx-auto text-white mb-4 sm:size-60" fill="white" />
          )}
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 italic">{status === 'won' ? 'YOU DID IT!' : 'GOOD EFFORT!'}</h2>
          <p className="text-white font-black text-xl sm:text-2xl leading-tight opacity-90">{motto}</p>
          <div className="mt-6 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((item) => (
              <Star key={item} size={20} fill="white" className="animate-pulse" />
            ))}
          </div>
          <button onClick={() => startNewGame()} className="mt-8 bg-white text-brand-600 font-black px-6 py-3 rounded-full shadow-lg active:scale-95 transition-all">
            Try Another One!
          </button>
        </div>
      )}

      {status === 'playing' && (
        <Controls
          onInput={handleInput}
          onCheck={handleCheck}
          onHint={handleHint}
          onGiveUp={handleGiveUp}
          onNewGame={() => startNewGame()}
          status={status}
          hintUsed={hintUsed}
          canUseHint={canUseHint}
        />
      )}

      <div className="mt-10 sm:mt-12 text-brand-900/30 text-xs sm:text-sm font-black tracking-widest uppercase flex flex-wrap justify-center gap-2 sm:gap-4 mb-4">
        <span className="bg-brand-100/50 px-3 py-1 rounded-full text-brand-900/60">Enter = Check</span>
        <span className="bg-brand-100/50 px-3 py-1 rounded-full text-brand-900/60">Arrows = Move</span>
      </div>
    </div>
  );
}
