# Ancient Architecture Edu

Standalone scaffold for the competition project.

Suggested stack:
- Vite
- React
- TypeScript
- Tailwind CSS
- MediaPipe
- Phaser 3

Folder roles:
- `src/assets` - images, icons, pets, buildings
- `src/components` - shared UI components
- `src/data` - static JSON data
- `src/features` - feature modules
- `src/pages` - page-level views
- `src/styles` - global styles
- `src/types` - shared types
- `src/utils` - helper functions

## Cloudflare Pages 评论功能

省份建筑选择页的评论接口部署在 Cloudflare Pages Functions：

- `functions/api/comments.ts`
- 数据库使用 Cloudflare D1，绑定名必须是 `COMMENTS_DB`
- 初始化 SQL 在 `migrations/0001_comments.sql`

首次部署评论功能时，在 Cloudflare 控制台完成以下步骤：

1. 进入 `Workers & Pages`，打开 `4c-web` Pages 项目。
2. 创建一个 D1 数据库，例如 `4c-web-comments`。
3. 在该 D1 数据库的 Console 中执行 `migrations/0001_comments.sql` 的内容。
4. 回到 Pages 项目设置，进入 `Settings -> Functions -> D1 database bindings`。
5. 添加绑定：变量名填 `COMMENTS_DB`，数据库选择刚创建的 `4c-web-comments`。
6. 重新部署 Pages 项目。

如果还没有绑定 D1，页面会正常打开，但评论列表会显示为空，提交评论会提示评论数据库尚未配置。
