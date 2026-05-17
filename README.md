# RouteFlow (途畅)

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub Stars](https://img.shields.io/github/stars/NingJiangXie/routeflow?style=social)](https://github.com/NingJiangXie/routeflow/stargazers)

*A modern AI-powered path planning platform with beautiful web interface*

</div>

## Features

### Path Planning Algorithms

| Algorithm | Description |
|-----------|-------------|
| **D* Lite** | Real-time dynamic replanning for moving obstacles |
| **RRT*** | Probabilistically optimal path planning |
| **ACO** | Ant Colony Optimization |

### Modern UI

- 🌐 **Glass-morphism Design** - Beautiful frosted glass effects
- 📊 **Real-time Visualization** - Watch paths being calculated
- 🔄 **Dynamic Obstacles** - Real-time path replanning
- 📈 **Performance Metrics** - Track algorithm performance
- 🎨 **Customizable Colors** - Personalize your experience
- 🌙 **Dark/Light Mode** - Easy on the eyes
- 🌐 **Bilingual Support** - Chinese and English

### AI Integration

- 💬 **AI Assistant** - Get help with path planning questions
- 📝 **Code Generation** - Generate optimized algorithm code
- 🔧 **Code Optimization** - Improve your existing code
- 📊 **Algorithm Comparison** - Compare different algorithms

## Screenshots

### Main Interface
![Main Interface](images/主页面.png)

### AI Assistant
![AI Assistant](images/ai助手.png)

### 3D Visualization
![3D Visualization](images/3d效果.png)

### Dark Mode
![Dark Mode](images/深色模式.png)

### English Interface
![English Interface](images/英文模式.png)

## Quick Start

### Web Interface (Recommended)

```bash
# Option 1: Direct browser
open web/index.html

# Option 2: Python simple server
cd web
python -m http.server 8080
# Visit http://localhost:8080
```

### Python Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Run example
python examples/basic_example.py
```

## Project Structure

```
routeflow/
├── images/                  # Screenshots
├── web/                      # Web frontend
│   ├── index.html           # Main application
│   └── js/                  # JavaScript files
│       └── algorithms/      # Algorithm implementations
├── src/                      # Python source code
│   ├── algorithms/          # Path planning algorithms
│   │   ├── path_planning.py
│   │   ├── simulator.py
│   │   └── real-algorithms.js
│   └── utils/              # Utility functions
├── api/                      # Backend API
│   └── app.py
├── docs/                     # Documentation
├── examples/                 # Example code
├── dist/                     # Built files
├── LICENSE                  # MIT License
├── README.md                # This file
├── CONTRIBUTING.md          # Contribution guide
├── CHANGELOG.md             # Version history
├── ALGORITHM_FORMAT.md      # Algorithm format guide
├── .gitignore               # Git ignore rules
└── requirements.txt         # Python dependencies
```

## Installation

See [Installation Guide](docs/install.md) for detailed instructions.

## Documentation

- [📚 Installation Guide](docs/install.md) - Installation instructions
- [📖 User Manual](docs/usage.md) - How to use the platform
- [🔌 API Reference](docs/api.md) - API documentation
- [🔧 Algorithm Format Guide](ALGORITHM_FORMAT.md) - How to import custom algorithms

## Custom Algorithm Import

RouteFlow supports importing custom path planning algorithms. You can create your own algorithms and integrate them into the platform.

### Quick Example

```javascript
class MyAlgorithm {
    plan(grid, start, goal) {
        // Your algorithm implementation
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

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Guide

```bash
# 1. Fork the repository
# 2. Clone your fork
git clone https://github.com/NingJiangXie/routeflow.git
cd routeflow

# 3. Create your feature branch
git checkout -b feature/amazing-feature

# 4. Make your changes
# 5. Commit and push
git commit -m "Add amazing feature"
git push origin feature/amazing-feature

# 6. Open a Pull Request
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React Bits](https://github.com/DavidHDev/react-bits) - UI design inspiration
- [Three.js](https://threejs.org/) - 3D visualization
- [Font Awesome](https://fontawesome.com/) - Icons

## Stats

![GitHub repo size](https://img.shields.io/github/repo-size/NingJiangXie/routeflow)
![GitHub language count](https://img.shields.io/github/languages/count/NingJiangXie/routeflow)
![GitHub last commit](https://img.shields.io/github/last-commit/NingJiangXie/routeflow)

---

<div align="center">

**© 2026 RouteFlow. All rights reserved.**

</div>
