# RouteFlow Algorithm Format Guide

<div align="center">

*Complete guide for importing custom algorithms into RouteFlow*

</div>

## Overview

RouteFlow allows you to import custom path planning algorithms. This guide explains the required format and provides examples.

## Algorithm Requirements

### 1. File Format

- **File Extension**: `.js` (JavaScript)
- **Encoding**: UTF-8
- **Content Type**: Must be a valid class definition

### 2. JavaScript Class Structure

Your algorithm must be a JavaScript class with the following structure:

```javascript
class YourAlgorithmName {
    constructor() {
        // Initialize your algorithm here
    }

    plan(grid, start, goal) {
        /*
         * @param grid - 2D array where 0 = free, 1 = obstacle
         * @param start - Start position {x, y}
         * @param goal - Goal position {x, y}
         * @returns Object with path and statistics
         */
        
        // Your algorithm implementation here

        return {
            success: true,
            path: [[x, y], ...],
            time: 0.0,
            length: 0.0,
            steps: 0,
            algorithm: 'Your Name'
        };
    }
}
```

### 3. Example: D* Lite Algorithm

```javascript
class RealDStarLite {
    constructor() {
        this.grid = null;
        this.rows = 0;
        this.cols = 0;
        this.g = [];
        this.rhs = [];
        this.km = 0;
        this.lastStart = null;
        this.goal = null;
        this.dirs = [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]];
    }
    
    heuristic(a, b) {
        return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
    }
    
    calculateKey(s) {
        const gVal = this.g[s[0]][s[1]];
        const rhsVal = this.rhs[s[0]][s[1]];
        return [Math.min(gVal, rhsVal) + this.heuristic(this.lastStart, s) + this.km, Math.min(gVal, rhsVal)];
    }
    
    isValid(r, c) {
        return r >= 0 && r < this.rows && c >= 0 && c < this.cols && !this.grid[r][c];
    }
    
    plan(grid, start, goal) {
        const startTime = performance.now();
        
        this.grid = grid;
        this.rows = grid.length;
        this.cols = grid[0].length;
        
        const s_start = [Math.round(start.y), Math.round(start.x)];
        const s_goal = [Math.round(goal.y), Math.round(goal.x)];
        
        this.g = Array(this.rows).fill().map(() => Array(this.cols).fill(Infinity));
        this.rhs = Array(this.rows).fill().map(() => Array(this.cols).fill(Infinity));
        this.rhs[s_goal[0]][s_goal[1]] = 0;
        this.km = 0;
        this.lastStart = s_start;
        this.goal = s_goal;
        
        this.open = [[...s_goal, ...this.calculateKey(s_goal)]];
        this.computeShortestPath();
        
        const path = this.extractPath(s_start, s_goal);
        const endTime = performance.now();
        
        let length = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const dx = path[i+1][0] - path[i][0];
            const dy = path[i+1][1] - path[i][1];
            length += Math.sqrt(dx*dx + dy*dy);
        }
        
        return {
            success: path.length > 0,
            path: path,
            time: endTime - startTime,
            length: length,
            steps: path.length,
            algorithm: 'D* Lite'
        };
    }
    
    computeShortestPath() {
        // D* Lite core algorithm implementation
    }
    
    extractPath(s_start, s_goal) {
        // Path extraction logic
        const path = [[s_start[0], s_start[1]]];
        return path;
    }
}
```

## Grid Format

### Grid Structure

```javascript
grid = [
    [0, 0, 0, 1, 0],
    [0, 1, 0, 1, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0]
];

// grid[y][x] - access row y, column x
// Value 0 = free cell
// Value 1 = obstacle
```

### Start and Goal Positions

```javascript
start = { x: 0, y: 0 };
goal = { x: 4, y: 4 };

// x = column index, y = row index
```

## Import Steps

### Step 1: Prepare Your Algorithm

1. Write your algorithm in JavaScript
2. Ensure it follows the required class structure
3. Test it locally if possible

### Step 2: Import to RouteFlow

1. Click the **Algorithm Management** button (⚙️)
2. Click **Import Algorithm File**
3. Select your `.js` file
4. Your algorithm will appear in the list

### Step 3: Use Your Algorithm

1. Select your imported algorithm from the dropdown
2. Click "Generate" to create a map
3. Click "Plan" to run your algorithm
4. View the results in the visualization

## Important Notes

### Grid Coordinate System

- **X-axis**: Horizontal (column index)
- **Y-axis**: Vertical (row index)
- **Origin**: Top-left corner (0, 0)

### Path Format

```javascript
path = [
    [0, 0],
    [1, 0],
    [2, 1],
    [3, 2],
    [4, 4]
];
```

### Return Values

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Whether path was found |
| `path` | Array | Array of [x, y] coordinates |
| `time` | Number | Execution time in milliseconds |
| `length` | Number | Total path length |
| `steps` | Number | Number of path segments |
| `algorithm` | String | Algorithm name for display |

### Error Handling

```javascript
plan(grid, start, goal) {
    try {
        return {
            success: true,
            path: calculatedPath,
            time: endTime - startTime,
            length: pathLength,
            steps: path.length,
            algorithm: 'Your Algorithm'
        };
    } catch (error) {
        return {
            success: false,
            path: [],
            time: 0,
            length: 0,
            steps: 0,
            algorithm: 'Your Algorithm'
        };
    }
}
```

## Sample Algorithm Template

```javascript
class MyCustomAlgorithm {
    constructor() {
        // Initialize your algorithm
    }

    plan(grid, start, goal) {
        const startTime = performance.now();
        
        const rows = grid.length;
        const cols = grid[0].length;
        
        // Your algorithm implementation here
        
        const path = [[start.x, start.y], [goal.x, goal.y]];
        
        let length = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const dx = path[i+1][0] - path[i][0];
            const dy = path[i+1][1] - path[i][1];
            length += Math.sqrt(dx*dx + dy*dy);
        }
        
        const endTime = performance.now();
        
        return {
            success: true,
            path: path,
            time: endTime - startTime,
            length: length,
            steps: path.length,
            algorithm: 'My Custom Algorithm'
        };
    }
}
```

## Advanced Tips

### 1. Use Performance API

```javascript
const startTime = performance.now();
const endTime = performance.now();
const executionTime = endTime - startTime;
```

### 2. Optimize Path Length Calculation

```javascript
function calculatePathLength(path) {
    let length = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const dx = path[i+1][0] - path[i][0];
        const dy = path[i+1][1] - path[i][1];
        length += Math.sqrt(dx*dx + dy*dy);
    }
    return length;
}
```

### 3. Support Diagonal Movement

```javascript
this.dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1]
];
```

## Troubleshooting

### Common Issues

1. **Algorithm not loading** - Check file extension (.js)
2. **Path not found** - Verify grid format and start/goal positions
3. **Slow performance** - Optimize your algorithm or reduce grid size

### Debug Tips

```javascript
plan(grid, start, goal) {
    console.log('Grid size:', grid.length, grid[0].length);
    console.log('Start:', start);
    console.log('Goal:', goal);
    
    console.log('Path found:', path.length, 'points');
    return result;
}
```

---

<div align="center">

**Happy coding!**

**For more information, visit our [GitHub Repository](https://github.com/NingJiangXie/routeflow)**

</div>
