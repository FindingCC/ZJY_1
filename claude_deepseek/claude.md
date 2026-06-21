# 项目名称

## 项目概述
我是变电施工项目经理，创建一个辅助我日常工作推进、在时间节点到来前提醒我准备事项、帮我生成所需报审资料的程序

## 技术栈
- 前端：Next.js 14 + TypeScript + Tailwind CSS
- 后端：Next.js API Routes
- 数据库：Prisma + SQLite
- 部署：Vercel

## 项目结构
​```
src/
├── app/         # Next.js App Router 页面
│   ├── api/      # API 路由
│   ├── layout.tsx # 全局布局
│   └── page.tsx   # 首页
├── components/   # React 组件
│   ├── ui/      # 通用UI组件
│   └── features/  # 业务组件
├── lib/         # 工具函数和配置
├── prisma/      # 数据库 schema 和迁移
└── types/       # TypeScript 类型定义
​```

## 编码规范
- 使用函数式组件 + React Hooks
- 组件文件使用 PascalCase 命名（如 BookmarkCard.tsx）
- 工具函数使用 camelCase 命名
- API 路由返回统一格式：{ success: boolean, data?: any, error?: string }
- 所有数据库操作通过 Prisma Client 执行

## 当前开发状态
-  基础功能已开发，种子数据已填充，可本地运行

## 注意事项
- SQLite 数据库文件在 prisma/dev.db，不要提交到 Git
- 环境变量在 .env 文件中，不要提交到 Git
- 所有新功能先创建 Git 分支再开发

## 核心红线规则
1. 绝对禁止删除、移动、修改用户的原始照片和扫描件，仅可复制副本进行归档
2. 界面按钮、字体优先放大设计，适配非技术人员操作

## 功能优先级
1. 施工节点管理 + 多级到期提醒 + 前置准备清单 ✅
2. 照片/扫描件按节点时间自动分类归档 ✅
3. PC端 + 手机端数据同步 ⬅️ 进行中
4. 进度款申请表生成 + 附件自动打包 + 收款台账

## 归档规范
1. 文件夹按「序号-节点名称」命名，按施工顺序排序
2. 每个节点下分「现场照片、资料扫描件、报验文件」三个子文件夹
3. 无法匹配的文件统一放入「待人工确认」文件夹