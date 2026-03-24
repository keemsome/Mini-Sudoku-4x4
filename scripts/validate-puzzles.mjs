const SIZE = 4;

const Difficulty = {
  EASY: "Beginner 🌟",
  MEDIUM: "Explorer 🔎",
  HARD: "Master 👑",
};

const shuffle = (array) => {
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

  const swapCols = (c1, c2) => {
    for (let r = 0; r < SIZE; r++) {
      [grid[r][c1], grid[r][c2]] = [grid[r][c2], grid[r][c1]];
    }
  };

  if (Math.random() > 0.5) swapCols(0, 1);
  if (Math.random() > 0.5) swapCols(2, 3);
  return grid;
};

const countSolutions = (board, limit = 2) => {
  const rows = Array.from({ length: SIZE }, () => new Set());
  const cols = Array.from({ length: SIZE }, () => new Set());
  const boxes = Array.from({ length: SIZE }, () => new Set());
  const empties = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = board[r][c];
      if (value === 0) {
        empties.push([r, c]);
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
  const search = (index) => {
    if (count >= limit) return;
    if (index === empties.length) {
      count += 1;
      return;
    }

    const [r, c] = empties[index];
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

const createGame = (difficulty) => {
  let cluesToKeep = 12;
  if (difficulty === Difficulty.MEDIUM) cluesToKeep = 9;
  if (difficulty === Difficulty.HARD) cluesToKeep = 6;

  while (true) {
    const solution = generateSolution();
    const indices = shuffle(Array.from({ length: SIZE * SIZE }, (_, i) => i));
    const keepIndices = new Set(indices.slice(0, cluesToKeep));
    const initialGrid = [];

    for (let r = 0; r < SIZE; r++) {
      const row = [];
      for (let c = 0; c < SIZE; c++) {
        row.push(keepIndices.has(r * SIZE + c) ? solution[r][c] : 0);
      }
      initialGrid.push(row);
    }

    if (countSolutions(initialGrid) === 1) {
      return { initialGrid, solution };
    }
  }
};

const sampleCount = Number.parseInt(process.argv[2] || "200", 10);

for (const difficulty of Object.values(Difficulty)) {
  let invalid = 0;
  let unique = 0;
  let multi = 0;

  for (let i = 0; i < sampleCount; i++) {
    const { initialGrid } = createGame(difficulty);
    const solutions = countSolutions(initialGrid);
    if (solutions === 0) invalid += 1;
    else if (solutions === 1) unique += 1;
    else multi += 1;
  }

  console.log(
    JSON.stringify({
      difficulty,
      total: sampleCount,
      invalid,
      unique,
      multi,
    })
  );
}
