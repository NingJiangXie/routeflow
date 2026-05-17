# RouteFlow (途畅)

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub Stars](https://img.shields.io/github/stars/your-username/routeflow?style=social)](https://github.com/your-username/routeflow/stargazers)

[English](README.md) | [中文](README_Chinese.md)

## 概述

一个现代化的路径规划系统，拥有美观的Web界面、多种算法以及动态障碍物避障功能。基于JavaScript和Python构建，为2D网格路径规划提供了优雅的解决方案。

## ✨ 主要功能

### 🎯 算法
- **D* Lite** - 用于移动障碍物的实时动态重规划
- **RRT*** - 概率最优路径规划
- **ACO** - 蚁群优化算法
- **HCFA** - 混合协作融合算法

### 🎨 用户界面与功能
- 🌐 现代化玻璃效果Web界面
- 📊 实时路径可视化
- 🔄 动态障碍物避障模式
- 📈 统计数据和性能指标
- 🎨 可自定义配色方案
- 📱 响应式设计

## 🚀 快速开始

### 使用Web界面（推荐）

1. 在浏览器中打开 `web/index.html`
2. 生成随机地图或配置自己的地图
3. 选择算法并点击"规划"
4. 观察路径执行！

### Python后端

```bash
# 安装依赖
pip install -r requirements.txt

# 在Python代码中使用算法
```

## 📁 项目结构

```
path-planning-system/
├── web/                    # Web前端
│   ├── index.html         # 主界面
│   └── js/
│       └── algorithms/    # JavaScript实现
├── src/                    # 源代码
│   ├── algorithms/        # 路径规划算法
│   │   ├── path_planning.py (Python)
│   │   ├── simulator.py
│   │   └── real-algorithms.js (JS)
│   └── utils/            # 工具函数
├── docs/                  # 文档
├── examples/             # 示例代码
├── LICENSE               # MIT许可证
├── README.md             # 本文档
└── requirements.txt      # Python依赖
```

## 📖 文档

- [安装指南](docs/install.md)
- [用户手册](docs/usage.md)
- [API参考](docs/api.md)

## 🤝 贡献

欢迎贡献！请随时：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📜 许可证

本项目使用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢所有为本项目做出贡献的开发者！

---

**用 ❤️ 为路径规划爱好者打造**
