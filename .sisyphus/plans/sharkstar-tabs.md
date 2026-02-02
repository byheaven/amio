# SharkStar 三Tab架构开发计划

## TL;DR

> **Quick Summary**: 将现有单页Home改造为三Tab导航架构（星光/星海/星轨），使用Taro原生tabBar实现。
> 
> **Deliverables**: 
> - TabBar基础框架（3个Tab页面可切换）
> - 星光Tab（保留现有游戏入口功能）
> - 星海Tab（MVP：静态展示）
> - 星轨Tab（MVP：静态展示）
> - 导航逻辑更新（intro→星光，游戏→星光）
> 
> **Estimated Effort**: Medium（3-4天）
> **Parallel Execution**: NO - 必须按Phase顺序执行
> **Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4

---

## Context

### Original Request
基于 `SharkStar_WorldView_PRD.md` 和 `SharkStar_UI_Layout.md`，将AMIO游戏从单页架构升级为三Tab架构：
- **星光 Tab**: 游戏主入口、宝箱、每日任务
- **星海 Tab**: 社区动态、星球状态、排行
- **星轨 Tab**: 个人身份、贡献数据、成就记录

### Interview Summary
**Key Discussions**:
- 用户要求"先简单"，采用简化方案
- 使用Taro原生tabBar而非自定义组件
- MVP阶段使用mock数据，不依赖后端
- 保持现有localStorage状态管理模式

**Simplified Strategy Confirmed**:
1. ✅ Taro原生tabBar（配置简单）
2. ✅ Phase 1先跑通框架，内容用占位符
3. ✅ Mock数据策略
4. ✅ 保持localStorage，不引入全局状态管理

### Metis Review (CRITICAL Technical Findings)
**Identified Gaps** (addressed in this plan):
- **Navigation API限制**: Tab页面必须使用 `Taro.switchTab`，不能用 `navigateTo`/`redirectTo`
- **入口点处理**: intro页面保持非tab状态，完成后用 `switchTab` 跳转到星光Tab
- **页面生命周期**: Tab页面切换时不unmount，`useDidShow`仍然有效
- **必须修改的文件**: `intro.tsx:42` 和 `game/index.tsx:166` 需要更新导航方式
- **Icon资源**: tabBar需要 `iconPath` 和 `selectedIconPath`（MVP可用emoji占位）

---

## Work Objectives

### Core Objective
建立三Tab导航架构，让星光Tab继承现有Home功能，星海和星轨Tab有基本展示功能。

### Concrete Deliverables
- `pages/starlight/index.tsx` - 星光Tab页面（功能完整）
- `pages/starrysea/index.tsx` - 星海Tab页面（MVP）
- `pages/startrail/index.tsx` - 星轨Tab页面（MVP）
- 更新的 `app.config.ts`（包含tabBar配置）
- 更新的导航逻辑（intro.tsx, game.tsx）
- TabBar icon占位资源（或使用emoji方案）

### Definition of Done
- [ ] 三Tab可正常切换
- [ ] 星光Tab包含现有游戏功能（可进入游戏并返回）
- [ ] 星海Tab展示mock社区数据
- [ ] 星轨Tab展示mock个人数据
- [ ] 导航流程完整：intro→星光→游戏→星光

### Must Have
- Taro原生tabBar配置
- 三个Tab页面文件
- 更新的导航逻辑（使用switchTab）
- 星光Tab保留现有功能

### Must NOT Have (Guardrails from Metis)
- ❌ 不添加全局状态管理（Redux/Zustand）
- ❌ 不添加认证/登录功能
- ❌ Tab之间不共享组件（各Tab独立MVP）
- ❌ 不添加复杂动画（仅基础tab切换）
- ❌ 不修改游戏逻辑或宝箱系统
- ❌ 不添加API调用或后端集成

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES（Taro内置tabBar）
- **User wants tests**: NO（简化方案，手动验证）
- **Framework**: 不适用

### Manual Verification Procedures

**Phase 1验证**:
```bash
# 1. 启动H5开发服务器
npm run dev:h5

# 2. 访问 http://localhost:10086

# 3. 验证TabBar显示
# 预期: 页面底部显示三个Tab：星光、星海、星轨

# 4. 验证Tab切换
# 操作: 点击"星海"Tab
# 预期: 页面切换到星海Tab，URL变化

# 5. 验证intro流程
# 操作: 清除localStorage，刷新页面，完成intro
# 预期: 自动跳转到星光Tab（不是home）
```

**Phase 2-4验证**:
```bash
# 星光Tab功能验证
# 操作: 点击"点亮"按钮
# 预期: 进入游戏页面，游戏正常进行

# 游戏返回验证
# 操作: 完成游戏或返回
# 预期: 返回到星光Tab（不是intro）
```

---

