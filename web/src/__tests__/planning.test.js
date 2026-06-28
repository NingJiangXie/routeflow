import { describe, it, expect } from 'vitest';
import { createGrid, planPath } from '../app/lib/planning.js';

describe('createGrid', () => {
  it('creates a grid of the correct size', () => {
    const grid = createGrid(10, 20, { x: 0, y: 0 }, { x: 9, y: 9 });
    expect(grid.length).toBe(10);
    expect(grid[0].length).toBe(10);
  });

  it('ensures start and goal are walkable', () => {
    const start = { x: 1, y: 1 };
    const goal = { x: 8, y: 8 };
    const grid = createGrid(10, 50, start, goal);
    expect(grid[start.y][start.x]).toBe(0);
    expect(grid[goal.y][goal.x]).toBe(0);
  });

  it('handles zero density', () => {
    const grid = createGrid(5, 0, { x: 0, y: 0 }, { x: 4, y: 4 });
    const walkable = grid.flat().filter((c) => c === 0).length;
    expect(walkable).toBe(25);
  });
});

describe('planPath', () => {
  it('supports astar algorithm and returns success', () => {
    const grid = Array(8).fill(null).map(() => Array(8).fill(0));
    const start = { x: 0, y: 0 };
    const goal = { x: 7, y: 7 };
    const result = planPath(grid, start, goal, 'astar');
    expect(result.success).toBe(true);
    expect(result.algorithm).toBe('A*');
    expect(result.path.length).toBeGreaterThan(0);
    expect(result.path[0]).toEqual(start);
    expect(result.path[result.path.length - 1]).toEqual(goal);
  });

  it('supports dstar algorithm', () => {
    const grid = Array(8).fill(null).map(() => Array(8).fill(0));
    const start = { x: 0, y: 0 };
    const goal = { x: 7, y: 7 };
    const result = planPath(grid, start, goal, 'dstar');
    expect(result.success).toBe(true);
    expect(result.algorithm).toBe('D* Lite');
  });

  it('supports rrt algorithm', () => {
    const grid = Array(8).fill(null).map(() => Array(8).fill(0));
    const start = { x: 0, y: 0 };
    const goal = { x: 7, y: 7 };
    const result = planPath(grid, start, goal, 'rrt');
    expect(result.algorithm).toBe('RRT*');
  });

  it('supports aco algorithm', () => {
    const grid = Array(8).fill(null).map(() => Array(8).fill(0));
    const start = { x: 0, y: 0 };
    const goal = { x: 7, y: 7 };
    const result = planPath(grid, start, goal, 'aco');
    expect(result.algorithm).toBe('ACO');
  });

  it('fails when no path exists', () => {
    const grid = Array(5).fill(null).map(() => Array(5).fill(0));
    for (let i = 0; i < 5; i++) grid[2][i] = 1;
    const start = { x: 0, y: 0 };
    const goal = { x: 4, y: 4 };
    const result = planPath(grid, start, goal, 'astar');
    expect(result.success).toBe(false);
    expect(result.path).toEqual([]);
  });

  it('handles start equals goal', () => {
    const grid = Array(5).fill(null).map(() => Array(5).fill(0));
    const start = { x: 2, y: 2 };
    const result = planPath(grid, start, start, 'astar');
    expect(result.success).toBe(true);
    expect(result.path).toEqual([start]);
  });

  it('falls back to astar for unknown algorithm', () => {
    const grid = Array(8).fill(null).map(() => Array(8).fill(0));
    const start = { x: 0, y: 0 };
    const goal = { x: 7, y: 7 };
    const result = planPath(grid, start, goal, 'unknown');
    expect(result.success).toBe(true);
  });
});
