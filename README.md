# Idol Dance

Idol Dance 是一个本地优先的 K-pop 舞蹈收藏与复习记录工具。

当前阶段包含：

- uni-app + Vue 3 + TypeScript 工程骨架
- H5 与小红书小程序构建目标
- 我的舞单页面
- 练舞记录页面
- 共享视觉 Token、页头、底部导航和卡片组件
- 本地持久化的数据 Store
- 添加舞蹈 Bottom Sheet（含新增 Artist、图片上传与重复 Dance 规则）
- 今天复习什么 Bottom Sheet（待复习 Top 3、全部展开、随机旧舞与换一批）
- 固定复习记录与 1 / 3 / 7 / 14 天状态更新
- Artist Detail、Dance 展开详情、复习确认与学习范围编辑

## 本地运行

```bash
npm install
npm run dev:h5
```

## 构建

```bash
npm run build:h5
npm run build:mp-xhs
```

首次运行会写入类型化示例数据，后续修改保存在设备本地。

## 手机安装

项目推送到 `main` 后，GitHub Actions 会自动构建并发布到 GitHub Pages：

```text
https://1am2be.github.io/what-to-dance-today/
```

- iPhone：使用 Safari 打开，点击“分享”→“添加到主屏幕”。
- Android：使用 Chrome 打开，点击浏览器菜单→“安装应用”或“添加到主屏幕”。
- 第一次需要联网打开；资源缓存完成后可离线启动。

练舞数据和上传图片保存在当前手机浏览器本地，不会上传到 GitHub。清除网站数据或卸载后可能无法恢复。
