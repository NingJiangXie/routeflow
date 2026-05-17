# RouteFlow (途畅)

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub Stars](https://img.shields.io/github/stars/NingJiangXie/routeflow?style=social)](https://github.com/NingJiangXie/routeflow/stargazers)

[English](README.md) | [中文](README_Chinese.md)

## 概述

一个现代化的路径规划系统，拥有美观的Web界面、多种算法以及动态障碍物避障功能。基于JavaScript和Python构建，为2D网格路径规划提供了优雅的解决方案。

## ✨ 主要功能

### 🎯 算法
- **D* Lite** - 用于移动障碍物的实时动态重规划
- **RRT*** - 概率最优路径规划
- **ACO** - 蚁群优化算法

### 🎨 用户界面与功能
- 🌐 现代化玻璃效果Web界面
- 📊 实时路径可视化
- 🔄 动态障碍物避障模式
- 📈 统计数据和性能指标
- 🎨 可自定义配色方案
- 📱 响应式设计

## 📸 截图展示

### 主界面

![主页面](images/主页面.png)

### AI助手

![AI助手](images/ai助手.png)

### 3D效果

![3d效果](images/3d效果.png)

### 深色模式

![深色模式](images/深色模式.png)

### 英文模式

![英文模式](images/英文模式.png)

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
routeflow/
├── images/                  # Screenshots | 截图
├── web/                    # Web frontend | Web前端
│   ├── index.html         # Main application | 主应用
│   └── js/
│       └── algorithms/    # JavaScript implementations | JavaScript实现
├── src/                    # Source code | 源代码
│   ├── algorithms/        # Path planning algorithms | 路径规划算法
│   │   ├── path_planning.py
│   │   ├── simulator.py
│   │   └── real-algorithms.js
│   └── utils/             # Utility functions | 工具函数
├── api/                    # Backend API | 后端API
├── docs/                   # Documentation | 文档
├── examples/               # Examples | 示例代码
├── requirements.txt        # Python dependencies | Python依赖
├── README.md              # English README
├── README_Chinese.md      # 中文说明
├── CONTRIBUTING.md        # Contribution guide | 贡献指南
├── CHANGELOG.md           # Changelog | 更新日志
├── ALGORITHM_FORMAT.md    # Algorithm format guide | 算法格式指南
├── ALGORITHM_FORMAT_Chinese.md
└── LICENSE                # MIT License | MIT许可证
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
