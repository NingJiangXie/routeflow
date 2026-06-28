# Changelog | 更新日志

All notable changes to this project will be documented in this file. | 此文件记录了项目的所有重要变更。

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). | 格式基于 Keep a Changelog。

## [2.3.0] - 2026-06-28 | 发布版本

### Added | 新增

#### New Features | 新功能
- **算法基准测试** - 多算法批量对比，生成统计报告
- **数据统计面板** - 运行历史记录、算法排名、趋势分析
- **API 配置面板重构** - 一键读取模型，多 Provider 支持
- **快捷键系统** - 18+ 快捷键，提升操作效率
- **参数预设管理** - 算法参数预设保存与分享
- **地图库功能** - 地图导入导出、场景模板、收藏功能
- **路径回放控制** - 播放/暂停、速度调节、单步控制

#### Architecture & Code | 架构与代码
- **自定义 Hooks** - usePlanner, useChat, useWorkspace, useTheme, useKeyboardShortcuts
- **CSS 模块化** - 拆分为 theme/base/layout/components/canvas/modal/utilities
- **国际化** - i18next 中英文双语支持
- **错误边界** - ErrorBoundary 组件捕获渲染错误
- **统一 API 服务** - api.js 统一封装请求和错误处理

#### Security | 安全性
- **安全响应头** - 8 种安全响应头 (CSP, X-Frame-Options 等)
- **SSRF 防护** - 阻止内网地址的 URL 输入
- **API 限流** - 按端点配置限流 (chat: 20/min, code gen: 10/min)
- **输入验证** - Pydantic v2 严格模式验证
- **敏感信息脱敏** - API Key 不持久化，返回 has_api_key

#### Performance | 性能
- **后端响应压缩** - Gzip 中间件
- **后端缓存层** - 内存缓存 + ETag 支持
- **前端渲染优化** - React.memo, useMemo, useCallback
- **代码分割** - SimulationCanvas3D 懒加载
- **性能监控** - 前后端性能指标埋点

#### DevOps | 工程化
- **Git Hooks** - pre-commit, pre-push 钩子
- **Docker 容器化** - api, web 双容器部署
- **Makefile** - 17 个开发命令
- **ESLint + Prettier** - 代码规范与格式化
- **Vitest + pytest** - 前后端单元测试

### Changed | 更改
- 重构 App.jsx 巨型组件，拆分为多个自定义 Hooks
- 统一 UI 组件风格，新增 ui.jsx 基础组件
- 优化左侧控制面板布局，扩展宽度至 280px
- 改进场景选择布局，改为 2 列网格显示
- 移除 HCFA 算法，保留 4 种核心算法 (A*, D* Lite, RRT*, ACO)

### Fixed | 修复
- 修复语言切换时字体大小不一致问题
- 修复 React Hook 调用错误 (Invalid hook call)
- 修复 HostValidationMiddleware 阻止测试请求问题
- 修复限流测试中首次请求消耗计数问题

## [1.0.0] - 2026-05-17 | 发布版本

### Added | 新增

#### Core Features | 核心功能
- **D* Lite Algorithm** - Real-time dynamic path replanning | 实时动态路径重规划
- **RRT* Algorithm** - Optimal probabilistic path planning | 最优概率路径规划
- **ACO Algorithm** - Ant Colony Optimization | 蚁群优化算法
- **A* Algorithm** - Classic optimal path planning | 经典最优路径规划

#### User Interface | 用户界面
- **Modern Web Interface** - Golden Time 极简设计风格
- **Real-time Visualization** - Watch path planning in action | 实时可视化
- **2D/3D Views** - 支持 2D 和 3D 视图切换
- **Dark/Light Mode** - Theme switching support | 深色/浅色主题
- **Responsive Design** - Works on all devices | 响应式设计
- **Dynamic Obstacles** - Moving obstacle avoidance | 动态障碍物避障

#### AI Integration | AI集成
- **AI Assistant** - Chat with AI for help | AI对话助手
- **Code Generation** - Generate algorithm code | 代码生成
- **Code Optimization** - AI-powered code optimization | AI代码优化
- **Algorithm Comparison** - Compare multiple algorithms | 算法对比
- **Multi-Provider Support** - OpenAI, DeepSeek, Custom APIs | 多API支持

#### Statistics & Metrics | 统计与指标
- **Path Length** - Track total path distance | 路径长度
- **Execution Time** - Measure algorithm performance | 执行时间
- **Nodes Explored** - Count explored grid cells | 探索节点
- **Replanning Count** - Track dynamic replanning events | 重规划次数
