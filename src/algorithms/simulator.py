
"""
Simple Simulator - Pure Python Path Planning Visualization
"""

import numpy as np
import time
import math
from typing import Tuple, List, Optional, Callable


class SimpleSimulator:
    """
    高级可视化仿真器 - 纯Python实现
    包含渐变色彩、动画效果、发光边框、粒子效果等视觉元素
    """

    def __init__(self):
        self.static_map = None
        self.dynamic_positions = []
        self.robot_pos = None
        self.goal_pos = None
        self.start_pos = None
        self.history = []
        self.path = []
        self.animation_frame = 0
        self.last_render_time = 0
        self.particles = []
        self.trail_points = []
        self.max_trail = 100

    def reset(self, static_map: np.ndarray, start_rc: Tuple[int, int], goal_rc: Tuple[int, int]):
        """重置仿真环境"""
        self.static_map = static_map.copy()
        self.robot_pos = np.array(start_rc, dtype=np.float32)
        self.start_pos = np.array(start_rc, dtype=np.float32)
        self.goal_pos = np.array(goal_rc, dtype=np.float32)
        self.history = [self.robot_pos.copy()]
        self.dynamic_positions = []
        self.animation_frame = 0
        self.particles = []
        self.trail_points = []
        self.path = []
    
    def set_path(self, path: List[Tuple[int, int]]):
        """设置要显示的路径"""
        self.path = path
    
    def clear_path_and_history(self):
        """清除路径和历史记录"""
        self.path = []
        self.history = [self.robot_pos.copy()] if self.robot_pos is not None else []
        self.trail_points = []
        self.particles = []
        self.animation_frame = 0

    def step(self, next_pos: Tuple[float, float]):
        """执行一步仿真"""
        # 添加到轨迹
        if len(self.trail_points) >= self.max_trail:
            self.trail_points.pop(0)
        self.trail_points.append((float(self.robot_pos[0]), float(self.robot_pos[1])))
        
        # 更新位置
        self.robot_pos = np.array(next_pos, dtype=np.float32)
        self.history.append(self.robot_pos.copy())
        self.animation_frame += 1
        
        # 生成粒子效果
        self._spawn_particles(2)

        # 更新动态障碍物 (随机移动)
        for i in range(len(self.dynamic_positions)):
            move = np.random.randint(-1, 2, size=2)
            new_pos = self.dynamic_positions[i] + move
            if (0 <= new_pos[0] < self.static_map.shape[0] and
                    0 <= new_pos[1] < self.static_map.shape[1] and
                    self.static_map[new_pos[0], new_pos[1]] == 0):
                self.dynamic_positions[i] = new_pos

    def _spawn_particles(self, count: int):
        """生成粒子"""
        for _ in range(count):
            if len(self.particles) < 50:
                angle = np.random.uniform(0, 2 * np.pi)
                speed = np.random.uniform(0.5, 2.0)
                self.particles.append({
                    'x': float(self.robot_pos[1]),
                    'y': float(self.robot_pos[0]),
                    'vx': np.cos(angle) * speed,
                    'vy': np.sin(angle) * speed,
                    'life': 1.0,
                    'decay': np.random.uniform(0.02, 0.05)
                })

    def _update_particles(self):
        """更新粒子"""
        for p in self.particles[:]:
            p['x'] += p['vx']
            p['y'] += p['vy']
            p['life'] -= p['decay']
            if p['life'] <= 0:
                self.particles.remove(p)

    def is_at_goal(self) -> bool:
        """检查是否到达目标"""
        return np.linalg.norm(self.robot_pos - self.goal_pos) < 0.5

    def _lerp_color(self, c1: tuple, c2: tuple, t: float) -> tuple:
        """在两个颜色之间进行线性插值"""
        return (
            int(c1[0] + (c2[0] - c1[0]) * t),
            int(c1[1] + (c2[1] - c1[1]) * t),
            int(c1[2] + (c2[2] - c1[2]) * t)
        )

    def _draw_gradient_line(self, draw, p1, p2, color1, color2, width):
        """绘制渐变线段"""
        dx = p2[0] - p1[0]
        dy = p2[1] - p1[1]
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            return
            
        steps = max(int(length / 2), 1)
        for i in range(steps):
            t_val = i / steps
            x = int(p1[0] + dx * t_val)
            y = int(p1[1] + dy * t_val)
            color = self._lerp_color(color1, color2, t_val)
            draw.ellipse([x-width//2, y-width//2, x+width//2, y+width//2], fill=color)

    def _draw_glow_effect(self, draw, x, y, radius, base_color, pulse=True):
        """绘制发光效果"""
        # 基础发光
        glow_colors = [
            (base_color[0], base_color[1], base_color[2], 30),
            (base_color[0], base_color[1], base_color[2], 20),
            (base_color[0], base_color[1], base_color[2], 10),
        ]
        
        for idx, (r, g, b, alpha) in enumerate(glow_colors):
            current_radius = radius + (len(glow_colors) - idx) * 4
            draw.ellipse([
                x - current_radius, y - current_radius,
                x + current_radius, y + current_radius
            ], fill=(r, g, b, alpha))
        
        # 脉冲效果
        if pulse:
            pulse_factor = abs(math.sin(self.animation_frame * 0.1)) * 0.3 + 0.7
            pulse_radius = int(radius * pulse_factor)
            draw.ellipse([
                x - pulse_radius - 5, y - pulse_radius - 5,
                x + pulse_radius + 5, y + pulse_radius + 5
            ], outline=base_color, width=2)

    def render(self) -> np.ndarray:
        """
        高级渲染 - 包含动画效果、渐变色彩、发光边框、粒子效果
        返回RGB图像
        """
        from PIL import Image, ImageDraw, ImageFilter
        
        # 更新粒子
        self._update_particles()
        
        # 配置
        scale = 30
        padding = 20
        rows, cols = self.static_map.shape
        
        # 计算图像尺寸
        img_w = cols * scale + padding * 2
        img_h = rows * scale + padding * 2
        
        # 创建深色背景
        img = Image.new('RGB', (img_w, img_h), (10, 15, 25))
        draw = ImageDraw.Draw(img, 'RGBA')
        
        # 绘制背景网格
        for r in range(rows):
            for c in range(cols):
                x = padding + c * scale
                y = padding + r * scale
                
                is_obstacle = self.static_map[r, c] == 1
                
                if is_obstacle:
                    # 障碍物 - 渐变灰色
                    depth = 0.3 + 0.2 * ((r + c) % 3) / 3
                    color = tuple(int(60 + 40 * depth) for _ in range(3))
                    draw.rounded_rectangle([x+2, y+2, x+scale-2, y+scale-2], radius=6, fill=color)
                else:
                    # 自由空间 - 渐变深蓝
                    color = (20, 30, 50)
                    draw.rectangle([x, y, x+scale, y+scale], fill=color)
                
                # 网格线
                draw.rectangle([x, y, x+scale, y+scale], outline=(30, 40, 60), width=1)
        
        # 绘制轨迹效果
        if len(self.trail_points) > 1:
            for i in range(len(self.trail_points) - 1):
                t_val = i / len(self.trail_points)
                x1 = padding + self.trail_points[i][1] * scale + scale // 2
                y1 = padding + self.trail_points[i][0] * scale + scale // 2
                x2 = padding + self.trail_points[i+1][1] * scale + scale // 2
                y2 = padding + self.trail_points[i+1][0] * scale + scale // 2
                
                # 轨迹颜色从亮到暗渐变
                trail_color = self._lerp_color((100, 150, 255), (20, 30, 50), 1-t_val)
                draw.line([(x1, y1), (x2, y2)], fill=trail_color, width=3)
        
        # 绘制预测路径
        if len(self.path) > 1:
            for i in range(len(self.path) - 1):
                p1 = self.path[i]
                p2 = self.path[i + 1]
                x1 = padding + p1[1] * scale + scale // 2
                y1 = padding + p1[0] * scale + scale // 2
                x2 = padding + p2[1] * scale + scale // 2
                y2 = padding + p2[0] * scale + scale // 2
                
                # 路径颜色渐变
                t_val = i / len(self.path)
                path_color = self._lerp_color((139, 92, 246), (99, 102, 241), t_val)
                draw.line([(x1, y1), (x2, y2)], fill=path_color, width=4)
                
                # 路径节点
                node_radius = 3
                draw.ellipse([x1-node_radius, y1-node_radius, x1+node_radius, y1+node_radius], fill=path_color)
        
        # 绘制历史路径
        if len(self.history) > 1:
            for i in range(len(self.history) - 1):
                t_val = i / max(len(self.history) - 2, 1)
                x1 = padding + self.history[i][1] * scale + scale // 2
                y1 = padding + self.history[i][0] * scale + scale // 2
                x2 = padding + self.history[i+1][1] * scale + scale // 2
                y2 = padding + self.history[i+1][0] * scale + scale // 2
                
                # 历史路径颜色
                hist_color = self._lerp_color((16, 185, 129), (5, 150, 105), t_val)
                draw.line([(x1, y1), (x2, y2)], fill=hist_color, width=5)
        
        # 绘制粒子
        for p in self.particles:
            x = padding + p['x'] * scale + scale // 2
            y = padding + p['y'] * scale + scale // 2
            alpha = int(255 * p['life'])
            size = int(3 * p['life'] + 1)
            color = (6, 182, 212, alpha)
            draw.ellipse([x-size, y-size, x+size, y+size], fill=color)
        
        # 绘制起点 (绿色发光)
        if self.start_pos is not None:
            sx = padding + self.start_pos[1] * scale + scale // 2
            sy = padding + self.start_pos[0] * scale + scale // 2
            
            self._draw_glow_effect(draw, sx, sy, 15, (16, 185, 129), pulse=False)
            draw.ellipse([sx-12, sy-12, sx+12, sy+12], fill=(16, 185, 129))
            draw.ellipse([sx-8, sy-8, sx+8, sy+8], fill=(240, 253, 244))
            draw.text((sx-5, sy-8), "S", fill=(16, 185, 129))
        
        # 绘制终点 (红色发光脉冲)
        if self.goal_pos is not None:
            gx = padding + self.goal_pos[1] * scale + scale // 2
            gy = padding + self.goal_pos[0] * scale + scale // 2
            
            self._draw_glow_effect(draw, gx, gy, 18, (239, 68, 68), pulse=True)
            
            # 三角形终点标记
            triangle_points = [
                (gx, gy-15),
                (gx+13, gy+8),
                (gx-13, gy+8)
            ]
            draw.polygon(triangle_points, fill=(239, 68, 68))
            inner_points = [(gx, gy-8), (gx+7, gy+4), (gx-7, gy+4)]
            draw.polygon(inner_points, fill=(254, 226, 226))
        
        # 绘制机器人 (青色发光 + 朝向指示)
        if self.robot_pos is not None:
            rx = padding + self.robot_pos[1] * scale + scale // 2
            ry = padding + self.robot_pos[0] * scale + scale // 2
            
            self._draw_glow_effect(draw, rx, ry, 20, (6, 182, 212), pulse=True)
            
            # 机器人体
            draw.ellipse([rx-14, ry-14, rx+14, ry+14], fill=(6, 182, 212))
            draw.ellipse([rx-10, ry-10, rx+10, ry+10], fill=(207, 250, 254))
            draw.ellipse([rx-5, ry-5, rx+5, ry+5], fill=(6, 182, 212))
            
            # 朝向指示器
            if len(self.history) >= 2:
                prev = self.history[-2]
                dx = self.robot_pos[1] - prev[1]
                dy = self.robot_pos[0] - prev[0]
                length = math.sqrt(dx*dx + dy*dy)
                if length > 0.1:
                    dx /= length
                    dy /= length
                    arrow_len = 18
                    end_x = rx + dx * arrow_len
                    end_y = ry + dy * arrow_len
                    draw.line([(int(rx), int(ry)), (int(end_x), int(end_y))],
                              fill=(14, 116, 144), width=4)
                    # 箭头
                    arrow_size = 6
                    angle = math.atan2(dy, dx)
                    arrow_x1 = end_x - arrow_size * math.cos(angle - 0.5)
                    arrow_y1 = end_y - arrow_size * math.sin(angle - 0.5)
                    arrow_x2 = end_x - arrow_size * math.cos(angle + 0.5)
                    arrow_y2 = end_y - arrow_size * math.sin(angle + 0.5)
                    draw.polygon([
                        (int(end_x), int(end_y)),
                        (int(arrow_x1), int(arrow_y1)),
                        (int(arrow_x2), int(arrow_y2))
                    ], fill=(14, 116, 144))
        
        # 应用滤镜增强视觉效果
        img = img.filter(ImageFilter.SMOOTH)
        img = img.filter(ImageFilter.DETAIL)
        
        return np.array(img)


def test_simulator():
    """测试仿真器"""
    from path_planning import generate_random_map, PathPlanner

    # 生成随机地图
    start = (2, 2)
    goal = (18, 18)
    static_map = generate_random_map(20, 20, 0.2, start, goal)

    # 规划路径
    result = PathPlanner.plan(static_map, start, goal, algo_type=1)
    if not result.success:
        print("路径规划失败！")
        return

    # 运行仿真
    sim = SimpleSimulator()
    sim.reset(static_map, start, goal)
    sim.path = result.path

    print("开始仿真运行...")
    for pos in result.path:
        sim.step(pos)
        print(f"位置: {pos}", end="\r")
        time.sleep(0.1)

    print(f"\n仿真结束: 到达目标 = {sim.is_at_goal()}, 步数 = {len(sim.history)}")


if __name__ == '__main__':
    test_simulator()

