<p align="center">
  <a href="https://github.com/unibest-tech/unibest">
    <img width="160" src="./src/static/logo.svg">
  </a>
</p>

<h1 align="center">阿米巴经营数据记录与分析平台 · 移动端</h1>

<div align="center">

微信小程序 + H5 双端应用，基于 [unibest](https://github.com/unibest-tech/unibest) 构建

[![node version](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)
![pnpm version](https://img.shields.io/badge/pnpm-%3E%3D7.30-green)
![platform](https://img.shields.io/badge/platform-微信小程序%20%7C%20H5-blue)

</div>

## 项目简介

**阿米巴经营数据记录与分析平台 · 移动端（amoeba_app）** 是「阿米巴经营数据记录与分析平台」的移动版本，服务于已绑定企业的员工，提供经营数据的记录与查询入口。移动端需使用 PC 端创建与维护的企业账号登录，**不存在游客态**——未登录或 token 失效时强制进入登录页，登录后方可使用任何功能页面。

技术栈由 `uniapp` + `Vue3` + `Ts` + `Vite5` + `UnoCss` + `wot-ui` + `z-paging` 构成，基于 `unibest` 框架（最好的 uniapp 开发模板），通过命令行方式构建 **微信小程序** 与 **H5** 两种产物，无需依赖 `HBuilderX`（编辑器推荐 `VSCode`）。

`unibest` 内置了 `约定式路由`、`layout布局`、`请求封装`、`请求拦截`、`登录拦截`、`UnoCSS`、`i18n多语言` 等基础功能，提供了 `代码提示`、`自动格式化`、`统一配置`、`代码片段` 等辅助功能。文档地址：[https://unibest.tech/](https://unibest.tech/)

---

## 平台兼容性

本移动端项目当前产出以下两类产物：

| 微信小程序 | H5  |
| ---------- | --- |
| √          | √   |

> 底层 `unibest` 框架本身支持更多平台（IOS / 安卓 / 各厂商小程序），但本项目一期仅发布微信小程序与 H5。

## ⚙️ 环境

- node>=18
- pnpm>=7.30
- Vue Official>=2.1.10
- TypeScript>=5.0


## &#x1F4C2; 快速开始

执行 `pnpm i` 安装依赖
执行 `pnpm dev:h5` 运行 `H5`
执行 `pnpm dev:mp` 运行 `微信小程序`

## 📦 运行（支持热更新）

- H5 平台： `pnpm dev:h5`, 然后打开 [http://localhost:9000/](http://localhost:9000/)。
- 微信小程序平台：`pnpm dev:mp` 然后打开微信开发者工具，导入本地文件夹，选择本项目的`dist/dev/mp-weixin` 文件。

## 🔗 发布

- H5 平台： `pnpm build:h5`，打包后的文件在 `dist/build/h5`，可以放到 web 服务器（如 nginx）运行。如果最终不是放在根目录，可以在 `manifest.config.ts` 文件的 `h5.router.base` 属性进行修改。
- 微信小程序平台：`pnpm build:mp`, 打包后的文件在 `dist/build/mp-weixin`，然后通过微信开发者工具导入，并点击右上角的"上传"按钮进行上传，提交审核后发布。

