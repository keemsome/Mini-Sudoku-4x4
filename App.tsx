import { useCallback, useEffect, useRef, useState } from 'react';
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

const DIFFICULTY_HELPER_TEXT: Record<Difficulty, string> = {
  [DIFFICULTY.EASY]: 'Friendly warm-up with plenty of givens and one hint to help you settle in.',
  [DIFFICULTY.MEDIUM]: 'A balanced challenge with fewer clues and one carefully timed hint.',
  [DIFFICULTY.HARD]: 'No hints. Trust your logic and finish the grid on your own.',
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
  onCellSelect: (r: number, c: number) => void;
  status: Status;
};

const Board = ({ grid, selectedCell, onCellSelect, status }: BoardProps) => {
  const cellRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!selectedCell || status !== 'playing') return;

    const nextCell = cellRefs.current[`${selectedCell.r}-${selectedCell.c}`];
    if (nextCell && document.activeElement !== nextCell) {
      nextCell.focus();
    }
  }, [selectedCell, status]);

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

  const getCellLabel = (cell: Cell, isSelected: boolean) => {
    const valueText = cell.value === 0 ? 'empty' : `value ${cell.value}`;
    const kindText = cell.isFixed ? 'fixed clue' : 'editable cell';
    const errorText = cell.isError ? 'incorrect' : 'not marked incorrect';
    const selectedText = isSelected ? 'selected' : 'not selected';
    return `Row ${cell.row + 1}, column ${cell.col + 1}, ${kindText}, ${valueText}, ${errorText}, ${selectedText}.`;
  };

  return (
    <div
      className="bg-white/92 p-2 mobile-compact:p-2 sm:p-5 rounded-[24px] mobile-compact:rounded-[22px] sm:rounded-[40px] shadow-soft border-2 sm:border-4 border-white/80 select-none relative max-w-[95vw] mx-auto"
      role="grid"
      aria-label="Mini Sudoku board"
    >
      <div className="absolute left-1/2 top-2.5 bottom-2.5 mobile-compact:top-2 mobile-compact:bottom-2 sm:top-6 sm:bottom-6 w-[3px] sm:w-[4px] bg-brand-100/80 transform -translate-x-1/2 z-0 rounded-full"></div>
      <div className="absolute top-1/2 left-2.5 right-2.5 mobile-compact:left-2 mobile-compact:right-2 sm:left-6 sm:right-6 h-[3px] sm:h-[4px] bg-brand-100/80 transform -translate-y-1/2 z-0 rounded-full"></div>

      <div className="grid grid-cols-2 gap-2 mobile-compact:gap-1.5 sm:gap-6 relative z-10">
        {quadrants.map((quad, qIdx) => (
          <div key={qIdx} className="grid grid-cols-2 gap-1.5 mobile-compact:gap-1 sm:gap-3" role="rowgroup">
            {quad.map(([r, c]) => {
              const cell = grid[r][c];
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const isPlaying = status === 'playing';
              const fallbackFocusable = !selectedCell && r === 0 && c === 0;

              let baseStyle =
                'w-[3rem] h-[3rem] mobile-compact:w-[2.7rem] mobile-compact:h-[2.7rem] sm:w-20 sm:h-20 flex items-center justify-center text-[1.55rem] mobile-compact:text-[1.35rem] sm:text-4xl font-extrabold rounded-[16px] mobile-compact:rounded-[14px] sm:rounded-2xl cell-anim relative border transition-colors duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f0fdf4] ';

              if (cell.isFixed) {
                baseStyle += 'bg-slate-100 text-slate-700 border-slate-200 shadow-inner-light';
              } else if (cell.isError) {
                baseStyle += 'bg-orange-50 text-orange-600 border-orange-300 shadow-sm';
              } else if (cell.value !== 0) {
                baseStyle += 'bg-brand-50 text-brand-700 border-brand-200 shadow-sm';
              } else {
                baseStyle += 'bg-white text-slate-500 border-slate-200 hover:border-brand-200';
              }

              if (isSelected && isPlaying) {
                baseStyle += ' ring-4 sm:ring-8 ring-brand-100 scale-[1.03] z-10';
              }

              return (
                <button
                  key={`${r}-${c}`}
                  ref={(node) => {
                    cellRefs.current[`${r}-${c}`] = node;
                  }}
                  type="button"
                  role="gridcell"
                  aria-label={getCellLabel(cell, isSelected)}
                  aria-selected={isSelected}
                  tabIndex={isPlaying && (isSelected || fallbackFocusable) ? 0 : -1}
                  onClick={() => isPlaying && onCellSelect(r, c)}
                  onFocus={() => isPlaying && onCellSelect(r, c)}
                  className={baseStyle}
                >
                  {cell.value !== 0 ? cell.value : ''}
                </button>
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
    <div className="w-full max-w-sm mt-4 mobile-compact:mt-3 sm:mt-8 space-y-3 mobile-compact:space-y-2.5 sm:space-y-6">
      <div className={`grid grid-cols-5 gap-2 sm:gap-3 transition-opacity duration-300 ${!isPlaying ? 'opacity-30 pointer-events-none' : ''}`}>
        {[1, 2, 3, 4].map((num) => (
          <button
            key={num}
            onClick={() => onInput(num)}
            className="aspect-square min-h-[2.85rem] mobile-compact:min-h-[2.6rem] bg-white border-b-4 sm:border-b-8 border-slate-200 rounded-xl mobile-compact:rounded-[14px] sm:rounded-[24px] text-lg mobile-compact:text-base sm:text-3xl font-black text-slate-700 active:border-b-0 active:translate-y-1 sm:active:translate-y-2 transition-all shadow-sm hover:bg-slate-50 btn-press"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => onInput(0)}
          className="aspect-square min-h-[2.85rem] mobile-compact:min-h-[2.6rem] bg-slate-100 border-b-4 sm:border-b-8 border-slate-300 rounded-xl mobile-compact:rounded-[14px] sm:rounded-[24px] text-slate-500 active:border-b-0 active:translate-y-1 sm:active:translate-y-2 transition-all shadow-sm hover:bg-slate-200 flex items-center justify-center btn-press"
        >
          <Eraser size={20} className="sm:hidden" />
          <Eraser size={28} className="hidden sm:block" />
        </button>
      </div>

      <div className="flex flex-col gap-2.5 mobile-compact:gap-2">
        <div className={actionGridClass}>
          <button
            onClick={onCheck}
            disabled={!isPlaying}
            className="min-h-[3rem] mobile-compact:min-h-[2.8rem] flex items-center justify-center gap-2 sm:gap-3 bg-brand-500 hover:bg-brand-600 text-white py-3 mobile-compact:py-2.5 sm:py-5 rounded-2xl mobile-compact:rounded-[18px] sm:rounded-[28px] text-[15px] mobile-compact:text-sm sm:text-xl font-black shadow-lg shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50 btn-press"
          >
            <CheckCircle2 size={18} className="sm:size-24" strokeWidth={3} /> Check!
          </button>
          {canUseHint ? (
            <button
              onClick={onHint}
              disabled={!isPlaying || hintUsed}
              className={`min-h-[3rem] mobile-compact:min-h-[2.8rem] flex items-center justify-center gap-2 sm:gap-3 py-3 mobile-compact:py-2.5 sm:py-5 rounded-2xl mobile-compact:rounded-[18px] sm:rounded-[28px] text-[15px] mobile-compact:text-sm sm:text-xl font-black active:scale-95 transition-all btn-press border-b-4 sm:border-b-8 ${
                hintUsed
                  ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                  : 'bg-amber-400 text-white border-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-500/20'
              }`}
            >
              <Zap size={18} className="sm:size-24" fill="currentColor" /> {hintUsed ? 'Used' : 'Hint!'}
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2.5 mobile-compact:gap-2 items-center">
          <button
            onClick={onGiveUp}
            disabled={!isPlaying}
            className="min-h-[2.75rem] mobile-compact:min-h-[2.55rem] flex items-center justify-center gap-1.5 py-2.5 rounded-xl mobile-compact:rounded-[14px] sm:rounded-2xl text-slate-500 hover:text-slate-700 text-sm mobile-compact:text-[13px] font-bold active:scale-95 transition-all btn-press border-2 border-slate-100 hover:bg-white disabled:opacity-30"
          >
            <LogOut size={16} /> Give Up
          </button>
          <button
            onClick={onNewGame}
            className="min-h-[2.75rem] mobile-compact:min-h-[2.55rem] text-brand-700 font-bold text-sm mobile-compact:text-[13px] flex items-center justify-center gap-1.5 transition-colors bg-white/80 border-2 border-white rounded-xl mobile-compact:rounded-[14px] px-3 py-2.5 shadow-sm hover:bg-white btn-press"
          >
            <RefreshCw size={16} /> New Game
          </button>
        </div>
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
  const difficultyHelperText = DIFFICULTY_HELPER_TEXT[difficulty];

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
    <div className="w-full max-w-[26rem] sm:max-w-xl flex flex-col items-center app-container px-3 sm:px-0">
      <div className="text-center mb-4 mobile-compact:mb-3 sm:mb-10 w-full header-section">
        <div className="flex flex-col items-center justify-center gap-1.5 mobile-compact:gap-1 mb-2.5 sm:mb-4">
          <div className="bg-white p-2.5 mobile-compact:p-2 sm:p-4 rounded-full shadow-lg text-brand-500 mb-1 bounce-in">
            <Sparkles size={28} className="mobile-compact:size-24 sm:size-40" fill="currentColor" strokeWidth={3} />
          </div>
          <h1 className="text-[1.7rem] mobile-compact:text-[1.5rem] sm:text-4xl font-[900] text-brand-900 tracking-tight">Magic Sudoku</h1>
          <p className="text-brand-700/90 font-bold text-[13px] mobile-compact:text-xs sm:text-base max-w-xs sm:max-w-none mobile-compact:hidden">The Number Puzzle Adventure!</p>
        </div>

        <div className="bg-brand-100/90 p-1.5 mobile-compact:p-1 rounded-2xl sm:rounded-[28px] flex w-full shadow-sm">
          {Object.values(DIFFICULTY).map((level) => (
            <button
              key={level}
              onClick={() => {
                setDifficulty(level);
                startNewGame(level);
              }}
              className={`flex-1 py-2 mobile-compact:py-1.5 text-[13px] mobile-compact:text-xs sm:text-base font-[800] rounded-xl mobile-compact:rounded-[14px] sm:rounded-[22px] transition-all ${
                difficulty === level
                  ? 'bg-white text-brand-700 shadow-md scale-105 ring-2 ring-white/90'
                  : 'text-brand-900/50 hover:text-brand-700'
              }`}
              aria-pressed={difficulty === level}
            >
              {level.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="mt-2.5 mobile-compact:mt-2 min-h-[3.15rem] mobile-compact:min-h-[2.8rem] rounded-2xl mobile-compact:rounded-[18px] bg-white/80 border border-white/80 px-3.5 mobile-compact:px-3 py-2.5 mobile-compact:py-2 text-left shadow-sm mobile-compact:hidden">
          <p className="text-[10px] mobile-compact:text-[9px] font-black uppercase tracking-[0.22em] text-brand-700/60">{difficulty.split(' ')[0]} mode</p>
          <p className="mt-0.5 text-[13px] mobile-compact:text-[12px] sm:text-[15px] font-bold text-slate-600 leading-snug">{difficultyHelperText}</p>
        </div>

        <p className="hidden mobile-compact:block mt-1.5 text-[11px] font-bold text-brand-800/70">
          {difficulty.split(' ')[0]}: {difficulty === DIFFICULTY.HARD ? 'no hints' : 'one hint available'}
        </p>
      </div>

      <div className="w-full relative">
        <Board grid={grid} selectedCell={selectedCell} onCellSelect={(r, c) => setSelectedCell({ r, c })} status={status} />

        <div
          className={`absolute inset-x-3 top-1/2 -translate-y-1/2 sm:inset-x-8 flex justify-center pointer-events-none transition-all duration-300 z-30 ${
            msg ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div
            className={`w-full max-w-xs sm:max-w-sm px-3.5 mobile-compact:px-3 sm:px-6 py-2 mobile-compact:py-1.5 sm:py-3 rounded-[18px] mobile-compact:rounded-[16px] sm:rounded-full text-[13px] mobile-compact:text-[12px] sm:text-lg font-black shadow-xl flex items-center justify-center text-center gap-1.5 sm:gap-3 border-2 sm:border-4 backdrop-blur-sm ${
              msg?.type === 'error'
                ? 'bg-orange-50/96 text-orange-700 border-orange-200'
                : msg?.type === 'success'
                  ? 'bg-blue-50/96 text-blue-700 border-blue-200'
                  : 'bg-brand-600/96 text-white border-brand-500'
            }`}
          >
            {msg?.type === 'info' ? <Heart size={16} fill="currentColor" /> : <Info size={16} />}
            {msg?.text}
          </div>
        </div>
      </div>

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

      <p className="sr-only">Use Tab to enter the board, arrow keys to move between cells, number keys to fill values, and Enter to check your progress.</p>

      <div className="mt-5 mobile-compact:mt-4 sm:mt-10 text-brand-900/30 text-[10px] mobile-compact:text-[9px] sm:text-sm font-black tracking-[0.16em] uppercase flex flex-wrap justify-center gap-1.5 sm:gap-4 mb-2 sm:mb-4 mobile-compact:hidden">
        <span className="bg-brand-100/50 px-3 py-1 rounded-full text-brand-900/60">Enter = Check</span>
        <span className="bg-brand-100/50 px-3 py-1 rounded-full text-brand-900/60">Arrows = Move</span>
        <span className="bg-brand-100/50 px-3 py-1 rounded-full text-brand-900/60">Tab = Focus Board</span>
      </div>

      {(status === 'won' || status === 'given_up') && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px] px-4">
          <div
            className={`w-full max-w-sm p-6 sm:p-8 rounded-[28px] sm:rounded-[34px] shadow-2xl text-center border-2 border-white/30 ${
              status === 'won' ? 'bg-gradient-to-br from-brand-500 to-green-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'
            }`}
          >
            {status === 'won' ? (
              <PartyPopper size={42} className="mx-auto text-white mb-3 celebrate-pop" />
            ) : (
              <Star size={42} className="mx-auto text-white mb-3 gentle-float" fill="white" />
            )}
            <h2 className="text-[1.75rem] sm:text-4xl font-black text-white mb-2 italic">
              {status === 'won' ? 'YOU DID IT!' : 'GOOD EFFORT!'}
            </h2>
            <p className="text-white font-black text-lg sm:text-2xl leading-tight opacity-95">{motto}</p>
            <div className="mt-5 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((item) => (
                <Star key={item} size={18} fill="white" className="soft-pulse" />
              ))}
            </div>
            <button
              onClick={() => startNewGame()}
              className="mt-6 w-full bg-white text-brand-600 font-black px-6 py-3 rounded-full shadow-lg active:scale-95 transition-all"
            >
              Try Another One!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
