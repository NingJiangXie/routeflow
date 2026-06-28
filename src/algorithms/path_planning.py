"""
Python Path Planning Algorithms - Optimized Version
D* Lite, RRT*, ACO - all implemented in Python
"""

import numpy as np
import math
import random
from typing import List, Tuple, Callable, Optional, Dict, Any
from dataclasses import dataclass
from heapq import heappush, heappop
import time
from abc import ABC, abstractmethod


@dataclass
class PlanningResult:
    """Path planning result"""
    success: bool
    path: List[Tuple[int, int]]
    time: float
    length: float
    steps: int
    algorithm: str


class BaseAlgorithm(ABC):
    """Base class for all path planning algorithms"""
    
    def __init__(self, grid_map: np.ndarray = None):
        self.grid = grid_map
        if grid_map is not None:
            self.rows, self.cols = grid_map.shape
        self._parameters = {}
    
    @abstractmethod
    def plan(self, grid_map: np.ndarray, start: Tuple[int, int], 
             goal: Tuple[int, int]) -> PlanningResult:
        """Plan a path from start to goal"""
        pass
    
    def get_parameters(self) -> Dict[str, Any]:
        """Get algorithm parameters"""
        return self._parameters.copy()
    
    def set_parameters(self, **kwargs):
        """Set algorithm parameters"""
        self._parameters.update(kwargs)


class DStarLite(BaseAlgorithm):
    """D* Lite path planning algorithm"""
    
    def __init__(self, grid_map: np.ndarray = None):
        super().__init__(grid_map)
        self.g = None
        self.rhs = None
        self.open = []
        self.km = 0
        self.last_start = None
        self.goal = None
        self._parameters = {
            "allow_diagonal": True
        }
    
    def heuristic(self, a: Tuple[int, int], b: Tuple[int, int]) -> float:
        return math.hypot(a[0] - b[0], a[1] - b[1])
    
    def key(self, s: Tuple[int, int]) -> Tuple[float, float]:
        k1 = min(self.g[s], self.rhs[s]) + self.heuristic(self.last_start, s) + self.km
        k2 = min(self.g[s], self.rhs[s])
        return (k1, k2)
    
    def update_vertex(self, u: Tuple[int, int]):
        if (u[0], u[1]) != (self.goal[0], self.goal[1]):
            self.rhs[u] = min(self.g[v] + self.cost(u, v) for v in self.neighbors(u))
        
        self.open = [item for item in self.open if item[1] != u]
        if self.g[u] != self.rhs[u]:
            heappush(self.open, (self.key(u), u))
    
    def cost(self, u: Tuple[int, int], v: Tuple[int, int]) -> float:
        if self.grid[v[0], v[1]] == 1:
            return np.inf
        if self._parameters.get("allow_diagonal", True):
            return 1.414 if u[0] != v[0] and u[1] != v[1] else 1.0
        else:
            return 1.0
    
    def neighbors(self, u: Tuple[int, int]) -> List[Tuple[int, int]]:
        neighbors = []
        if self._parameters.get("allow_diagonal", True):
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
                nr, nc = u[0] + dr, u[1] + dc
                if 0 <= nr < self.rows and 0 <= nc < self.cols:
                    neighbors.append((nr, nc))
        else:
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = u[0] + dr, u[1] + dc
                if 0 <= nr < self.rows and 0 <= nc < self.cols:
                    neighbors.append((nr, nc))
        return neighbors
    
    def compute_shortest_path(self):
        while self.open:
            k_old, u = heappop(self.open)
            k_new = self.key(u)
            
            if k_old < k_new:
                heappush(self.open, (k_new, u))
            elif self.g[u] > self.rhs[u]:
                self.g[u] = self.rhs[u]
                for s in self.neighbors(u):
                    self.update_vertex(s)
            else:
                self.g[u] = np.inf
                for s in self.neighbors(u) + [u]:
                    self.update_vertex(s)
                    
            if len(self.open) > 100000:
                break
    
    def plan(self, grid_map: np.ndarray, start: Tuple[int, int], goal: Tuple[int, int]) -> PlanningResult:
        start_time = time.time()
        
        self.grid = grid_map
        self.rows, self.cols = grid_map.shape
        self.goal = goal
        self.last_start = start
        
        self.g = np.full((self.rows, self.cols), np.inf)
        self.rhs = np.full((self.rows, self.cols), np.inf)
        self.rhs[goal] = 0
        self.open = []
        heappush(self.open, (self.key(goal), goal))
        
        self.compute_shortest_path()
        
        if self.g[start] == np.inf:
            return PlanningResult(False, [], time.time()-start_time, 0, 0, "D* Lite")
        
        path = []
        current = start
        while current != goal:
            path.append(current)
            
            best_next = None
            best_cost = np.inf
            for v in self.neighbors(current):
                c = self.g[v] + self.cost(current, v)
                if c < best_cost:
                    best_cost = c
                    best_next = v
                    
            if best_next is None or best_next == current:
                break
            current = best_next
            
        path.append(goal)
        
        length = sum(math.hypot(p[0]-path[i+1][0], p[1]-path[i+1][1]) 
                     for i, p in enumerate(path[:-1]))
        
        return PlanningResult(True, path, time.time()-start_time, length, len(path), "D* Lite")


