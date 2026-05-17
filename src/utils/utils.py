
"""
Utility functions and helper classes
"""
import os
import json
import numpy as np
from datetime import datetime
from typing import List, Tuple, Any
from pathlib import Path

def ensure_dir(dir_path: str) -> str:
    """Ensure directory exists, create if not"""
    Path(dir_path).mkdir(parents=True, exist_ok=True)
    return dir_path

def get_timestamp() -> str:
    """Get formatted timestamp string"""
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def parse_coordinate(text: str) -> Tuple[int, int]:
    """Parse coordinate from string like 'row,col'"""
    try:
        parts = text.replace(' ', '').split(',')
        if len(parts) >= 2:
            return (int(parts[0]), int(parts[1]))
    except Exception:
        pass
    return None

def validate_coordinate(coord: Tuple[int, int], map_shape: Tuple[int, int]) -> bool:
    """Validate coordinate is within map bounds"""
    if not coord or len(coord) != 2:
        return False
    row, col = coord
    rows, cols = map_shape
    return 0 <= row < rows and 0 <= col < cols

def save_map_to_file(grid_map: np.ndarray, filepath: str) -> bool:
    """Save map to file"""
    try:
        dir_name = os.path.dirname(filepath)
        if dir_name:
            ensure_dir(dir_name)
        
        # Save as numpy file
        np.save(filepath, grid_map)
        return True
    except Exception:
        return False

def load_map_from_file(filepath: str) -> np.ndarray:
    """Load map from file"""
    try:
        if filepath.endswith('.npy'):
            return np.load(filepath)
        elif filepath.endswith('.mat'):
            try:
                import scipy.io
                data = scipy.io.loadmat(filepath)
                if 'staticMap' in data:
                    return data['staticMap'].astype(np.uint8)
            except ImportError:
                pass
    except Exception:
        pass
    return None

def save_path_to_file(path_points: List[Tuple[float, float]], filepath: str, metadata: dict = None):
    """Save path to file"""
    data = {
        "path": path_points,
        "timestamp": get_timestamp(),
        "metadata": metadata or {}
    }
    try:
        dir_name = os.path.dirname(filepath)
        if dir_name:
            ensure_dir(dir_name)
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception:
        return False

def load_path_from_file(filepath: str) -> Tuple[List[Tuple[float, float]], dict]:
    """Load path from file"""
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        return data.get("path", []), data.get("metadata", {})
    except Exception:
        return [], {}

def calculate_path_length(path_points: List[Tuple[float, float]]) -> float:
    """Calculate total path length"""
    if not path_points or len(path_points) < 2:
        return 0.0
    
    total = 0.0
    for i in range(len(path_points)-1):
        dx = path_points[i+1][0] - path_points[i][0]
        dy = path_points[i+1][1] - path_points[i][1]
        total += np.sqrt(dx*dx + dy*dy)
    
    return total

def smooth_path(path_points: List[Tuple[float, float]], weight_data=0.5, weight_smooth=0.5, tolerance=0.000001) -> List[Tuple[float, float]]:
    """Smooth path using simple smoothing algorithm"""
    if len(path_points) <= 2:
        return path_points
    
    new_path = [(float(p[0]), float(p[1])) for p in path_points]
    path_array = np.array(new_path)
    smoothed = path_array.copy()
    
    change = tolerance
    while change >= tolerance:
        change = 0.0
        for i in range(1, len(path_array)-1):
            old = smoothed[i].copy()
            smoothed[i] = (
                smoothed[i] + 
                weight_data * (path_array[i] - smoothed[i]) + 
                weight_smooth * (smoothed[i-1] + smoothed[i+1] - 2 * smoothed[i])
            )
            change += np.sum(np.abs(old - smoothed[i]))
    
    return [(float(s[0]), float(s[1])) for s in smoothed]
