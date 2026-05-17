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
    
    isDiagonal(dr, dc) {
        return Math.abs(dr) + Math.abs(dc) === 2;
    }
    
    canMove(from, to, dr, dc) {
        if (!this.isValid(to[0], to[1])) return false;
        if (this.isDiagonal(dr, dc)) {
            return this.isValid(from[0] + dr, from[1]) || this.isValid(from[0], from[1] + dc);
        }
        return true;
    }
    
    updateNode(u) {
        const [r, c] = u;
        if (r !== this.goal[0] || c !== this.goal[1]) {
            this.rhs[r][c] = Infinity;
            for (const [dr, dc] of this.dirs) {
                const v = [r + dr, c + dc];
                if (this.canMove([r, c], v, dr, dc)) {
                    const moveCost = Math.sqrt(dr*dr + dc*dc);
                    this.rhs[r][c] = Math.min(this.rhs[r][c], moveCost + this.g[v[0]][v[1]]);
                }
            }
        }
        
        this.open = this.open.filter(node => !(node[0] === r && node[1] === c));
        
        if (Math.abs(this.g[r][c] - this.rhs[r][c]) > 1e-5) {
            this.open.push([...u, ...this.calculateKey(u)]);
            this.open.sort((a, b) => a[2] - b[2] || a[3] - b[3]);
        }
    }
    
    computeShortestPath() {
        let iterations = 0;
        const maxIterations = this.rows * this.cols * 2;
        
        while (this.open.length > 0 && iterations < maxIterations) {
            iterations++;
            
            const [r, c, k1, k2] = this.open.shift();
            const u = [r, c];
            const newKey = this.calculateKey(u);
            
            if (k1 > newKey[0] || (Math.abs(k1 - newKey[0]) < 1e-4 && k2 > newKey[1])) {
                this.open.unshift([...u, ...newKey]);
                this.open.sort((a, b) => a[2] - b[2] || a[3] - b[3]);
            } else if (this.g[r][c] > this.rhs[r][c]) {
                this.g[r][c] = this.rhs[r][c];
                for (const [dr, dc] of this.dirs) {
                    const v = [r + dr, c + dc];
                    if (this.canMove([r, c], v, dr, dc)) {
                        this.updateNode(v);
                    }
                }
            } else {
                this.g[r][c] = Infinity;
                this.updateNode(u);
                for (const [dr, dc] of this.dirs) {
                    const v = [r + dr, c + dc];
                    if (this.canMove([r, c], v, dr, dc)) {
                        this.updateNode(v);
                    }
                }
            }
            
            if (r === this.lastStart[0] && c === this.lastStart[1] && Math.abs(this.g[r][c] - this.rhs[r][c]) < 1e-4) {
                break;
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
            
            for (const [dr, dc] of this.dirs) {
                const v = [current[0] + dr, current[1] + dc];
                if (this.canMove(current, v, dr, dc)) {
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
        
        if (path.length === 0) {
            return { success: false, path: [], time: endTime - startTime, length: 0, steps: 0, algorithm: 'D* Lite' };
        }
        
        let length = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const dx = path[i+1][0] - path[i][0];
            const dy = path[i+1][1] - path[i][1];
            length += Math.sqrt(dx*dx + dy*dy);
        }
        
        return { success: true, path: path, time: endTime - startTime, length: length, steps: path.length, algorithm: 'D* Lite' };
    }
}
