# 项目结构

```
genshin-ts-element_odyssey/
├── src/                          # 源码
│   ├── main.ts                   # 入口，注册所有节点图
│   ├── config/                   # 配置数据
│   │   ├── battleStageConfig.ts  #   各阶段难度配置
│   │   └── constants.ts          #   所有游戏常量（元素/图标/卡牌/预制体ID等）
│   ├── graphs/                   # 节点图定义（每个图独立文件）
│   │   ├── stageMain.ts          #   关卡主控制（id=1073741854, 9 handlers）
│   │   ├── elementAttack.ts      #   元素攻击命中（id=1073741853）
│   │   ├── enemyElementAttack.ts #   敌方元素攻击命中（id=1073741855）
│   │   ├── getOrb.ts             #   元素球碰撞处理（id=1073741829）
│   │   └── playerMain.ts         #   玩家主控制（id=1073741837, 3 handlers）
│   ├── graph-variables/          # 节点图变量声明（dict 类型模板等）
│   ├── systems/                  # 业务逻辑系统
│   │   ├── cardSystem.ts         #   卡牌映射 + 卡牌选择器
│   │   ├── elementSystem.ts      #   元素攻击/反应/增益
│   │   ├── enemySystem.ts        #   刷怪/清除/计分
│   │   ├── orbSystem.ts          #   元素球生成/管理
│   │   └── stageFlow.ts          #   阶段生命周期/计时器/初始化轮询
│   ├── utils/                    # 工具函数
│   │   ├── enemyPrefabs.ts       #   敌人预制体常量 + 名称查找
│   │   └── stageUtils.ts         #   通用列表取值工具
│   └── resources/                # 编译器自动生成（勿手动编辑）
│       ├── prefabs.ts            #   预制体ID常量
│       └── signals.ts            #   信号枚举
├── dist/                         # 编译输出（自动生成）
├── gsts.config.ts                # gsts 编译配置
├── package.json
├── tsconfig.json
├── README.md
├── AGENTS.md
├── CLAUDE.md
└── STRUCTURE.md                  # 本文件
```
