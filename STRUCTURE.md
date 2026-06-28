# 项目结构

```
genshin-ts-element_odyssey/
├── src/                          # 源码
│   ├── main.ts                   #   入口，import 所有 graph 文件以触发注册
│   ├── config/                   #   配置数据
│   │   ├── battleStageConfig.ts  #     9 关声明式配置 + deriveConfig
│   │   ├── constants.ts          #     所有游戏常量
│   │   ├── ruleText.ts           #     游戏规则文本
│   │   └── spawnSlots.ts         #     敌人固定生成槽位
│   ├── graphs/                   #   节点图定义（6 个文件）
│   │   ├── stageMain.ts          #     关卡主控制（id=1073741854）
│   │   ├── playerMain.ts         #     玩家交互/UI（id=1073741837）
│   │   ├── elementAttack.ts      #     元素攻击命中（id=1073741853）
│   │   ├── enemyElementAttack.ts #     敌方元素攻击命中（id=1073741855）
│   │   ├── getOrb.ts             #     元素球碰撞处理（id=1073741829）
│   │   └── scanTagReady.ts       #     场景就绪判定（id=1073741856）
│   ├── graph-variables/          #   节点图变量声明
│   ├── systems/                  #   业务逻辑系统（5 个文件）
│   │   ├── stageFlow.ts          #     关卡生命周期/计时器/死锁检测
│   │   ├── cardSystem.ts         #     道具映射 + 卡牌选择器
│   │   ├── elementSystem.ts      #     元素攻击/反应/增益效果
│   │   ├── enemySystem.ts        #     刷怪/清除/计分/防掉落
│   │   └── orbSystem.ts          #     元素球生成/随机池/深渊球
│   ├── types/                    #   类型定义
│   │   └── config.ts             #     StageConfig + deriveConfig
│   ├── utils/                    #   工具函数（3 个文件）
│   │   ├── stageUtils.ts         #     安全列表取值 + 消息通知
│   │   ├── enemyPrefabs.ts       #     敌人名称→prefabId 映射
│   │   └── logger.ts             #     调试日志封装
│   └── resources/                #   编译器自动生成（勿手动编辑）
│       ├── prefabs.ts            #     预制体ID常量
│       └── signals.ts            #     信号 enum 定义
├── dist/                         # 编译输出（自动生成）
├── gsts.config.ts                # gsts 编译配置
├── package.json
├── tsconfig.json
├── eslint.config.mjs             # ESLint 配置
├── .prettierrc.js                # Prettier 配置
├── .editorconfig                 # 编辑器配置
├── NOTES.md                      # 已解决问题/gsts 约束/维护笔记
├── UPDATE.md                     # 版本更新对比文档
├── GAMEPLAY.md                   # 玩法介绍
├── README.md                     # 用户指南
├── AGENTS.md                     # AI 协作准则
├── CLAUDE.md                     # AI 规则
└── STRUCTURE.md                  # 本文件
```
