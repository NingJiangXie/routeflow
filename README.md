# RouteFlow (途畅)

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub Stars](https://img.shields.io/github/stars/your-username/routeflow?style=social)](https://github.com/your-username/routeflow/stargazers)
[![Twitter](https://img.shields.io/twitter/url?url=https%3A%2F%2Fgithub.com%2Fyour-username%2Frouteflow)](https://twitter.com/intent/tweet?text=I%20just%20found%20%23RouteFlow%20%F0%9F%9A%8C%20-%20an%20amazing%20AI-powered%20path%20planning%20system!%20Check%20it%20out%3A%20https%3A%2F%2Fgithub.com%2Fyour-username%2Frouteflow)

**English** | [简体中文](README_Chinese.md) | [日本語](README_Japanese.md)

*A modern AI-powered path planning platform with beautiful web interface*

</div>

## ✨ Features | 功能特点

### 🎯 Path Planning Algorithms | 路径规划算法

| Algorithm | Description | 说明 |
|-----------|-------------|------|
| **D* Lite** | Real-time dynamic replanning for moving obstacles | 移动障碍物的实时动态重规划 |
| **RRT*** | Probabilistically optimal path planning | 概率最优路径规划 |
| **ACO** | Ant Colony Optimization | 蚁群优化算法 |
| **HCFA** | Hybrid Cooperative Fusion Algorithm | 混合协作融合算法 |

### 🎨 Modern UI | 现代化界面

- 🌐 **Glass-morphism Design** - Beautiful frosted glass effects | 玻璃拟态设计
- 📊 **Real-time Visualization** - Watch paths being calculated | 实时可视化
- 🔄 **Dynamic Obstacles** - Real-time path replanning | 动态障碍物
- 📈 **Performance Metrics** - Track algorithm performance | 性能指标
- 🎨 **Customizable Colors** - Personalize your experience | 自定义配色
- 🌙 **Dark/Light Mode** - Easy on the eyes | 深色/浅色模式
- 🌐 **Bilingual Support** - Chinese and English | 中英文双语

### 🤖 AI Integration | AI集成

- 💬 **AI Assistant** - Get help with path planning questions | AI助手
- 📝 **Code Generation** - Generate optimized algorithm code | 代码生成
- 🔧 **Code Optimization** - Improve your existing code | 代码优化
- 📊 **Algorithm Comparison** - Compare different algorithms | 算法对比

## 🚀 Quick Start | 快速开始

### Web Interface | Web界面（推荐）

```bash
# Option 1: Direct browser
# 方法1: 直接浏览器打开
open web/index.html

# Option 2: Python simple server
# 方法2: Python简单服务器
cd web
python -m http.server 8080
# Visit http://localhost:8080
```

### Python Backend | Python后端

```bash
# Install dependencies
# 安装依赖
pip install -r requirements.txt

# Run example
# 运行示例
python examples/basic_example.py
```

## 📁 Project Structure | 项目结构

```
routeflow/
├── web/                      # Web frontend | Web前端
│   ├── index.html           # Main application | 主应用
│   └── js/                  # JavaScript files | JavaScript文件
│       └── algorithms/      # Algorithm implementations | 算法实现
├── src/                      # Python source code | Python源代码
│   ├── algorithms/          # Path planning algorithms | 路径规划算法
│   │   ├── path_planning.py
│   │   ├── simulator.py
│   │   └── real-algorithms.js
│   └── utils/              # Utility functions | 工具函数
├── api/                      # Backend API | 后端API
│   └── app.py
├── docs/                     # Documentation | 文档
├── examples/                 # Example code | 示例代码
├── dist/                     # Built files | 构建文件
├── LICENSE                  # MIT License | MIT许可证
├── README.md                # English README
├── README_Chinese.md         # 中文说明
├── CONTRIBUTING.md          # Contribution guide | 贡献指南
├── CHANGELOG.md             # Version history | 版本历史
├── .gitignore               # Git ignore rules | Git忽略规则
└── requirements.txt         # Python dependencies | Python依赖
```

## 🛠️ Installation | 安装

See [Installation Guide](docs/install.md) for detailed instructions.

详见[安装指南](docs/install.md)获取详细说明。

## 📖 Documentation | 文档

- [📚 Installation Guide](docs/install.md) - Installation instructions | 安装说明
- [📖 User Manual](docs/usage.md) - How to use the platform | 使用手册
- [🔌 API Reference](docs/api.md) - API documentation | API文档
- [🔧 Algorithm Format Guide](ALGORITHM_FORMAT.md) - How to import custom algorithms | 如何导入自定义算法

## 🔧 Custom Algorithm Import | 自定义算法导入

RouteFlow supports importing custom path planning algorithms! You can create your own algorithms and integrate them into the platform.

RouteFlow 支持导入自定义路径规划算法！您可以创建自己的算法并将其集成到平台中。

### Quick Example | 快速示例

```javascript
class MyAlgorithm {
    plan(grid, start, goal) {
        // Your algorithm implementation
        // 您的算法实现
        return {
            success: true,
            path: [[0,0], [1,0], [2,1]],
            time: 5.2,
            length: 2.5,
            steps: 3,
            algorithm: 'My Algorithm'
        };
    }
}
```

See [Algorithm Format Guide](ALGORITHM_FORMAT.md) for detailed instructions.

详见[算法格式指南](ALGORITHM_FORMAT_Chinese.md)获取详细说明。

## 🤝 Contributing | 贡献

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

欢迎贡献！请阅读我们的[贡献指南](CONTRIBUTING.md)了解更多细节。

### Quick Guide | 快速指南

```bash
# 1. Fork the repository
# 1. Fork 本仓库

# 2. Clone your fork
# 2. 克隆你的fork
git clone https://github.com/your-username/routeflow.git
cd routeflow

# 3. Create your feature branch
# 3. 创建特性分支
git checkout -b feature/amazing-feature

# 4. Make your changes
# 4. 进行更改

# 5. Commit and push
# 5. 提交并推送
git commit -m "Add amazing feature"
git push origin feature/amazing-feature

# 6. Open a Pull Request
# 6. 创建 Pull Request
```

## 📜 License | 许可证

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

本项目使用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 Acknowledgments | 致谢

- [React Bits](https://github.com/DavidHDev/react-bits) - UI design inspiration | UI设计灵感
- [Three.js](https://threejs.org/) - 3D visualization | 3D可视化
- [Font Awesome](https://fontawesome.com/) - Icons | 图标

## 📊 Stats | 统计

![GitHub repo size](https://img.shields.io/github/repo-size/your-username/routeflow)
![GitHub language count](https://img.shields.io/github/languages/count/your-username/routeflow)
![GitHub last commit](https://img.shields.io/github/last-commit/your-username/routeflow)

---

<div align="center">

**Made with ❤️ for path planning enthusiasts | 用❤️为路径规划爱好者打造**

**© 2026 RouteFlow. All rights reserved. | 保留所有权利。**

</div>