## Execution Strategy

### Phase Structure

```
Phase 1 (Foundation - REQUIRED FIRST):
├── Task 1: Create starlight page (from existing home)
├── Task 2: Create starrysea page (shell)
├── Task 3: Create startrail page (shell)
├── Task 4: Configure tabBar in app.config.ts
└── Task 5: Update navigation logic

Phase 2 (Starlight - DEPENDS ON Phase 1):
├── Task 6: Migrate home content to starlight
├── Task 7: Update game navigation
└── Task 8: Add planet placeholder visual

Phase 3 (StarrySea - DEPENDS ON Phase 1):
└── Task 9: Build MVP starrysea with mock data

Phase 4 (StarTrail - DEPENDS ON Phase 1):
└── Task 10: Build MVP startrail with mock data

Phase 5 (Cleanup):
└── Task 11: Remove legacy home page
```

### Critical Path
**Task 1 → Task 4 → Task 5 → Task 6 → Task 7**

Phase 1必须先完成，Phase 2/3/4可以并行，但建议按顺序以确保质量。

---

## TODOs

### Phase 1: Tab架构搭建

- [ ] **1. Create starlight page from existing home**

  **What to do**:
  - 复制 `pages/home/` 目录为 `pages/starlight/`
  - 更新内部组件引用路径
  - 测试页面能正常渲染

  **Must NOT do**:
  - 不修改任何功能逻辑（只是复制）
  - 不删除原home目录（Phase 5再做）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `git-master`
  - Reason: 简单文件复制和路径更新

  **Parallelization**:
  - **Can Run In Parallel**: NO (必须先完成)
  - **Blocked By**: None
  - **Blocks**: Tasks 2, 3, 4, 5, 6

  **References**:
  - `pages/home/index.tsx` - 现有页面内容
  - `pages/home/index.scss` - 现有样式

  **Acceptance Criteria**:
  - [ ] `pages/starlight/index.tsx` 存在且可编译
  - [ ] 页面能在浏览器中打开
  - [ ] 无路径引用错误

---

- [ ] **2. Create starrysea page (shell)**

  **What to do**:
  - 创建 `pages/starrysea/index.tsx`
  - 创建 `pages/starrysea/index.scss`
  - 页面内容：简单的占位布局，显示"星海"标题

  **Must NOT do**:
  - 不实现完整功能（Phase 3再做）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: 简单空壳页面创建

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 3)
  - **Blocked By**: None
  - **Blocks**: Task 4

  **References**:
  - `pages/home/index.tsx` - 页面结构参考

  **Acceptance Criteria**:
  - [ ] `pages/starrysea/index.tsx` 存在
  - [ ] 页面显示"星海"文字
  - [ ] 页面背景符合主题风格（深蓝渐变）

---

- [ ] **3. Create startrail page (shell)**

  **What to do**:
  - 创建 `pages/startrail/index.tsx`
  - 创建 `pages/startrail/index.scss`
  - 页面内容：简单的占位布局，显示"星轨"标题

  **Must NOT do**:
  - 不实现完整功能（Phase 4再做）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: 简单空壳页面创建

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2)
  - **Blocked By**: None
  - **Blocks**: Task 4

  **References**:
  - `pages/home/index.tsx` - 页面结构参考

  **Acceptance Criteria**:
  - [ ] `pages/startrail/index.tsx` 存在
  - [ ] 页面显示"星轨"文字
  - [ ] 页面背景符合主题风格

---

- [ ] **4. Configure tabBar in app.config.ts**

  **What to do**:
  - 更新 `app.config.ts` 添加 `tabBar` 配置
  - 三个tab：starlight（星光）、starrysea（星海）、startrail（星轨）
  - 配置pagePath指向正确的页面路径
  - **重要**: 更新 `pages` 数组，确保tab页面都在列表中

  **Must NOT do**:
  - 不将intro或game页面加入tabBar

  **CRITICAL Configuration**:
  ```typescript
  {
    pages: [
      'pages/intro/index',      // 保持第一（入口）
      'pages/starlight/index',  // tab页面
      'pages/starrysea/index',  // tab页面
      'pages/startrail/index',  // tab页面
      'pages/game/index'        // 非tab页面
    ],
    tabBar: {
      list: [
        { 
          pagePath: 'pages/starlight/index', 
          text: '星光',
          iconPath: 'assets/tab/starlight.png',      // MVP可用占位图
          selectedIconPath: 'assets/tab/starlight-active.png'
        },
        { 
          pagePath: 'pages/starrysea/index', 
          text: '星海',
          iconPath: 'assets/tab/starrysea.png',
          selectedIconPath: 'assets/tab/starrysea-active.png'
        },
        { 
          pagePath: 'pages/startrail/index', 
          text: '星轨',
          iconPath: 'assets/tab/startrail.png',
          selectedIconPath: 'assets/tab/startrail-active.png'
        }
      ],
      color: '#8B9DC3',
      selectedColor: '#FFD700',
      backgroundColor: '#0A1628',
      borderStyle: 'black'
    }
  }
  ```

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: 配置文件更新

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Tasks 1, 2, 3
  - **Blocks**: Task 5

  **References**:
  - `app.config.ts` - 现有配置
  - Taro文档: tabBar配置规范

  **Acceptance Criteria**:
  - [ ] `app.config.ts` 包含tabBar配置
  - [ ] 三个tab页面都在 `pages` 数组中
  - [ ] tabBar样式符合设计（深色背景+金色选中）
  - [ ] 应用能正常编译启动

