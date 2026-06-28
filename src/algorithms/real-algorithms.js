/**
 * Real Path Planning Algorithms
 * Based on MATLAB implementations provided by user
 * Converted to JavaScript for web interface
 */

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
    }
    
    heuristic(a, b) {
        return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
    }
    
    calculateKey(s, km) {
        const gVal = this.g[s[0]][s[1]];
        const rhsVal = this.rhs[s[0]][s[1]];
        return [
            Math.min(gVal, rhsVal) + this.heuristic(this.lastStart, s) + km,
            Math.min(gVal, rhsVal)
        ];
    }
    
    updateNode(u) {
        const [r, c] = u;
        if (r !== this.goal[0] || c !== this.goal[1]) {
            this.rhs[r][c] = Infinity;
            const dirs = [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]];
            
            for (let i = 0; i < dirs.length; i++) {
                const v = [r + dirs[i][0], c + dirs[i][1]];
                if (v[0] >= 0 && v[0] < this.rows && v[1] >= 0 && v[1] < this.cols) {
                    if (!this.grid[v[0]][v[1]]) {
                        // 对角线移动需要检查中间格子
                        if (Math.abs(dirs[i][0]) + Math.abs(dirs[i][1]) === 2) {
                            if (this.grid[r][v[1]] || this.grid[v[0]][c]) continue;
                        }
                        
                        const moveCost = Math.sqrt(dirs[i][0]**2 + dirs[i][1]**2);
                        this.rhs[r][c] = Math.min(this.rhs[r][c], moveCost + this.g[v[0]][v[1]]);
                    }
                }
            }
        }
        
        // 从open列表中移除
        this.open = this.open.filter(node => !(node[0] === r && node[1] === c));
        
        if (Math.abs(this.g[r][c] - this.rhs[r][c]) > 1e-5) {
            this.open.push([...u, ...this.calculateKey(u, this.km)]);
            this.open.sort((a, b) => a[2] - b[2] || a[3] - b[3]);
        }
    }
    
    computeShortestPath() {
        let iterations = 0;
        const maxIterations = 10000;
        
        while (this.open.length > 0 && iterations < maxIterations) {
            iterations++;
            
            const [r, c, k1, k2] = this.open.shift();
            const u = [r, c];
            
            const newKey = this.calculateKey(u, this.km);
            
            if (k1 > newKey[0] || (Math.abs(k1 - newKey[0]) < 1e-4 && k2 > newKey[1])) {
                this.open.unshift([...u, ...newKey]);
                this.open.sort((a, b) => a[2] - b[2] || a[3] - b[3]);
            } else if (this.g[r][c] > this.rhs[r][c]) {
                this.g[r][c] = this.rhs[r][c];
                const dirs = [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]];
                for (let i = 0; i < dirs.length; i++) {
                    const v = [r + dirs[i][0], c + dirs[i][1]];
                    if (v[0] >= 0 && v[0] < this.rows && v[1] >= 0 && v[1] < this.cols) {
                        if (!this.grid[v[0]][v[1]]) {
                            this.updateNode(v);
                        }
                    }
                }
            } else {
                this.g[r][c] = Infinity;
                this.updateNode(u);
                const dirs = [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]];
                for (let i = 0; i < dirs.length; i++) {
                    const v = [r + dirs[i][0], c + dirs[i][1]];
                    if (v[0] >= 0 && v[0] < this.rows && v[1] >= 0 && v[1] < this.cols) {
                        if (!this.grid[v[0]][v[1]]) {
                            this.updateNode(v);
                        }
                    }
                }
            }
            
            // 检查是否到达起点
            if (r === this.lastStart[0] && c === this.lastStart[1]) {
                const startKey = this.calculateKey(this.lastStart, this.km);
                if (Math.abs(this.g[r][c] - this.rhs[r][c]) < 1e-4) {
                    break;
                }
            }
        }
    }
    
    extractPath(s_start, s_goal) {
        const path = [[s_start[0], s_start[1]]];
        let current = [s_start[0], s_start[1]];
        
        while (!(current[0] === s_goal[0] && current[1] === s_goal[1])) {
            if (this.g[current[0]][current[1]] === Infinity) {
                return [];
            }
            
            let bestNext = null;
            let bestCost = Infinity;
            
            const dirs = [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]];
            for (let i = 0; i < dirs.length; i++) {
                const v = [current[0] + dirs[i][0], current[1] + dirs[i][1]];
                if (v[0] >= 0 && v[0] < this.rows && v[1] >= 0 && v[1] < this.cols) {
                    if (!this.grid[v[0]][v[1]]) {
                        const moveCost = Math.sqrt(dirs[i][0]**2 + dirs[i][1]**2);
                        const cost = this.g[v[0]][v[1]] + moveCost;
                        if (cost < bestCost) {
                            bestCost = cost;
                            bestNext = v;
                        }
                    }
                }
            }
            
            if (!bestNext) break;
            path.push(bestNext);
            current = bestNext;
        }
        
        return path;
    }
    
    plan(grid, start, goal) {
        const startTime = performance.now();
        
        this.grid = grid;
        this.rows = grid.length;
        this.cols = grid[0].length;
        
        const s_start = [Math.round(start.y), Math.round(start.x)];
        const s_goal = [Math.round(goal.y), Math.round(goal.x)];
        
        // 初始化
        this.g = Array(this.rows).fill().map(() => Array(this.cols).fill(Infinity));
        this.rhs = Array(this.rows).fill().map(() => Array(this.cols).fill(Infinity));
        this.rhs[s_goal[0]][s_goal[1]] = 0;
        this.km = 0;
        this.lastStart = s_start;
        this.goal = s_goal;
        
        // 初始化open列表
        this.open = [[...s_goal, ...this.calculateKey(s_goal, 0)]];
        
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
                algorithm: 'D* Lite (Real)'
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
            algorithm: 'D* Lite (Real)'
        };
    }
}


