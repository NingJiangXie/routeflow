# RouteFlow 算法格式指南

<div align="center">

[English](ALGORITHM_FORMAT.md) | **简体中文**

*导入自定义算法到 RouteFlow 的完整指南*

</div>

## 📋 概述

RouteFlow 允许您导入自定义路径规划算法。本指南详细说明了所需的格式并提供完整的示例。

## 🎯 算法要求

### 1. 文件格式

- **文件扩展名**：`.js`（JavaScript）或 `.py`（Python）
- **编码格式**：UTF-8
- **内容类型**：必须是有效的类定义

### 2. JavaScript 类结构

您的算法必须是一个 JavaScript 类，具有以下结构：

```javascript
class YourAlgorithmName {
    constructor() {
        // 在这里初始化您的算法
    }

    // 必需：主规划函数
    plan(grid, start, goal) {
        /*
         * @param grid - 2D 数组，0 = 空闲，1 = 障碍物
         * @param start - 起点位置 {x, y}
         * @param goal - 终点位置 {x, y}
         * @returns 包含路径和统计数据的对象
         */
        
        // 您的算法实现

        return {
            success: true,           // 是否找到路径
            path: [[x, y], ...],   // [x, y] 坐标数组
            time: 0.0,             // 执行时间（毫秒）
            length: 0.0,           // 路径总长度
            steps: 0,              // 路径段数
            algorithm: '算法名称'  // 算法名称
        };
    }
}
```

### 3. 完整示例：D* Lite 算法

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
        // 8 个方向：上、下、左、右 + 4 个对角方向
        this.dirs = [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]];
    }
    
    // 启发函数（曼哈顿距离）
    heuristic(a, b) {
        return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
    }
    
    // 计算节点键值
    calculateKey(s) {
        const gVal = this.g[s[0]][s[1]];
        const rhsVal = this.rhs[s[0]][s[1]];
        return [Math.min(gVal, rhsVal) + this.heuristic(this.lastStart, s) + this.km, Math.min(gVal, rhsVal)];
    }
    
    // 检查坐标是否有效
    isValid(r, c) {
        return r >= 0 && r < this.rows && c >= 0 && c < this.cols && !this.grid[r][c];
    }
    
    // 主规划函数
    plan(grid, start, goal) {
        const startTime = performance.now();
        
        this.grid = grid;
        this.rows = grid.length;
        this.cols = grid[0].length;
        
        // 转换坐标格式
        const s_start = [Math.round(start.y), Math.round(start.x)];
        const s_goal = [Math.round(goal.y), Math.round(goal.x)];
        
        // 初始化 g 和 rhs 值
        this.g = Array(this.rows).fill().map(() => Array(this.cols).fill(Infinity));
        this.rhs = Array(this.rows).fill().map(() => Array(this.cols).fill(Infinity));
        this.rhs[s_goal[0]][s_goal[1]] = 0;
        this.km = 0;
        this.lastStart = s_start;
        this.goal = s_goal;
        
        // 初始化优先级队列
        this.open = [[...s_goal, ...this.calculateKey(s_goal)]];
        
        // 计算最短路径
        this.computeShortestPath();
        
        // 提取路径
        const path = this.extractPath(s_start, s_goal);
        const endTime = performance.now();
        
        if (path.length === 0) {
            return { 
                success: false, 
                path: [], 
                time: endTime - startTime, 
                length: 0, 
                steps: 0, 
                algorithm: 'D* Lite' 
            };
        }
        
        // 计算路径长度
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
    
    // 计算最短路径（D* Lite 核心算法）
    computeShortestPath() {
        let iterations = 0;
        const maxIterations = this.rows * this.cols * 2;
        
        while (this.open.length > 0 && iterations < maxIterations) {
            iterations++;
            const [r, c, k1, k2] = this.open.shift();
            const u = [r, c];
            const newKey = this.calculateKey(u);
            
            // ... 完整算法实现 ...
        }
    }
    
    // 提取路径
    extractPath(s_start, s_goal) {
        const path = [[s_start[0], s_start[1]]];
        let current = [s_start[0], s_start[1]];
        
        while (!(current[0] === s_goal[0] && current[1] === s_goal[1])) {
            if (this.g[current[0]][current[1]] === Infinity) {
                return [];
            }
            
            let bestNext = null;
            let bestCost = Infinity;
            
            for (const [dr, dc] of this.dirs) {
                const v = [current[0] + dr, current[1] + dc];
                if (this.isValid(v[0], v[1])) {
                    const moveCost = Math.sqrt(dr*dr + dc*dc);
                    const cost = this.g[v[0]][v[1]] + moveCost;
                    if (cost < bestCost) {
                        bestCost = cost;
                        bestNext = v;
                    }
                }
            }
            
            if (!bestNext) break;
            path.push(bestNext);
            current = bestNext;
        }
        
        return path;
    }
}
```

## 📊 网格格式

### 网格结构

```javascript
// 2D 网格数组
grid = [
    [0, 0, 0, 1, 0],  // 第 0 行
    [0, 1, 0, 1, 0],  // 第 1 行
    [0, 1, 0, 0, 0],  // 第 2 行
    [0, 0, 0, 1, 0],  // 第 3 行
    [0, 0, 0, 0, 0]   // 第 4 行
];

