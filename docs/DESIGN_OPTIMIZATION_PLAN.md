# AMIO 前端设计优化计划

## 设计方向

**美学风格**: 精致idol风 - 柔和梦幻、高级收藏品质感、应援文化氛围
**配色方案**: 鲨鱼主题色 - 深海蓝 + 银灰 + 珊瑚橙点缀
**核心特性**: 玻璃拟态效果、微光动画、高级卡片质感

---

## 实现步骤

### Phase 1: 设计基础系统

#### 1.1 创建设计令牌 (app.scss)

在 `amio-app/src/app.scss` 中添加 CSS 变量:

```scss
:root {
  // 鲨鱼主题色板
  --color-ocean-900: #0d2137;  // 最深 - 背景
  --color-ocean-700: #234876;  // 主要元素
  --color-ocean-500: #3182ce;  // 强调元素
  --color-ocean-300: #63b3ed;  // 浅色强调
  --color-ocean-100: #bee3f8;  // 最浅

  // 银灰色
  --color-silver-700: #4a5568;
  --color-silver-300: #e2e8f0;
  --color-silver-100: #f7fafc;

  // 珊瑚点缀色
  --color-coral-500: #f56565;
  --color-coral-300: #feb2b2;

  // 特效
  --color-aqua-glow: rgba(99, 179, 237, 0.4);
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-blur: blur(12px);

  // 字体
  --font-display: 'ZCOOL KuaiLe', 'Noto Sans SC', system-ui;
  --font-body: 'Noto Sans SC', system-ui, sans-serif;

  // 圆角 & 阴影
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --shadow-premium: 0 4px 20px rgba(0,0,0,0.1), 0 0 40px var(--color-aqua-glow);
}
```

#### 1.2 添加通用 SCSS Mixins

```scss
@mixin glass-effect() {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

@mixin premium-card() {
  background: linear-gradient(145deg, rgba(255,255,255,0.95), rgba(247,250,252,0.9));
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: var(--shadow-premium);
  border-radius: var(--radius-lg);
}

@mixin shimmer-effect() {
  &::after {
    content: '';
    position: absolute;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    animation: shimmer 3s infinite;
  }
}
```

---

### Phase 2: 核心游戏组件

#### 2.1 Tile 组件 (components/Tile/Tile.scss)

- **高级卡片外观**: 渐变背景 + 内部高光层 + 精致边框
- **交互动画**: 点击弹性动画、悬停发光效果
- **层次感**: 底部边框产生3D立体效果

关键改动:
```scss
.tile {
  background: linear-gradient(165deg, rgba(255,255,255,0.98), rgba(237,242,247,0.92));
  border-radius: var(--radius-md);
  border-bottom: 3px solid var(--color-silver-300);

  // 内部高光
  &::before {
    background: linear-gradient(180deg, rgba(255,255,255,0.6), transparent);
  }

  // 悬停发光
  &:not(.disabled):hover {
    box-shadow: 0 6px 16px rgba(0,0,0,0.15), 0 0 20px var(--color-aqua-glow);
  }
}
```

#### 2.2 Board 组件 (components/Board/Board.scss)

- **玻璃容器效果**: 半透明 + 模糊背景
- **装饰性角标**: 海洋主题边角装饰
- **渐变叠加层**: 增加深度感

#### 2.3 Slot 组件 (components/Slot/Slot.scss)

- **玻璃拟态**: 毛玻璃效果底栏
- **状态指示**: 有牌时脉冲动画，即将满时警告色
- **精致分割线**: 渐变式分隔符

#### 2.4 TempSlot 组件 (components/TempSlot/TempSlot.scss)

- **珊瑚色点缀**: 虚线边框使用珊瑚色
- **玻璃背景**: 与整体风格统一

#### 2.5 ToolBar 组件

**SCSS改动** (components/ToolBar/ToolBar.scss):
- 玻璃按钮效果
- 海洋蓝边框
- 禁用态灰色处理

