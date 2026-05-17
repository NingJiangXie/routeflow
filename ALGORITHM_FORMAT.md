# RouteFlow Algorithm Format Guide | RouteFlow 算法格式指南

<div align="center">

**English / 简体中文**

*Complete guide for importing custom algorithms into RouteFlow*

</div>

## 📋 Overview | 概述

RouteFlow allows you to import custom path planning algorithms. This guide explains the required format and provides examples.

RouteFlow 允许您导入自定义路径规划算法。本指南说明了所需的格式并提供示例。

## 🎯 Algorithm Requirements | 算法要求

### 1. File Format | 文件格式

- **File Extension**: `.js` (JavaScript) or `.py` (Python)
- **Encoding**: UTF-8
- **Content Type**: Must be a valid class definition

### 2. JavaScript Class Structure | JavaScript 类结构

Your algorithm must be a JavaScript class with the following structure:

```javascript
class YourAlgorithmName {
    constructor() {
        // Initialize your algorithm here
        // 在这里初始化您的算法
    }

    // Required: Main planning function
    // 必需：主规划函数
    plan(grid, start, goal) {
        /*
         * @param grid - 2D array where 0 = free, 1 = obstacle
         * @param start - Start position {x, y}
         * @param goal - Goal position {x, y}
         * @returns Object with path and statistics
         */
        
        // Your algorithm implementation here
        // 您的算法实现

        return {
            success: true,           // Whether path was found | 是否找到路径
            path: [[x, y], ...],    // Array of [x, y] coordinates | 坐标数组
            time: 0.0,              // Execution time in ms | 执行时间（毫秒）
            length: 0.0,            // Total path length | 路径总长度
            steps: 0,               // Number of path segments | 路径段数
            algorithm: 'Your Name'  // Algorithm name | 算法名称
        };
    }
}
```

### 3. Example: D* Lite Algorithm | 示例：D* Lite 算法

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
        const s_goal = [Math.round(goal.y), Math.round(start.x)];
        
        // ... algorithm implementation ...
        
        const path = [[s_start[0], s_start[1]], /* ... */];
        const endTime = performance.now();
        
        let length = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const dx = path[i+1][0] - path[i][0];
            const dy = path[i+1][1] - path[i][1];
            length += Math.sqrt(dx*dx + dy*dy);
        }
        
        return {
            success: true,
            path: path,
            time: endTime - startTime,
            length: length,
            steps: path.length,
            algorithm: 'D* Lite'
        };
    }
}
```

## 📊 Grid Format | 网格格式

### Grid Structure | 网格结构

```javascript
// 2D grid array
grid = [
    [0, 0, 0, 1, 0],  // Row 0: columns 0-4
    [0, 1, 0, 1, 0],  // Row 1
    [0, 1, 0, 0, 0],  // Row 2
    [0, 0, 0, 1, 0],  // Row 3
    [0, 0, 0, 0, 0]   // Row 4
];

// grid[y][x] - access row y, column x
// Value 0 = free cell | 空闲单元格
// Value 1 = obstacle | 障碍物
```

### Start and Goal Positions | 起点和终点位置

```javascript
start = { x: 0, y: 0 };  // Top-left corner | 左上角
goal = { x: 4, y: 4 };   // Bottom-right corner | 右下角

// Note: x = column index, y = row index
// 注意：x = 列索引，y = 行索引
```

## 🔧 Import Steps | 导入步骤

### Step 1: Prepare Your Algorithm | 步骤 1：准备您的算法

1. Write your algorithm in JavaScript
2. Ensure it follows the required class structure
3. Test it locally if possible

### Step 2: Import to RouteFlow | 步骤 2：导入到 RouteFlow

1. Click the **Algorithm Management** button (⚙️)
2. Click **Import Algorithm File**
3. Select your `.js` file
4. Your algorithm will appear in the list

### Step 3: Use Your Algorithm | 步骤 3：使用您的算法

1. Select your imported algorithm from the dropdown
2. Click "Generate" to create a map
3. Click "Plan" to run your algorithm
4. View the results in the visualization

## ⚠️ Important Notes | 重要说明

### Grid Coordinate System | 网格坐标系

- **X-axis**: Horizontal (column index)
- **Y-axis**: Vertical (row index)
- **Origin**: Top-left corner (0, 0)

### Path Format | 路径格式

```javascript
// Path is an array of [x, y] coordinates
path = [
    [0, 0],    // Start position
    [1, 0],    // Move right
    [2, 1],    // Move down-right
    [3, 2],    // Move down-right
    [4, 4]     // Goal position
];
```

### Return Values | 返回值

| Field | Type | Description | 说明 |
|-------|------|-------------|------|
| `success` | Boolean | Whether path was found | 是否找到路径 |
| `path` | Array | Array of [x, y] coordinates | 坐标数组 |
| `time` | Number | Execution time in milliseconds | 执行时间（毫秒） |
| `length` | Number | Total path length | 路径总长度 |
| `steps` | Number | Number of path segments | 路径段数 |
| `algorithm` | String | Algorithm name for display | 显示的算法名称 |

### Error Handling | 错误处理

```javascript
plan(grid, start, goal) {
    try {
        // Your algorithm
        return {
            success: true,
            path: calculatedPath,
            // ... other fields
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

## 📝 Sample Algorithm Template | 示例算法模板

```javascript
class MyCustomAlgorithm {
    constructor() {
        // Initialize your algorithm
        // 初始化您的算法
    }

    /**
     * Main path planning function
     * @param {number[][]} grid - 2D grid array (0=free, 1=obstacle)
     * @param {Object} start - Start position {x, y}
     * @param {Object} goal - Goal position {x, y}
     * @returns {Object} - {success, path, time, length, steps, algorithm}
     */
    plan(grid, start, goal) {
        const startTime = performance.now();
        
        const rows = grid.length;
        const cols = grid[0].length;
        
        // Your algorithm implementation here
        // 您的算法实现
        
        // Example: Simple straight line
        const path = [[start.x, start.y], [goal.x, goal.y]];
        
        // Calculate path length
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

## 🎓 Advanced Tips | 高级技巧

### 1. Use Performance API | 使用性能 API

```javascript
const startTime = performance.now();
// ... algorithm code ...
const endTime = performance.now();
const executionTime = endTime - startTime;
```

### 2. Optimize Path Length Calculation | 优化路径长度计算

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

### 3. Support Diagonal Movement | 支持对角移动

```javascript
// 8-directional movement
this.dirs = [
    [1, 0],   // right
    [-1, 0],  // left
    [0, 1],   // down
    [0, -1],  // up
    [1, 1],   // diagonal down-right
    [1, -1],  // diagonal up-right
    [-1, 1],  // diagonal down-left
    [-1, -1]  // diagonal up-left
];
```

## 🐛 Troubleshooting | 故障排除

### Common Issues | 常见问题

1. **Algorithm not loading** - Check file extension (.js)
2. **Path not found** - Verify grid format and start/goal positions
3. **Slow performance** - Optimize your algorithm or reduce grid size

### Debug Tips | 调试技巧

```javascript
plan(grid, start, goal) {
    console.log('Grid size:', grid.length, grid[0].length);
    console.log('Start:', start);
    console.log('Goal:', goal);
    
    // Your algorithm
    
    console.log('Path found:', path.length, 'points');
    return result;
}
```

---

<div align="center">

**Happy coding! | 编码愉快！**

**For more information, visit our [GitHub Repository](https://github.com/NingJiangXie/routeflow)**

</div>