// 访问方式：grid[y][x]
// 值 0 = 空闲单元格
// 值 1 = 障碍物
```

### 起点和终点位置

```javascript
start = { x: 0, y: 0 };  // 左上角
goal = { x: 4, y: 4 };   // 右下角

// 注意：x = 列索引，y = 行索引
```

## 🔧 导入步骤

### 步骤 1：准备您的算法

1. 使用 JavaScript 编写算法
2. 确保符合要求的类结构
3. 尽可能在本地测试

### 步骤 2：导入到 RouteFlow

1. 点击 **算法管理** 按钮（⚙️）
2. 点击 **导入算法文件**
3. 选择您的 `.js` 文件
4. 算法将显示在列表中

### 步骤 3：使用您的算法

1. 从下拉菜单中选择导入的算法
2. 点击"生成"创建地图
3. 点击"规划"运行算法
4. 在可视化区域查看结果

## ⚠️ 重要说明

### 网格坐标系

- **X 轴**：水平方向（列索引）
- **Y 轴**：垂直方向（行索引）
- **原点**：左上角 (0, 0)

### 路径格式

```javascript
// 路径是 [x, y] 坐标数组
path = [
    [0, 0],    // 起点
    [1, 0],    // 向右移动
    [2, 1],    // 向右下移动
    [3, 2],    // 向右下移动
    [4, 4]     // 终点
];
```

### 返回值

| 字段 | 类型 | 描述 |
|-------|------|------|
| `success` | Boolean | 是否找到路径 |
| `path` | Array | [x, y] 坐标数组 |
| `time` | Number | 执行时间（毫秒） |
| `length` | Number | 路径总长度 |
| `steps` | Number | 路径段数 |
| `algorithm` | String | 显示的算法名称 |

### 错误处理

```javascript
plan(grid, start, goal) {
    try {
        // 您的算法
        return {
            success: true,
            path: calculatedPath,
            // ... 其他字段
        };
    } catch (error) {
        return {
            success: false,
            path: [],
            time: 0,
            length: 0,
            steps: 0,
            algorithm: '您的算法'
        };
    }
}
```

## 📝 算法模板

```javascript
class MyCustomAlgorithm {
    constructor() {
        // 初始化您的算法
    }

    /**
     * 主路径规划函数
     * @param {number[][]} grid - 2D 网格数组 (0=空闲, 1=障碍物)
     * @param {Object} start - 起点位置 {x, y}
     * @param {Object} goal - 终点位置 {x, y}
     * @returns {Object} - {success, path, time, length, steps, algorithm}
     */
    plan(grid, start, goal) {
        const startTime = performance.now();
        
        const rows = grid.length;
        const cols = grid[0].length;
        
        // 在这里实现您的算法
        
        // 示例：简单的直线（需要替换为真实算法）
        const path = [[start.x, start.y], [goal.x, goal.y]];
        
        // 计算路径长度
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
            algorithm: '我的自定义算法'
        };
    }
}
```

## 🎓 高级技巧

### 1. 使用 Performance API

```javascript
const startTime = performance.now();
// ... 算法代码 ...
const endTime = performance.now();
const executionTime = endTime - startTime;
```

### 2. 优化路径长度计算

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

### 3. 支持对角移动

```javascript
// 8 方向移动
this.dirs = [
    [1, 0],   // 右
    [-1, 0],  // 左
    [0, 1],   // 下
    [0, -1],  // 上
    [1, 1],   // 右下对角
    [1, -1],  // 右上对角
    [-1, 1],  // 左下对角
    [-1, -1]  // 左上对角
];
```

## 🐛 故障排除

### 常见问题

1. **算法无法加载** - 检查文件扩展名（必须是 .js）
2. **未找到路径** - 验证网格格式和起点/终点位置
3. **性能缓慢** - 优化算法或减小网格大小

### 调试技巧

```javascript
plan(grid, start, goal) {
    console.log('网格大小:', grid.length, grid[0].length);
    console.log('起点:', start);
    console.log('终点:', goal);
    
    // 您的算法
    
    console.log('找到路径:', path.length, '个点');
    return result;
}
```

## 📂 相关文件

- [ALGORITHM_FORMAT.md](ALGORITHM_FORMAT.md) - 英文版算法格式指南
- [README.md](README.md) - 项目主说明文档
- [docs/](docs/) - 更多文档

---

<div align="center">

**编码愉快！**

**更多信息请访问我们的 [GitHub 仓库](https://github.com/your-username/routeflow)**

</div>
