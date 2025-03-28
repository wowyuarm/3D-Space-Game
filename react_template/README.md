# 3D太空探索游戏

一个基于React、Vite和Three.js开发的3D太空探索游戏，玩家可以驾驶飞船探索浩瀚宇宙，发现各种行星，收集资源并升级飞船。

![游戏截图](public/screenshot.png)

## 功能特点

- **沉浸式3D体验**：完全基于Three.js的3D宇宙环境
- **自由探索**：开放式游戏世界，允许自由探索不同星系和行星
- **多样化星球**：包含岩石、冰冻、气态、熔岩、荒漠、有机等多种类型行星
- **资源收集**：从行星上收集各种资源，用于升级和解锁新功能
- **飞船升级**：使用收集的资源增强飞船性能
- **动态视听效果**：沉浸式音频和视觉效果
- **教程系统**：新手引导教程帮助玩家快速上手

## 项目结构

```
├── src/
│   ├── engine/           # 游戏引擎核心
│   │   ├── GameEngine.js   # 主游戏引擎
│   │   ├── Renderer.js     # 渲染器
│   │   ├── AudioManager.js # 音频管理
│   │   └── PhysicsEngine.js # 物理引擎
│   ├── game/             # 游戏逻辑
│   │   ├── GameState.js    # 游戏状态管理
│   │   ├── Player.js       # 玩家管理
│   │   ├── Spaceship.js    # 飞船管理
│   │   ├── PlanetGenerator.js # 行星生成器
│   │   └── ResourceCollector.js # 资源收集器
│   ├── ui/               # 用户界面
│   │   ├── screens/        # 界面屏幕
│   │   ├── components/     # UI组件
│   │   └── styles/         # 样式文件
│   ├── universe/         # 宇宙系统
│   ├── utils/            # 工具函数
│   ├── App.jsx           # 主应用组件
│   ├── main.jsx          # 入口文件
│   └── index.css         # 全局样式
├── public/               # 静态资源
│   └── assets/           # 游戏资源
│       ├── audio/          # 音频文件
│       └── textures/       # 纹理文件
├── index.html            # HTML模板
├── vite.config.js        # Vite配置
└── package.json          # 项目依赖
```

## 游戏控制

- **W/S** - 前进/后退
- **A/D** - 左转/右转
- **Q/E** - 左滚/右滚
- **方向键** - 俯仰/偏航
- **Shift** - 加速
- **空格键** - 减速/刹车
- **E键** - 与行星交互/收集资源
- **Tab键** - 打开星图
- **ESC** - 暂停/菜单
- **H键** - 显示控制帮助

## 开发指南

### 环境要求

- Node.js 16+
- npm 或 yarn 或 pnpm

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/3DSpaceGame.git
cd 3DSpaceGame/react_template

# 安装依赖
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发

```bash
# 启动开发服务器
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

浏览器会自动打开 `http://localhost:5173/`

### 构建

```bash
# 构建生产版本
npm run build
# 或
yarn build
# 或
pnpm build
```

构建后的文件会输出到 `dist` 目录。

## 部署到Vercel

此项目已配置好在Vercel上部署：

1. 在Vercel上创建一个账户（如果还没有）
2. 导入你的GitHub仓库
3. 保持默认设置（Vercel会自动检测Vite项目）：
   - **Build Command**: `npm run build` 或 `yarn build` 或 `pnpm build`
   - **Output Directory**: `dist`
   - **Installation Command**: `npm install` 或 `yarn install` 或 `pnpm install`
4. 点击"Deploy"按钮

### 环境变量（可选）

如果需要配置环境变量，可以在Vercel的项目设置中添加。

## 技术栈

- **React 18** - UI库
- **Vite** - 构建工具
- **Three.js** - 3D渲染引擎
- **React Three Fiber** - React的Three.js封装
- **Howler.js** - 音频库

## 许可证

[MIT](LICENSE)

## 贡献指南

欢迎提交Pull Request或Issue！

1. Fork仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request
