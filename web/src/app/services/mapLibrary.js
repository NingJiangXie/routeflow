import { createGrid } from '../lib/planning.js';

const STORAGE_KEY = 'routeflow_map_library';
const FAVORITES_KEY = 'routeflow_favorites';

export function getAllMaps() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveMap(mapData) {
  try {
    const maps = getAllMaps();
    const newMap = {
      id: mapData.id || `map_${Date.now()}`,
      name: mapData.name || '未命名地图',
      description: mapData.description || '',
      gridSize: mapData.grid?.length || 0,
      density: mapData.density || 0,
      grid: mapData.grid,
      start: mapData.start,
      goal: mapData.goal,
      tags: mapData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    maps.push(newMap);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
    return newMap;
  } catch (e) {
    console.error('Failed to save map:', e);
    return null;
  }
}

export function updateMap(mapId, updates) {
  try {
    const maps = getAllMaps();
    const idx = maps.findIndex(m => m.id === mapId);
    if (idx === -1) return null;
    maps[idx] = {
      ...maps[idx],
      ...updates,
      id: mapId,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
    return maps[idx];
  } catch (e) {
    console.error('Failed to update map:', e);
    return null;
  }
}

export function deleteMap(mapId) {
  try {
    const maps = getAllMaps();
    const filtered = maps.filter(m => m.id !== mapId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered.length < maps.length;
  } catch {
    return false;
  }
}

export function exportMap(mapData, format = 'json') {
  if (format === 'json') {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      map: {
        name: mapData.name,
        description: mapData.description,
        gridSize: mapData.grid?.length || 0,
        density: mapData.density,
        grid: mapData.grid,
        start: mapData.start,
        goal: mapData.goal,
        tags: mapData.tags || [],
      },
    }, null, 2);
  }
  return '';
}

export function importMap(jsonString) {
  try {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    const mapData = data.map || data;
    if (!mapData.grid || !Array.isArray(mapData.grid)) {
      throw new Error('Invalid map format: missing grid');
    }
    return {
      success: true,
      map: {
        name: mapData.name || '导入的地图',
        description: mapData.description || '',
        grid: mapData.grid,
        start: mapData.start || { x: 1, y: 1 },
        goal: mapData.goal || { x: mapData.grid.length - 2, y: mapData.grid.length - 2 },
        density: mapData.density || 0,
        tags: mapData.tags || [],
      },
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export function gridToImageData(grid) {
  const size = grid.length;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      if (grid[y][x] === 1) {
        imageData.data[idx] = 30;
        imageData.data[idx + 1] = 30;
        imageData.data[idx + 2] = 40;
        imageData.data[idx + 3] = 255;
      } else {
        imageData.data[idx] = 245;
        imageData.data[idx + 1] = 245;
        imageData.data[idx + 2] = 245;
        imageData.data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export function imageDataToGrid(imageData, threshold = 128) {
  const { width, height, data } = imageData;
  const size = Math.min(width, height);
  const grid = [];

  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      row.push(brightness < threshold ? 1 : 0);
    }
    grid.push(row);
  }

  return grid;
}

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addFavorite(item) {
  try {
    const favorites = getFavorites();
    const newItem = {
      ...item,
      id: item.id || `fav_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    favorites.push(newItem);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return newItem;
  } catch {
    return null;
  }
}

export function removeFavorite(favoriteId) {
  try {
    const favorites = getFavorites();
    const filtered = favorites.filter(f => f.id !== favoriteId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    return filtered.length < favorites.length;
  } catch {
    return false;
  }
}

export const SCENE_TEMPLATES = [
  {
    id: 'maze',
    name: '迷宫',
    nameEn: 'Maze',
    description: '经典迷宫场景，长走廊与死胡同',
    descriptionEn: 'Classic maze with corridors and dead ends',
    generate: (size = 32) => {
      const grid = Array.from({ length: size }, () => Array(size).fill(1));
      const stack = [{ x: 1, y: 1 }];
      grid[1][1] = 0;

      while (stack.length) {
        const current = stack[stack.length - 1];
        const dirs = [
          { dx: 0, dy: -2 },
          { dx: 2, dy: 0 },
          { dx: 0, dy: 2 },
          { dx: -2, dy: 0 },
        ].sort(() => Math.random() - 0.5);

        let carved = false;
        for (const { dx, dy } of dirs) {
          const nx = current.x + dx;
          const ny = current.y + dy;
          if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && grid[ny][nx] === 1) {
            grid[ny][nx] = 0;
            grid[current.y + dy / 2][current.x + dx / 2] = 0;
            stack.push({ x: nx, y: ny });
            carved = true;
            break;
          }
        }
        if (!carved) stack.pop();
      }

      const start = { x: 1, y: 1 };
      const goal = { x: size - 2, y: size - 2 };
      grid[goal.y][goal.x] = 0;
      return { grid, start, goal, size };
    },
  },
  {
    id: 'rooms',
    name: '房间',
    nameEn: 'Rooms',
    description: '多个房间由走廊连接',
    descriptionEn: 'Multiple rooms connected by corridors',
    generate: (size = 32) => {
      const grid = Array.from({ length: size }, () => Array(size).fill(1));
      const rooms = [];
      const roomSize = Math.floor(size / 4);

      for (let ry = 0; ry < 3; ry++) {
        for (let rx = 0; rx < 3; rx++) {
          const roomX = rx * roomSize + 2;
          const roomY = ry * roomSize + 2;
          const w = roomSize - 4;
          const h = roomSize - 4;
          for (let y = roomY; y < roomY + h && y < size - 1; y++) {
            for (let x = roomX; x < roomX + w && x < size - 1; x++) {
              grid[y][x] = 0;
            }
          }
          rooms.push({ x: roomX + Math.floor(w / 2), y: roomY + Math.floor(h / 2) });
        }
      }

      for (let i = 0; i < rooms.length - 1; i++) {
        const a = rooms[i];
        const b = rooms[i + 1];
        let cx = a.x;
        while (cx !== b.x) {
          grid[a.y][cx] = 0;
          cx += cx < b.x ? 1 : -1;
        }
        let cy = a.y;
        while (cy !== b.y) {
          grid[cy][b.x] = 0;
          cy += cy < b.y ? 1 : -1;
        }
      }

      const start = { x: 2, y: 2 };
      const goal = { x: size - 3, y: size - 3 };
      return { grid, start, goal, size };
    },
  },
  {
    id: 'forest',
    name: '随机森林',
    nameEn: 'Random Forest',
    description: '随机分布的障碍物',
    descriptionEn: 'Randomly distributed obstacles',
    generate: (size = 32, density = 25) => {
      const start = { x: 1, y: 1 };
      const goal = { x: size - 2, y: size - 2 };
      const grid = createGrid(size, density, start, goal);
      return { grid, start, goal, size };
    },
  },
  {
    id: 'city',
    name: '城市网格',
    nameEn: 'City Grid',
    description: '规则的街区式布局',
    descriptionEn: 'Regular city block layout',
    generate: (size = 32) => {
      const grid = Array.from({ length: size }, () => Array(size).fill(0));
      const blockSize = 4;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (y % blockSize === 0 || x % blockSize === 0) {
            grid[y][x] = 0;
          } else {
            grid[y][x] = 1;
          }
        }
      }

      for (let y = 0; y < size; y++) {
        grid[y][0] = 1;
        grid[y][size - 1] = 1;
      }
      for (let x = 0; x < size; x++) {
        grid[0][x] = 1;
        grid[size - 1][x] = 1;
      }

      const start = { x: 1, y: 1 };
      const goal = { x: size - 2, y: size - 2 };
      return { grid, start, goal, size };
    },
  },
  {
    id: 'spiral',
    name: '螺旋',
    nameEn: 'Spiral',
    description: '螺旋形障碍布局',
    descriptionEn: 'Spiral obstacle pattern',
    generate: (size = 32) => {
      const grid = Array.from({ length: size }, () => Array(size).fill(0));
      let x = 0, y = 0, dx = 1, dy = 0;
      let layer = 0;

      while (layer < Math.floor(size / 4)) {
        const innerSize = size - layer * 4;
        for (let side = 0; side < 4; side++) {
          for (let i = 0; i < innerSize - 1; i++) {
            const px = x + layer * 2;
            const py = y + layer * 2;
            if (px >= 0 && px < size && py >= 0 && py < size) {
              grid[py][px] = 1;
            }
            x += dx;
            y += dy;
          }
          const temp = dx;
          dx = -dy;
          dy = temp;
        }
        layer += 1;
        x = layer * 2;
        y = layer * 2;
        dx = 1;
        dy = 0;
      }

      const start = { x: 1, y: 1 };
      const goal = { x: Math.floor(size / 2), y: Math.floor(size / 2) };
      grid[start.y][start.x] = 0;
      grid[goal.y][goal.x] = 0;
      return { grid, start, goal, size };
    },
  },
];
