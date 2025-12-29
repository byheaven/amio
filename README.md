# AMIO - AI为爱定制

> 玩游戏，赢周边

一个偶像主题的 3-Tiles 消除游戏平台。

## 🎮 功能特性

- **3-Tiles 消除玩法**: 点击选中图块，凑齐3个相同图块自动消除
- **每日关卡**: 每天一关，全平台用户共享相同布局
- **游戏道具**: 撤回、洗牌、Pop堆叠
- **宝箱奖励**: 通关获得宝箱，次日解锁领取
- **宝箱等级**: 根据挑战次数和道具使用评定等级

## 🛠 技术栈

- **框架**: Taro 4.x (React)
- **语言**: TypeScript
- **样式**: SCSS
- **目标平台**: H5, 微信小程序, 抖音小程序

## 🚀 快速开始

```bash
# 安装依赖
cd amio-app
npm install

# 启动 H5 开发服务器
npm run dev:h5

# 构建微信小程序
npm run build:weapp

# 构建 H5
npm run build:h5
```

## 📁 项目结构

```
amio/
├── amio-app/                # Taro 应用
│   ├── src/
│   │   ├── components/      # 组件
│   │   │   ├── Board/       # 游戏面板
│   │   │   ├── Tile/        # 方块
│   │   │   ├── Slot/        # 收集槽
│   │   │   ├── TempSlot/    # 临时槽（Pop）
│   │   │   ├── ToolBar/     # 工具栏
│   │   │   └── ChestModal/  # 宝箱弹窗
│   │   ├── pages/           # 页面
│   │   │   ├── home/        # 首页
│   │   │   └── game/        # 游戏页
│   │   ├── utils/           # 工具函数
│   │   │   ├── gameLogic.ts # 游戏逻辑
│   │   │   ├── dailyLevel.ts# 每日关卡
│   │   │   └── toolsLogic.ts# 道具逻辑
│   │   └── constants/       # 常量
│   └── config/              # Taro 配置
└── docs/                    # 文档
    └── AMIO_MVP_PRD_V3.md   # 产品需求文档
```

## 📝 开发进度

- [x] Phase 1: 游戏核心循环
- [x] Phase 2: 视觉效果 & 道具系统
- [x] Phase 3: 每日关卡 & 宝箱奖励
- [ ] Phase 4: 宝箱等级系统

## 📜 License

MIT