class RRTStar(BaseAlgorithm):
    """RRT* path planning algorithm - Optimized version"""
    
    def __init__(self, grid_map: np.ndarray = None):
        super().__init__(grid_map)
        self._parameters = {
            "max_iterations": 1000,
            "step_size": 2.0,
            "rewire_radius": 5.0,
            "goal_bias": 0.15
        }
    
    def is_collision_free(self, a: Tuple[float, float], b: Tuple[float, float]) -> bool:
        r0, c0 = a
        r1, c1 = b
        d = math.hypot(r1-r0, c1-c0)
        steps = max(int(d) + 1, 2)
        for i in range(steps):
            t = i / (steps - 1) if steps > 1 else 0
            r = int(round(r0 + t * (r1 - r0)))
            c = int(round(c0 + t * (c1 - c0)))
            if r < 0 or r >= self.rows or c < 0 or c >= self.cols:
                return False
            if self.grid[r, c] == 1:
                return False
        return True
    
    def plan(self, grid_map: np.ndarray, start: Tuple[int, int], goal: Tuple[int, int]) -> PlanningResult:
        start_time = time.time()
        
        self.grid = grid_map
        self.rows, self.cols = grid_map.shape
        
        start_f = (float(start[0]), float(start[1]))
        goal_f = (float(goal[0]), float(goal[1]))
        
        nodes = [start_f]
        parents = {start_f: None}
        costs = {start_f: 0.0}
        
        goal_radius = 1.5
        max_iter = self._parameters.get("max_iterations", 1000)
        step_size = self._parameters.get("step_size", 2.0)
        rewire_radius = self._parameters.get("rewire_radius", 5.0)
        goal_bias = self._parameters.get("goal_bias", 0.15)
        
        path_found = False
        best_goal_node = None
        
        for _ in range(max_iter):
            if random.random() < goal_bias:
                x_rand = goal_f
            else:
                x_rand = (random.random() * self.rows, random.random() * self.cols)
            
            start_idx = max(0, len(nodes) - 100)
            nearest_idx = start_idx + np.argmin([
                math.hypot(n[0]-x_rand[0], n[1]-x_rand[1]) 
                for n in nodes[start_idx:]
            ])
            nearest = nodes[nearest_idx]
            
            d = math.hypot(x_rand[0]-nearest[0], x_rand[1]-nearest[1])
            if d > step_size:
                x_new = (nearest[0] + step_size*(x_rand[0]-nearest[0])/d,
                        nearest[1] + step_size*(x_rand[1]-nearest[1])/d)
            else:
                x_new = x_rand
            
            if not self.is_collision_free(nearest, x_new):
                continue
            
            neighbors = []
            for i, node in enumerate(nodes):
                dist = math.hypot(node[0]-x_new[0], node[1]-x_new[1])
                if dist < rewire_radius:
                    neighbors.append((i, node, dist))
            
            min_cost = costs[nearest] + math.hypot(x_new[0]-nearest[0], x_new[1]-nearest[1])
            best_parent = nearest
            
            for idx, node, dist in neighbors:
                if self.is_collision_free(node, x_new):
                    cost = costs[node] + dist
                    if cost < min_cost:
                        min_cost = cost
                        best_parent = node
            
            nodes.append(x_new)
            parents[x_new] = best_parent
            costs[x_new] = min_cost
            
            for idx, node, dist in neighbors:
                if self.is_collision_free(x_new, node):
                    cost = costs[x_new] + dist
                    if cost < costs[node]:
                        parents[node] = x_new
                        costs[node] = cost
            
            dist_to_goal = math.hypot(x_new[0]-goal_f[0], x_new[1]-goal_f[1])
            if dist_to_goal < goal_radius:
                if self.is_collision_free(x_new, goal_f):
                    new_cost = costs[x_new] + dist_to_goal
                    if best_goal_node is None or new_cost < costs[best_goal_node]:
                        best_goal_node = x_new
                        path_found = True
        
        if not path_found:
            return PlanningResult(False, [], time.time()-start_time, 0, 0, "RRT*")
        
        path = []
        current = best_goal_node
        visited = set()
        while current is not None and current not in visited:
            visited.add(current)
            path.append((int(round(current[0])), int(round(current[1]))))
            current = parents.get(current)
        path.append(goal)
        path.reverse()
        
        length = costs[best_goal_node] + math.hypot(best_goal_node[0]-goal_f[0], best_goal_node[1]-goal_f[1])
        
        return PlanningResult(True, path, time.time()-start_time, length, len(path), "RRT*")


