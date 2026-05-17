# Contributing to RouteFlow | 为 RouteFlow 贡献

<div align="center">

**English** | [简体中文](README_Chinese.md)

Thank you for considering contributing to RouteFlow! | 感谢您考虑为 RouteFlow 做出贡献！

</div>

## 🎯 Ways to Contribute | 贡献方式

There are many ways you can contribute to RouteFlow: | 您可以通过以下方式为 RouteFlow 做出贡献：

- 🐛 **Bug Reports** - Report bugs and issues | 报告错误和问题
- 💡 **Feature Requests** - Suggest new features | 提出新功能建议
- 📖 **Documentation** - Improve documentation | 改进文档
- 💻 **Code Contributions** - Submit code changes | 提交代码更改
- 🧪 **Testing** - Help test new features | 帮助测试新功能
- 🌐 **Translations** - Help translate the interface | 帮助翻译界面

## 🚀 Getting Started | 开始

### Prerequisites | 前置条件

- Git installed on your system | 在您的系统上安装Git
- Node.js (for frontend development) | Node.js（用于前端开发）
- Python 3.8+ (for backend development) | Python 3.8+（用于后端开发）

### Setup | 设置

1. **Fork the repository** | Fork 仓库

```bash
# Click the "Fork" button on GitHub
# Or use the command line:
gh repo fork your-username/routeflow
```

2. **Clone your fork** | 克隆你的 fork

```bash
git clone https://github.com/your-username/routeflow.git
cd routeflow
```

3. **Add upstream remote** | 添加上游远程仓库

```bash
git remote add upstream https://github.com/your-username/routeflow.git
```

4. **Create a feature branch** | 创建特性分支

```bash
git checkout -b feature/your-feature-name
# Or for bug fixes:
git checkout -b fix/your-bug-fix
```

## 📝 Development Workflow | 开发工作流程

### 1. Keep your fork updated | 保持 fork 更新

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### 2. Make your changes | 进行更改

```bash
# Make your changes here
# Make sure to test your changes!
```

### 3. Commit your changes | 提交更改

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification: | 我们遵循规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types** | 类型：

- `feat` - New feature | 新功能
- `fix` - Bug fix | 错误修复
- `docs` - Documentation changes | 文档更改
- `style` - Code style changes | 代码样式更改
- `refactor` - Code refactoring | 代码重构
- `test` - Adding or updating tests | 添加或更新测试
- `chore` - Maintenance tasks | 维护任务

**Examples** | 示例：

```bash
git commit -m "feat(ui): add dark mode toggle"
git commit -m "fix(algorithm): correct RRT* path calculation"
git commit -m "docs: update installation guide"
```

### 4. Push your changes | 推送更改

```bash
git push origin feature/your-feature-name
```

### 5. Create a Pull Request | 创建 Pull Request

1. Go to the original repository on GitHub
2. Click the "New Pull Request" button
3. Select your branch
4. Fill in the PR template

## 📋 Pull Request Checklist | Pull Request 检查清单

- [ ] My code follows the project's coding style | 我的代码遵循项目的编码风格
- [ ] I have performed a self-review of my code | 我已经对自己的代码进行了自我审查
- [ ] I have commented my code where necessary | 我已在必要时添加了代码注释
- [ ] I have updated the documentation | 我已更新文档
- [ ] My changes generate no new warnings | 我的更改没有生成新的警告
- [ ] I have added tests that prove my fix is effective | 我已添加了证明我的修复有效的测试
- [ ] New and existing tests pass locally | 新测试和现有测试在本地通过

## 🎨 Code Style | 代码风格

### JavaScript | JavaScript

- Use ES6+ features | 使用 ES6+ 特性
- 2 spaces for indentation | 2个空格缩进
- Use meaningful variable names | 使用有意义的变量名
- Add comments for complex logic | 为复杂逻辑添加注释

### Python | Python

- Follow PEP 8 style guide | 遵循 PEP 8 风格指南
- Use type hints where possible | 尽可能使用类型提示
- Write docstrings for functions | 为函数编写文档字符串

## 🐛 Reporting Bugs | 报告错误

When reporting bugs, please include: | 报告错误时，请包括：

- **Description** - Clear description of the bug | 错误的清晰描述
- **Steps to Reproduce** - How to reproduce the bug | 如何重现错误
- **Expected Behavior** - What you expected to happen | 你期望发生什么
- **Actual Behavior** - What actually happened | 实际发生了什么
- **Screenshots** - If applicable | 如果适用，请提供屏幕截图
- **Environment** - OS, browser, etc. | 环境：操作系统、浏览器等

## 💡 Suggesting Features | 建议功能

When suggesting features, please include: | 建议功能时，请包括：

- **Problem** - What problem does this feature solve? | 这个功能解决了什么问题？
- **Solution** - How would you solve this problem? | 你会如何解决这个问题？
- **Alternatives** - What alternatives have you considered? | 你考虑过哪些替代方案？
- **Additional Context** - Any other context | 任何其他上下文

## 📖 Documentation | 文档

We appreciate documentation contributions! | 我们感谢文档贡献！

- Fix typos or grammatical errors | 修复拼写或语法错误
- Improve existing documentation | 改进现有文档
- Add examples | 添加示例
- Translate documentation | 翻译文档

## 🌐 Translation | 翻译

We welcome translations! | 我们欢迎翻译！

Current languages: | 当前语言：
- English (en)
- 简体中文 (zh)

To add a new language: | 添加新语言：

1. Create a new `README_LANGCODE.md` file
2. Translate the content
3. Add a link in the main README.md
4. Update the language switcher in the web interface

## 📬 Questions? | 有问题？

- Open an issue for discussion | 打开一个问题进行讨论
- Join our community chat | 加入我们的社区聊天

## 📄 License | 许可证

By contributing, you agree that your contributions will be licensed under the MIT License. | 通过贡献，您同意您的贡献将在 MIT 许可证下获得许可。

---

<div align="center">

**Thank you for contributing to RouteFlow!** | **感谢您为 RouteFlow 做出贡献！**

</div>