**TSX改动** (components/ToolBar/ToolBar.tsx):
- 将 emoji (↩️ 📤 🔀) 替换为 SVG 图标
- 添加图标组件或内联 SVG

---

### Phase 3: 弹窗系统

#### 3.1 ChestModal (components/ChestModal/ChestModal.scss)

- **海洋主题遮罩**: 深蓝渐变背景
- **高级卡片弹窗**: 带微光效果的白色卡片
- **宝箱发光动画**: 根据等级显示不同颜色光晕
- **胜利文字动画**: 渐变闪光效果

#### 3.2 StoryModal (components/StoryModal/StoryModal.scss)

- 调整颜色为鲨鱼主题蓝
- 边框使用 ocean-300 颜色
- 按钮改为海洋蓝渐变

#### 3.3 ChestRewardModal (components/ChestRewardModal/index.scss)

- 海洋主题渐变背景
- 奖励项发光边框效果

---

### Phase 4: 页面布局

#### 4.1 Home 页面 (pages/home/index.scss)

- **背景**: 海洋渐变 (ocean-100 → ocean-300)
- **头部区域**: 大标题 + 波光效果
- **宝箱卡片**: 高级卡片样式
- **连续签到**: 里程碑可视化优化
- **开始按钮**: 发光CTA按钮

#### 4.2 Game 页面 (pages/game/index.scss)

- **普通模式**: 柔和海洋渐变背景
- **英雄模式**: 深海暗色主题
- **头部**: 玻璃效果状态栏
- **失败弹窗**: 高级卡片样式

#### 4.3 Intro 页面 (pages/intro/index.scss)

- 深海背景主题统一

---

### Phase 5: 动画增强

在 app.scss 中添加全局关键帧:

```scss
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px var(--color-aqua-glow); }
  50% { box-shadow: 0 0 40px var(--color-aqua-glow); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes celebrate {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.1) rotate(3deg); }
}
```

---

## 需要修改的文件清单

| 文件路径 | 改动类型 |
|---------|---------|
| `src/app.scss` | 新增设计令牌和全局样式 |
| `src/components/Tile/Tile.scss` | 完全重写样式 |
| `src/components/Board/Board.scss` | 升级容器效果 |
| `src/components/Slot/Slot.scss` | 玻璃效果 + 状态动画 |
| `src/components/TempSlot/TempSlot.scss` | 主题色调整 |
| `src/components/ToolBar/ToolBar.scss` | 玻璃按钮样式 |
| `src/components/ToolBar/ToolBar.tsx` | emoji → SVG 图标 |
| `src/components/ChestModal/ChestModal.scss` | 海洋主题重设计 |
| `src/components/StoryModal/StoryModal.scss` | 色彩调整 |
| `src/components/ChestRewardModal/index.scss` | 主题统一 |
| `src/pages/home/index.scss` | 完整视觉升级 |
| `src/pages/game/index.scss` | 背景 + 头部优化 |
| `src/pages/intro/index.scss` | 主题统一 |

---

## 验证方案

1. **H5 开发服务器测试**
   ```bash
   cd amio-app && npm run dev:h5
   ```
   - 访问 localhost:10086 检查所有页面
   - 验证动画流畅性
   - 测试响应式布局

2. **功能完整性**
   - 完成一局游戏流程
   - 检查宝箱弹窗显示
   - 验证故事模态框动画

3. **跨平台兼容性**
   - 运行 `npm run build:weapp` 检查微信小程序编译
   - 验证 backdrop-filter 降级处理

---

## 技术注意事项

- 使用大写 `PX` 绕过 Taro 的 postcss-pxtransform
- 为 backdrop-filter 添加 `-webkit-` 前缀
- 微信小程序不支持部分 CSS 特效，需提供降级方案
- 动画使用 transform/opacity 保证 GPU 加速