class ACO(BaseAlgorithm):
    """Ant Colony Optimization path planning algorithm"""
    
    def __init__(self, grid_map: np.ndarray = None):
        super().__init__(grid_map)
        self._parameters = {
            "n_ants": 30,
            "max_iterations": 100,
            "alpha": 1.0,
            "beta": 5.0,
            "rho": 0.1,
            "Q": 100
        }
    
    def plan(self, grid_map: np.ndarray, start: Tuple[int, int], goal: Tuple[int, int]) -> PlanningResult:
        start_time = time.time()
        
        self.grid = grid_map
        self.rows, self.cols = grid_map.shape
        
        start_f = start
        goal_f = goal
        
        n_ants = self._parameters.get("n_ants", 30)
        max_iter = self._parameters.get("max_iterations", 100)
        alpha = self._parameters.get("alpha", 1.0)
        beta = self._parameters.get("beta", 5.0)
        rho = self._parameters.get("rho", 0.1)
        Q = self._parameters.get("Q", 100)
        
        pheromone = np.ones((self.rows, self.cols))
        best_path = None
        best_length = np.inf
        
        for _ in range(max_iter):
            paths = []
            lengths = []
            
            for _ in range(n_ants):
                current = start_f
                path = [current]
                visited = set([current])
                
                for _ in range(400):
                    if current == goal_f:
                        break
                        
                    neighbors = []
                    for dr, dc in [(-1,0), (1,0), (0,-1), (0,1), (-1,-1), (-1,1), (1,-1), (1,1)]:
                        nr, nc = current[0]+dr, current[1]+dc
                        if 0<=nr<self.rows and 0<=nc<self.cols and (nr,nc) not in visited and self.grid[nr,nc]==0:
                            neighbors.append((nr, nc))
                            
                    if not neighbors:
                        break
                        
                    prob = []
                    for n in neighbors:
                        ph = pheromone[n[0], n[1]] ** alpha
                        heu = (1/(1+math.hypot(n[0]-goal_f[0], n[1]-goal_f[1]))) ** beta
                        prob.append(ph * heu)
                        
                    prob = np.array(prob) / sum(prob)
                    selected_idx = np.random.choice(len(neighbors), p=prob)
                    current = neighbors[selected_idx]
                    path.append(current)
                    visited.add(current)
                    
                if current == goal_f:
                    paths.append(path)
                    lengths.append(sum(math.hypot(p[0]-path[i+1][0], p[1]-path[i+1][1]) 
                                     for i,p in enumerate(path[:-1])))
                    
                    if lengths[-1] < best_length:
                        best_length = lengths[-1]
                        best_path = path.copy()
                        
            pheromone *= (1-rho)
            for path, length in zip(paths, lengths):
                for p in path:
                    pheromone[p[0], p[1]] += Q / length
                    
        if best_path is None:
            return PlanningResult(False, [], time.time()-start_time, 0, 0, "ACO")
            
        return PlanningResult(True, best_path, time.time()-start_time, best_length, len(best_path), "ACO")


class PathPlanner:
    """Unified path planner interface"""
    
    ALGORITHMS = {
        1: DStarLite,
        2: RRTStar,
        3: ACO,
    }
    
    ALGO_NAMES = {
        1: "D* Lite",
        2: "RRT*",
        3: "ACO",
    }
    
    @staticmethod
    def plan(grid_map: np.ndarray, start: Tuple[int, int], goal: Tuple[int, int], 
             algo_type: int = 1) -> PlanningResult:
        if algo_type not in PathPlanner.ALGORITHMS:
            algo_type = 1
            
        algo_class = PathPlanner.ALGORITHMS[algo_type]
        planner = algo_class(grid_map)
        return planner.plan(grid_map, start, goal)


def generate_random_map(rows: int, cols: int, obstacle_ratio: float = 0.2,
                       start: Optional[Tuple[int, int]] = None,
                       goal: Optional[Tuple[int, int]] = None) -> np.ndarray:
    """Generate random obstacle map"""
    grid = np.zeros((rows, cols), dtype=np.uint8)
    
    n_obstacles = int(rows * cols * obstacle_ratio)
    for _ in range(n_obstacles):
        r = random.randint(0, rows-1)
        c = random.randint(0, cols-1)
        if (start and (r,c) == start) or (goal and (r,c) == goal):
            continue
        grid[r, c] = 1
        
    if start:
        grid[start[0], start[1]] = 0
    if goal:
        grid[goal[0], goal[1]] = 0
        
    return grid