class RealRRTStar {
    constructor() {
        this.grid = null;
        this.rows = 0;
        this.cols = 0;
        this.maxIterations = 1000;
        this.stepSize = 2.0;
        this.searchRadius = 3.0;
        this.goalBias = 0.1;
        this.robotRadius = 0.7;
    }
    
    isInvalidMove(a, b) {
        const dr = b[0] - a[0];
        const dc = b[1] - a[1];
        const dist = Math.sqrt(dr*dr + dc*dc);
        const steps = Math.max(Math.floor(dist), 1);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const r = Math.round(a[0] + t * dr);
            const c = Math.round(a[1] + t * dc);
            
            if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) {
                return true;
            }
            if (this.grid[r][c] === 1) {
                return true;
            }
        }
        
        return false;
    }
    
    distance(a, b) {
        return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2);
    }
    
    plan(grid, start, goal) {
        const startTime = performance.now();
        
        this.grid = grid;
        this.rows = grid.length;
        this.cols = grid[0].length;
        
        const s_start = [Math.max(0, Math.min(this.rows-1, Math.round(start.y))), 
                         Math.max(0, Math.min(this.cols-1, Math.round(start.x)))];
        const s_goal = [Math.max(0, Math.min(this.rows-1, Math.round(goal.y))), 
                       Math.max(0, Math.min(this.cols-1, Math.round(goal.x)))];
        
        const nodes = [[s_start[0], s_start[1], 0, -1]]; // [row, col, cost, parent]
        let bestGoalIdx = -1;
        let minGoalCost = Infinity;
        
        for (let i = 0; i < this.maxIterations; i++) {
            // 随机采样
            let rnd;
            if (Math.random() < this.goalBias) {
                rnd = s_goal;
            } else {
                rnd = [1 + Math.random() * (this.rows - 2), 
                       1 + Math.random() * (this.cols - 2)];
            }
            
            // 找最近节点
            let nearestIdx = 0;
            let minDist = Infinity;
            for (let j = 0; j < nodes.length; j++) {
                const dist = this.distance(nodes[j], rnd);
                if (dist < minDist) {
                    minDist = dist;
                    nearestIdx = j;
                }
            }
            
            // 生成新节点
            const nearest = nodes[nearestIdx];
            const diff = [rnd[0] - nearest[0], rnd[1] - nearest[1]];
            const d = Math.sqrt(diff[0]**2 + diff[1]**2);
            
            if (d < 1e-6) continue;
            
            const newPoint = [
                nearest[0] + (diff[0] / d) * Math.min(this.stepSize, d),
                nearest[1] + (diff[1] / d) * Math.min(this.stepSize, d)
            ];
            
            // 检查碰撞
            if (this.isInvalidMove(nearest, newPoint)) {
                continue;
            }
            
            // 重连过程
            const distToNew = nodes.map(n => this.distance(n, newPoint));
            const nearIndices = distToNew
                .map((d, i) => d <= this.searchRadius ? i : -1)
                .filter(i => i !== -1);
            
            let minCost = nodes[nearestIdx][2] + this.distance(nearest, newPoint);
            let bestParent = nearestIdx;
            
            for (const idx of nearIndices) {
                if (!this.isInvalidMove(nodes[idx], newPoint)) {
                    const cost = nodes[idx][2] + this.distance(nodes[idx], newPoint);
                    if (cost < minCost) {
                        minCost = cost;
                        bestParent = idx;
                    }
                }
            }
            
            const newIdx = nodes.length;
            nodes.push([newPoint[0], newPoint[1], minCost, bestParent]);
            
            // 重连
            for (const idx of nearIndices) {
                if (idx === bestParent) continue;
                if (!this.isInvalidMove(newPoint, nodes[idx])) {
                    const newCost = nodes[newIdx][2] + this.distance(nodes[idx], newPoint);
                    if (newCost < nodes[idx][2]) {
                        nodes[idx][2] = newCost;
                        nodes[idx][3] = newIdx;
                    }
                }
            }
            
            // 检查是否到达目标
            const distToGoal = this.distance(newPoint, s_goal);
            if (distToGoal < 1.5) {
                if (!this.isInvalidMove(newPoint, s_goal)) {
                    const goalCost = nodes[newIdx][2] + distToGoal;
                    if (goalCost < minGoalCost) {
                        minGoalCost = goalCost;
                        bestGoalIdx = newIdx;
                    }
                }
            }
        }
        
        const endTime = performance.now();
        
        if (bestGoalIdx === -1) {
            return {
                success: false,
                path: [],
                time: endTime - startTime,
                length: 0,
                steps: 0,
                algorithm: 'RRT* (Real)'
            };
        }
        
        // 重建路径
        const path = [];
        let currentIdx = bestGoalIdx;
        while (currentIdx !== -1) {
            path.unshift([Math.round(nodes[currentIdx][0]), Math.round(nodes[currentIdx][1])]);
            currentIdx = nodes[currentIdx][3];
        }
        path[path.length - 1] = [s_goal[0], s_goal[1]];
        
        return {
            success: true,
            path: path,
            time: endTime - startTime,
            length: minGoalCost,
            steps: path.length,
            algorithm: 'RRT* (Real)'
        };
    }
}