---

- [ ] **5. Update navigation logic (CRITICAL)**

  **What to do**:
  - **更新 `pages/intro/index.tsx:42`**:
    ```typescript
    // 从:
    Taro.redirectTo({ url: '/pages/home/index' })
    // 改为:
    Taro.switchTab({ url: '/pages/starlight/index' })
    ```
  
  **暂时不修改game.tsx**（Phase 2 Task 7会处理）

  **Must NOT do**:
  - 不使用 `navigateTo` 或 `redirectTo` 跳转到tab页面

  **CRITICAL Technical Detail** (from Metis):
  - Tab页面**必须**使用 `Taro.switchTab` 导航
  - `navigateTo` 和 `redirectTo` 会导致导航失败

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: 简单的API调用替换

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 4
  - **Blocks**: Phase 2

  **References**:
  - `pages/intro/index.tsx:42` - 需要修改的行
  - Taro文档: switchTab API

  **Acceptance Criteria**:
  - [ ] intro完成后使用 `switchTab` 跳转到星光Tab
  - [ ] 导航成功，URL正确
  - [ ] TabBar在星光Tab页面可见

---

### Phase 2: 星光Tab功能完善

- [ ] **6. Migrate home content to starlight**

  **What to do**:
  - 确保starlight页面包含原home的全部功能
  - 验证所有组件正常工作
  - 验证样式正确

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []
  - Reason: 功能验证和调试

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Phase 1
  - **Blocks**: Task 7

  **Acceptance Criteria**:
  - [ ] 星光Tab显示游戏入口按钮
  - [ ] 星光Tab显示宝箱状态
  - [ ] 星光Tab显示连续天数

---

- [ ] **7. Update game navigation**

  **What to do**:
  - **更新 `pages/game/index.tsx:166`**（游戏完成后的返回）:
    ```typescript
    // 从:
    Taro.reLaunch({ url: '/pages/home/index' })
    // 改为:
    Taro.switchTab({ url: '/pages/starlight/index' })
    ```
  
  - **更新游戏入口按钮的导航**（如需要）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: API调用替换

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 6
  - **Blocks**: Task 8

  **References**:
  - `pages/game/index.tsx:166` - 需要修改的行

  **Acceptance Criteria**:
  - [ ] 游戏完成后返回到星光Tab
  - [ ] 返回后数据正确刷新（useDidShow触发）

---

- [ ] **8. Add planet placeholder visual**

  **What to do**:
  - 在星光Tab添加简单的星球占位图
  - 可用emoji（🌍）或简单SVG
  - 放在页面顶部居中位置

  **Must NOT do**:
  - 不实现随进度变化的动态效果（P2功能）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 视觉设计和布局
  - Reason: 需要简单的视觉呈现

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 7
  - **Blocks**: Phase 3

  **Acceptance Criteria**:
  - [ ] 星光Tab页面顶部有星球视觉元素
  - [ ] 视觉元素符合主题风格（星空、蓝色调）

---

### Phase 3: 星海Tab MVP

- [ ] **9. Build MVP starrysea with mock data**

  **What to do**:
  - 创建星海Tab的MVP版本
  - 包含组件：
    - `PlanetOverviewCard`: 星球全景卡片（mock数据：进度67.3%，在线12,847人）
    - `CommunityFeed`: 3-5条mock社区动态
  - 使用设计文档中的布局参考

  **MVP Mock Data**:
  ```typescript
  const mockPlanetData = {
    progress: 67.3,
    onlineUsers: 12847,
    dailyIncrease: 0.12
  };

  const mockFeed = [
    { id: 1, type: 'official', content: '📢 鲨之星今日突破67%！', likes: 234 },
    { id: 2, type: 'user', username: '鲨鱼小明', content: '今天Hero模式一把过！', likes: 56 },
    { id: 3, type: 'story', content: '📖 星球档案 · 第四章解锁', likes: 189 }
  ];
  ```

  **Must NOT do**:
  - 不实现真实API调用
  - 不实现发帖功能
  - 不实现点赞/评论交互

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 社区feed UI设计
  - Reason: 需要构建社交页面布局

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Phase 4, after Phase 1)
  - **Blocked By**: Phase 1
  - **Blocks**: None

  **References**:
  - `docs/SharkStar_UI_Layout.md:4. 星海 Tab — 详细布局`
  - `components/StoryModal/` - 可复用的卡片样式

  **Acceptance Criteria**:
  - [ ] 星海Tab显示星球全景卡片
  - [ ] 显示mock社区动态列表
  - [ ] 布局符合UI设计文档

