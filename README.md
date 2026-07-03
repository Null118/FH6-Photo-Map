# FH6 Photo Map

基于 Next.js App Router、Prisma 和 SQLite 的 FH6 摄影地图原型。首页使用静态底图 `FH_6.jpg`，支持拖拽、滚轮缩放、地图原位打点、多图上传和管理员发布管理。

## 技术栈

- TypeScript
- Next.js 16
- React 19
- Prisma
- SQLite
- 本地图片上传

## 环境要求

- Node.js 24+
- npm 10+

## 初始化

1. 安装依赖：`npm install`
2. 复制底图到 `public/maps/FH_6.jpg`
3. 创建数据库并执行迁移：`npx prisma migrate dev --name init`
4. 写入示例数据：`npm run seed`
5. 启动开发环境：`npm run dev`

## 常用命令

- `npm run dev`
- `npm run lint`
- `npm run test:run`
- `npm run build`

## 目录说明

- `src/app`：页面与 Server Actions
- `src/components`：地图、表单、管理组件
- `src/lib`：数据库、上传、校验与地图工具
- `prisma/schema.prisma`：数据模型
- `public/maps`：地图底图
- `public/uploads`：本地上传图片

## 当前版本能力

- 首页地图拖拽与滚轮缩放
- 首页“添加标点”进入原位打点模式
- 仅快速单击地图空白区域时新增标点
- 标点后进入地点创建页，支持多张照片与固定/自定义拍摄参数
- 地点详情页展示照片与参数
- 管理中心查看、发布、删除地点