class RealACO {
    constructor() {
        this.grid = null;
        this.rows = 0;
        this.cols = 0;
        this.nAnts = 30;
        this.maxIterations = 100;
        this.alpha = 1.0;
        this.beta = 5.0;
        this.rho = 0.1;
        this.Q = 100;
    }
    
    heuristic(a, b) {
        return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
    }
    
    plan(grid, start, goal) {
        const startTime = performance.now();
        
        this.grid = grid;
        this.rows = grid.length;
        this.cols = grid[0].length;
        
        const s_start = [start.y, start.x];
        const s_goal = [goal.y, goal.x];
        
        // 初始化信息素
        let pheromone = Array(this.rows).fill().map(() => 
            Array(this.cols).fill(1.0)
        );
        
        let bestPath = [];
        let bestLength = Infinity;
        
        for (let iteration = 0; iteration < this.maxIterations; iteration++) {
            const allPaths = [];
            
            // 每只蚂蚁
            for (let ant = 0; ant < this.nAnts; ant++) {
                const path = [[...s_start]];
                let current = [...s_start];
                const visited = new Set([`${current[0]},${current[1]}`]);
                
                let iterations = 0;
                const maxIter = 500;
                
                while (!(current[0] === s_goal[0] && current[1] === s_goal[1]) && iterations < maxIter) {
                    iterations++;
                    
                    // 获取邻居
                    const neighbors = [];
                    const dirs = [[0,-1], [0,1], [-1,0], [1,0]];
                    
                    for (const [dr, dc] of dirs) {
                        const nr = current[0] + dr;
                        const nc = current[1] + dc;
                        
                        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                            if (!this.grid[nr][nc] && !visited.has(`${nr},${nc}`)) {
                                neighbors.push([nr, nc]);
                            }
                        }
                    }
                    
                    if (neighbors.length === 0) break;
                    
                    // 计算概率
                    let totalProb = 0;
                    const probs = neighbors.map(n => {
                        const pheromoneLevel = pheromone[n[0]][n[1]];
                        const distance = this.heuristic(n, s_goal);
                        const prob = Math.pow(pheromoneLevel, this.alpha) * 
                                   Math.pow(1 / (distance + 0.1), this.beta);
                        totalProb += prob;
                        return prob;
                    });
                    
                    // 选择下一个
                    let next;
                    const rand = Math.random() * totalProb;
                    let cumProb = 0;
                    
                    for (let i = 0; i < neighbors.length; i++) {
                        cumProb += probs[i];
                        if (rand <= cumProb) {
                            next = neighbors[i];
                            break;
                        }
                    }
                    
                    if (!next) next = neighbors[0];
                    
                    path.push(next);
                    visited.add(`${next[0]},${next[1]}`);
                    current = next;
                }
                
                if (current[0] === s_goal[0] && current[1] === s_goal[1]) {
                    allPaths.push(path);
                    
                    // 计算路径长度
                    let length = 0;
                    for (let i = 0; i < path.length - 1; i++) {
                        length += this.heuristic(path[i], path[i+1]);
                    }
                    
                    if (length < bestLength) {
                        bestLength = length;
                        bestPath = path;
                    }
                }
            }
            
            // 更新信息素
            pheromone = pheromone.map(row => 
                row.map(val => val * (1 - this.rho))
            );
            
            // 添加信息素
            for (const path of allPaths) {
                for (const node of path) {
                    pheromone[node[0]][node[1]] += this.Q / path.length;
                }
            }
        }
        
        const endTime = performance.now();
        
        if (bestPath.length === 0) {
            return {
                success: false,
                path: [],
                time: endTime - startTime,
                length: 0,
                steps: 0,
                algorithm: 'ACO (Real)'
            };
        }
        
        return {
            success: true,
            path: bestPath,
            time: endTime - startTime,
            length: bestLength,
            steps: bestPath.length,
            algorithm: 'ACO (Real)'
        };
    }
}


// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RealDStarLite, RealRRTStar, RealACO };
}