---

### Phase 4: 星轨Tab MVP

- [ ] **10. Build MVP startrail with mock data**

  **What to do**:
  - 创建星轨Tab的MVP版本
  - 包含组件：
    - `IdentityCard`: 身份卡片（头像、昵称"鲨鱼小明"、称号"早期开拓者"、登陆优先级5.2%）
    - `EnergyCards`: 能源双卡片（⚡12,450、💡6,230）
    - `StreakDisplay`: 连续13天
  - 使用设计文档中的布局参考

  **MVP Mock Data**:
  ```typescript
  const mockUserData = {
    nickname: '鲨鱼小明',
    title: '早期开拓者',
    landingPriority: 5.2,
    rank: 127,
    powerCore: 12450,
    wisdomCrystal: 6230,
    streakDays: 13
  };
  ```

  **Must NOT do**:
  - 不实现时间轴组件（复杂，P2）
  - 不实现成就墙（P2）
  - 不实现设置功能

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 个人资料页面UI
  - Reason: 需要构建个人数据展示页面

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Phase 3, after Phase 1)
  - **Blocked By**: Phase 1
  - **Blocks**: None

  **References**:
  - `docs/SharkStar_UI_Layout.md:5. 星轨 Tab — 详细布局`
  - `components/ChestModal/` - 可复用的卡片样式

  **Acceptance Criteria**:
  - [ ] 星轨Tab显示身份卡片
  - [ ] 显示能源双卡片
  - [ ] 显示连续天数
  - [ ] 布局符合UI设计文档

---

### Phase 5: 清理

- [ ] **11. Remove legacy home page**

  **What to do**:
  - 删除 `pages/home/` 目录
  - 确认没有遗漏的引用

  **Must NOT do**:
  - 不删除直到Phase 2-4全部验证通过

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: 清理工作

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Phase 2, 3, 4
  - **Blocks**: None

  **Acceptance Criteria**:
  - [ ] `pages/home/` 目录已删除
  - [ ] 应用能正常编译
  - [ ] 所有引用已更新

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1-3 | `feat: create three tab page shells` | pages/starlight/*, pages/starrysea/*, pages/startrail/* | npm run build:h5 |
| 4 | `feat: configure tabBar in app.config.ts` | app.config.ts | npm run dev:h5 |
| 5 | `fix: update intro navigation to use switchTab` | pages/intro/index.tsx | Manual test |
| 7 | `fix: update game return navigation` | pages/game/index.tsx | Manual test |
| 8 | `feat: add planet placeholder to starlight` | pages/starlight/* | Visual check |
| 9 | `feat: build starrysea MVP with mock data` | pages/starrysea/* | Visual check |
| 10 | `feat: build startrail MVP with mock data` | pages/startrail/* | Visual check |
| 11 | `chore: remove legacy home page` | pages/home/ (deleted) | npm run build:h5 |

---

## Success Criteria

### Final Checklist
- [ ] TabBar在三个Tab页面可见
- [ ] Tab切换正常工作
- [ ] intro流程：intro→星光Tab
- [ ] 游戏流程：星光Tab→游戏→星光Tab
- [ ] 星海Tab展示mock社区数据
- [ ] 星轨Tab展示mock个人数据
- [ ] 所有页面符合主题风格
- [ ] 应用能正常编译（无错误）

### Verification Commands
```bash
# 编译检查
cd amio-app && npm run build:h5

# 开发服务器
cd amio-app && npm run dev:h5
```

---

## Risk Mitigation (from Metis Review)

| Risk | Mitigation in Plan |
|------|-------------------|
| Navigation API mismatch | Task 5明确要求使用 `Taro.switchTab` |
| Page lifecycle confusion | 保持 `useDidShow` 模式，已在验收标准中 |
| Entry point conflict | Intro保持非tab，用switchTab跳转到starlight |
| Icon assets missing | MVP可用emoji或简单占位图 |
| H5 vs Mini-Program差异 | 开发后在真机测试 |

---

## Next Steps After Plan

1. Run `/start-work` to begin execution
2. Sisyphus will execute Phase 1 tasks sequentially
3. Each phase completion triggers verification
4. User review after each phase

---

> **文档版本**: V1.0
> 
> **AMIO · Keep Us Human**
