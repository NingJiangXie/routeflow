class RealRRTStar {
    constructor() {
        this.grid = null;
        this.distMap = null;
        this.rows = 0;
        this.cols = 0;
        this.maxIterations = 10000;
        this.stepSize = 0.8;
        this.searchRadius = 2.5;
        this.goalBias = 0.2;
        this.robotRadius = 0.7;
        this.safeThreshold = 2.0;
    }
    
    distance(a, b) {
        return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2);
    }
    
    computeDistMap() {
        const obstacles = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === 1) {
                    obstacles.push([r, c]);
                }
            }
        }
        
        this.distMap = [];
        for (let r = 0; r < this.rows; r++) {
            this.distMap[r] = [];
            for (let c = 0; c < this.cols; c++) {
                let minDist = Infinity;
                for (let k = 0; k < obstacles.length; k++) {
                    const d = Math.sqrt((r - obstacles[k][0])**2 + (c - obstacles[k][1])**2);
                    if (d < minDist) {
                        minDist = d;
                    }
                }
                this.distMap[r][c] = minDist === Infinity ? 100 : minDist;
            }
        }
    }
    
    isInvalidMove(p1, p2) {
        const dist = this.distance(p1, p2);
        
        if (dist < 1e-6) {
            const r = Math.round(p1[0]);
            const c = Math.round(p1[1]);
            if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return true;
            if (this.grid[r][c] === 1) return true;
            if (this.distMap[r][c] <= this.robotRadius) return true;
            return false;
        }
        
        const num = Math.max(1, Math.ceil(dist / 0.5));
        
        for (let i = 0; i <= num; i++) {
            const t = i / num;
            const r = Math.round(p1[0] + (p2[0] - p1[0]) * t);
            const c = Math.round(p1[1] + (p2[1] - p1[1]) * t);
            
            if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) {
                return true;
            }
            
            if (this.grid[r][c] === 1) {
                return true;
            }
            
            if (this.distMap[r][c] <= this.robotRadius) {
                return true;
            }
            
            if (i > 0) {
                const prev_r = Math.round(p1[0] + (p2[0] - p1[0]) * ((i-1) / num));
                const prev_c = Math.round(p1[1] + (p2[1] - p1[1]) * ((i-1) / num));
                
                if (prev_r !== r && prev_c !== c) {
                    if (this.grid[prev_r]?.[c] === 1 || this.grid[r]?.[prev_c] === 1) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    plan(grid, start, goal) {
        const startTime = performance.now();
        
        this.grid = grid;
        this.rows = grid.length;
        this.cols = grid[0].length;
        
        this.computeDistMap();
        
        const s_r = Math.max(0, Math.min(this.rows - 1, Math.round(start.y)));
        const s_c = Math.max(0, Math.min(this.cols - 1, Math.round(start.x)));
        const g_r = Math.max(0, Math.min(this.rows - 1, Math.round(goal.y)));
        const g_c = Math.max(0, Math.min(this.cols - 1, Math.round(goal.x)));
        
        console.log('RRT* Grid:', {rows: this.rows, cols: this.cols});
        console.log('RRT* Start:', {y: start.y, x: start.x, s_r, s_c});
        console.log('RRT* Goal:', {y: goal.y, x: goal.x, g_r, g_c});
        console.log('RRT* Start cell:', this.grid[s_r]?.[s_c], 'Goal cell:', this.grid[g_r]?.[g_c]);
        
        const nodes = [[s_r, s_c, 0, 0]];
        let bestPathIdx = 0;
        let minGoalCost = Infinity;
        
        for (let i = 0; i < this.maxIterations; i++) {
            let rnd;
            if (Math.random() < this.goalBias) {
                rnd = [g_r, g_c];
            } else {
                rnd = [Math.random() * (this.rows - 1), Math.random() * (this.cols - 1)];
            }
            
            let nearestIdx = 0;
            let minDist = Infinity;
            for (let j = 0; j < nodes.length; j++) {
                const dist_sq = (nodes[j][0] - rnd[0])**2 + (nodes[j][1] - rnd[1])**2;
                if (dist_sq < minDist) {
                    minDist = dist_sq;
                    nearestIdx = j;
                }
            }
            
            const nearest = nodes[nearestIdx];
            const diff = [rnd[0] - nearest[0], rnd[1] - nearest[1]];
            const d = Math.sqrt(diff[0]**2 + diff[1]**2);
            
            if (d < 1e-6) continue;
            
            const newPoint = [
                nearest[0] + (diff[0] / d) * Math.min(this.stepSize, d),
                nearest[1] + (diff[1] / d) * Math.min(this.stepSize, d)
            ];
            
            if (newPoint[0] < 0 || newPoint[0] >= this.rows || newPoint[1] < 0 || newPoint[1] >= this.cols ||
                this.isInvalidMove([nearest[0], nearest[1]], [newPoint[0], newPoint[1]])) {
                continue;
            }
            
            const distToObs = this.distMap[Math.round(newPoint[0])][Math.round(newPoint[1])];
            let penalty = 0;
            if (distToObs < this.safeThreshold) {
                penalty = 20.0 * Math.pow(this.safeThreshold - distToObs, 2);
            }
            
            const distToNew = nodes.map(n => (n[0]-newPoint[0])**2 + (n[1]-newPoint[1])**2);
            const nearIndices = distToNew
                .map((d_sq, idx) => d_sq <= this.searchRadius * this.searchRadius ? idx : -1)
                .filter(idx => idx !== -1);
            
            let currMinCost = nodes[nearestIdx][2] + this.distance([nearest[0], nearest[1]], [newPoint[0], newPoint[1]]) + penalty;
            let currBestP = nearestIdx;
            
            for (let j = 0; j < nearIndices.length; j++) {
                const idx = nearIndices[j];
                if (!this.isInvalidMove([nodes[idx][0], nodes[idx][1]], [newPoint[0], newPoint[1]])) {
                    const c = nodes[idx][2] + this.distance([nodes[idx][0], nodes[idx][1]], [newPoint[0], newPoint[1]]) + penalty;
                    if (c < currMinCost) {
                        currMinCost = c;
                        currBestP = idx;
                    }
                }
            }
            
            nodes.push([newPoint[0], newPoint[1], currMinCost, currBestP]);
            const newIdx = nodes.length - 1;
            
            for (let j = 0; j < nearIndices.length; j++) {
                const idx = nearIndices[j];
                if (idx === currBestP) continue;
                
                const nDist = this.distMap[Math.round(nodes[idx][0])][Math.round(nodes[idx][1])];
                let nPenalty = 0;
                if (nDist < this.safeThreshold) {
                    nPenalty = 20.0 * Math.pow(this.safeThreshold - nDist, 2);
                }
                
                const newCost = nodes[newIdx][2] + this.distance([newPoint[0], newPoint[1]], [nodes[idx][0], nodes[idx][1]]) + nPenalty;
                if (newCost < nodes[idx][2]) {
                    if (!this.isInvalidMove([newPoint[0], newPoint[1]], [nodes[idx][0], nodes[idx][1]])) {
                        nodes[idx][2] = newCost;
                        nodes[idx][3] = newIdx;
                    }
                }
            }
            
            if (this.distance(newPoint, [g_r, g_c]) < this.stepSize * 2) {
                if (!this.isInvalidMove([newPoint[0], newPoint[1]], [g_r, g_c])) {
                    const totalC = nodes[newIdx][2] + this.distance(newPoint, [g_r, g_c]);
                    if (totalC < minGoalCost) {
                        minGoalCost = totalC;
                        bestPathIdx = newIdx;
                    }
                }
            }
        }
        
        const endTime = performance.now();
        
        let path = [];
        if (bestPathIdx > 0) {
            // 从 bestPathIdx 回溯到起点
            const reversePath = [];
            let curr = bestPathIdx;
            let count = 0;
            
            while (curr !== 0 && count < 10000) {
                count++;
                reversePath.push([Math.round(nodes[curr][0]), Math.round(nodes[curr][1])]);
                curr = nodes[curr][3];
            }
            
            // 加入起点
            reversePath.push([s_r, s_c]);
            
            // 反转得到从起点到终点的路径
            path = reversePath.reverse();
            
            // 添加终点
            path.push([g_r, g_c]);
            
            console.log('RRT* Path nodes:', path.length, 'First:', path[0], 'Last:', path[path.length-1]);
        } else {
            console.log('RRT* No path found, bestPathIdx:', bestPathIdx);
        }
        
        return {
            success: path.length > 0,
            path: path,
            time: endTime - startTime,
            length: minGoalCost === Infinity ? 0 : minGoalCost,
            steps: path.length,
            algorithm: 'RRT*'
        };
    }
}
