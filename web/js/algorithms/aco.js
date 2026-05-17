class RealACO {
    constructor() {
        this.grid = null;
        this.rows = 0;
        this.cols = 0;
        this.nAnts = 25;
        this.maxIterations = 80;
        this.alpha = 1.0;
        this.beta = 5.0;
        this.rho = 0.1;
        this.Q = 100;
        this.dirs4 = [[0,-1], [0,1], [-1,0], [1,0]];
        this.dirs8 = [[0,-1], [0,1], [-1,0], [1,0], [-1,-1], [-1,1], [1,-1], [1,1]];
    }
    
    heuristic(a, b) {
        return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2);
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
        
        const pheromone = Array(this.rows).fill().map(() => Array(this.cols).fill(1.0));
        
        let bestPath = [];
        let bestLength = Infinity;
        
        for (let iteration = 0; iteration < this.maxIterations; iteration++) {
            const allPaths = [];
            
            for (let ant = 0; ant < this.nAnts; ant++) {
                const path = [[...s_start]];
                let current = [...s_start];
                const visited = new Set([`${current[0]},${current[1]}`]);
                
                for (let iters = 0; iters < 500; iters++) {
                    if (current[0] === s_goal[0] && current[1] === s_goal[1]) break;
                    
                    const neighbors = [];
                    for (const [dr, dc] of this.dirs4) {
                        const nr = current[0] + dr;
                        const nc = current[1] + dc;
                        if (this.isValid(nr, nc) && !visited.has(`${nr},${nc}`)) {
                            neighbors.push([nr, nc]);
                        }
                    }
                    
                    if (neighbors.length === 0) break;
                    
                    let totalProb = 0;
                    const probs = neighbors.map(n => {
                        const pheromoneLevel = pheromone[n[0]][n[1]];
                        const distance = this.heuristic(n, s_goal);
                        const prob = Math.pow(pheromoneLevel, this.alpha) * Math.pow(1 / (distance + 0.1), this.beta);
                        totalProb += prob;
                        return prob;
                    });
                    
                    let next = neighbors[0];
                    const rand = Math.random() * totalProb;
                    let cumProb = 0;
                    
                    for (let i = 0; i < neighbors.length; i++) {
                        cumProb += probs[i];
                        if (rand <= cumProb) {
                            next = neighbors[i];
                            break;
                        }
                    }
                    
                    path.push(next);
                    visited.add(`${next[0]},${next[1]}`);
                    current = next;
                }
                
                if (current[0] === s_goal[0] && current[1] === s_goal[1]) {
                    allPaths.push(path);
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
            
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    pheromone[r][c] *= (1 - this.rho);
                }
            }
            
            for (const path of allPaths) {
                for (const node of path) {
                    pheromone[node[0]][node[1]] += this.Q / path.length;
                }
            }
        }
        
        const endTime = performance.now();
        
        if (bestPath.length === 0) {
            return { success: false, path: [], time: endTime - startTime, length: 0, steps: 0, algorithm: 'ACO' };
        }
        
        return { success: true, path: bestPath, time: endTime - startTime, length: bestLength, steps: bestPath.length, algorithm: 'ACO' };
    }
}
