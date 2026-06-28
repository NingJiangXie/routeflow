import { createGrid, pathLength, planPath } from '../web/src/app/lib/planning.js';

const start = { x: 1, y: 1 };
const goal = { x: 18, y: 18 };
const algorithms = ['astar', 'dstar', 'rrt', 'aco'];
const params = {
  rrt: { maxIterations: 1600, stepSize: 2, searchRadius: 4 },
  aco: { ants: 18, iterations: 42, evaporation: 0.14 },
};

for (const algorithm of algorithms) {
  const grid = createGrid(20, 12, start, goal);
  const result = planPath(grid, start, goal, algorithm, params[algorithm]);
  if (!result.success || result.path.length < 2) {
    throw new Error(`${algorithm} failed to produce a path`);
  }
  const first = result.path[0];
  const last = result.path.at(-1);
  if (first.x !== start.x || first.y !== start.y || last.x !== goal.x || last.y !== goal.y) {
    throw new Error(`${algorithm} returned an invalid endpoint`);
  }
  if (pathLength(result.path) <= 0) {
    throw new Error(`${algorithm} returned a zero-length path`);
  }
  for (const point of result.path) {
    if (grid[point.y]?.[point.x] !== 0) {
      throw new Error(`${algorithm} returned a path through an obstacle`);
    }
  }
}

console.log(`Planning smoke passed for ${algorithms.join(', ')} with default and tuned parameters`);
