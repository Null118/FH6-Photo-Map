# FH6 Photo Map

基于 Next.js App Router、Prisma 和 PostgreSQL 的 FH6 摄影地图原型。首页使用静态底图 `FH_6.jpg`，支持拖拽、滚轮缩放、地图原位打点、多图上传和管理员发布管理。

## 技术栈

- TypeScript
- Next.js 16
- React 19
- Prisma
- PostgreSQL
- Supabase Storage / 本地图片上传回退

## 环境要求

- Node.js 24+
- npm 10+

## 初始化

1. 安装依赖：`npm install`
2. 复制 `.env.example` 为 `.env`，填写 `DATABASE_URL` 和 `AUTH_SECRET`
3. 创建数据库并执行迁移：`npm run db:migrate:dev -- --name init`
4. 写入示例数据：`npm run seed`
5. 启动开发环境：`npm run dev`

## 常用命令

- `npm run dev`
- `npm run lint`
- `npm run test:run`
- `npm run build`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:migrate:dev -- --name init`

## 目录说明

- `src/app`：页面与 Server Actions
- `src/components`：地图、表单、管理组件
- `src/lib`：数据库、上传、校验与地图工具
- `prisma/schema.prisma`：数据模型
- `public/maps`：地图底图
- `public/uploads`：本地开发上传回退和演示图片

## Vercel + Supabase 部署

推荐的公网上线组合是 Vercel 托管 Next.js，Supabase 提供 PostgreSQL 和 Storage。

### Supabase

1. 创建 Supabase 项目。
2. 在 Project Settings / Database 里复制 PostgreSQL 连接串，作为 `DATABASE_URL`。
3. 在 Storage 里创建公开 bucket，例如 `fh6-photos`。
4. 在 Project Settings / API 里复制 Project URL 和 service role key。
5. 设置环境变量：
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET=fh6-photos`
   - `SUPABASE_STORAGE_PUBLIC_URL=https://<project-ref>.supabase.co/storage/v1/object/public/fh6-photos`

### Vercel

1. 在 Vercel 导入 GitHub 仓库。
2. 配置环境变量：
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET`
   - `SUPABASE_STORAGE_PUBLIC_URL`
3. 首次部署前，在本地或 CI 中对生产数据库执行迁移：`npm run db:migrate`。
4. 如需初始化账号和示例数据，运行：`npm run seed`。

`AUTH_SECRET` 生产环境必须显式配置。可以使用 `openssl rand -base64 32` 生成随机值。

如果没有配置 Supabase Storage，上传会回退到本地 `public/uploads`。这个模式只适合本地开发，不适合 Vercel 等无持久磁盘的生产部署。

## 当前版本能力

- 首页地图拖拽与滚轮缩放
- 首页“添加标点”进入原位打点模式
- 仅快速单击地图空白区域时新增标点
- 标点后进入地点创建页，支持多张照片与固定/自定义拍摄参数
- 地点详情页展示照片与参数
- 管理中心查看、发布、删除地点
