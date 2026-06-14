<div align="center">

<img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/TipTap-2.27-4A154B?logo=tiptap&logoColor=white" />
<img src="https://img.shields.io/badge/Yjs-13.6-FFD700" />
<img src="https://img.shields.io/badge/Spring_Boot-3.5.8-6DB33F?logo=springboot&logoColor=white" />
<img src="https://img.shields.io/badge/MyBatis-3.0-FF0000" />
<img src="https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/WebSocket-Enabled-00C853" />
<img src="https://img.shields.io/badge/license-MIT-blue" />

</div>

<h1 align="center">📝 DocCollab</h1>
<p align="center"><strong>全栈协同文档管理系统</strong></p>
<p align="center">
  <a href="README_EN.md">
    <img src="https://img.shields.io/badge/English-Read_in_English-blue?logo=markdown&logoColor=white&style=for-the-badge" alt="English" />
  </a>
</p>

<p align="center">
  <a href="#项目介绍">📖 项目介绍</a> •
  <a href="#核心特性">✨ 核心特性</a> •
  <a href="#技术栈">🛠 技术栈</a> •
  <a href="#系统架构">🏗 系统架构</a> •
  <a href="#快速开始">🚀 快速开始</a> •
  <a href="#项目结构">📂 项目结构</a> •
  <a href="#api-概览">🔌 API</a> •
  <a href="#亮点设计">🔥 亮点设计</a>
</p>

---

## 📖 项目介绍

DocCollab 是一个受 Google Docs 和 Notion 启发的**全栈协同文档编辑平台**。它通过 WebSocket 上的 **CRDT 技术**（Yjs）实现**实时多人编辑**、光标同步、富文本格式化、文档共享与细粒度权限控制，以及自动冲突解决。

## ✨ 核心特性

### 🔄 实时协同编辑
- 多人同时编辑，光标实时可见
- 基于 CRDT 的冲突自动解决（Yjs）
- WebSocket 长连接
- 防抖自动保存（2 秒间隔）

### 📝 富文本编辑
- 标题、列表、引用、代码块
- 任务列表（复选框）
- 图片嵌入与上传
- 超链接（Ctrl+点击在新标签页打开）
- 文字下划线、加粗、斜体
- 占位提示文本

### 🔐 认证与授权
- JWT 令牌认证
- 三级角色：所有者 / 编辑者 / 查看者
- AOP 切面驱动权限校验
- 心跳检测跨会话踢出

### 📁 文档管理
- 个人与共享文件树
- 文件夹分类整理
- 右键菜单操作（重命名、删除、分享）
- 文档模板（周报、会议纪要）

### 🖼 文件上传
- 图片上传与预览
- 5 MB 文件大小限制
- 自动嵌入编辑器

### 🎨 界面体验
- Tailwind CSS 响应式设计
- Lucide React 图标库
- 可拖拽调整的侧边栏
- 模态框用户设置

## 🛠 技术栈

### 前端

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 19.2 |
| 构建工具 | Vite | 7.2 |
| 编辑器引擎 | TipTap (ProseMirror) | 2.27 |
| CRDT 同步 | Yjs + y-websocket | 13.6 / 3.0 |
| 样式框架 | Tailwind CSS | 3.4 |
| 图标库 | Lucide React | 0.555 |
| 代码检查 | ESLint | 9.39 |

### 后端

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Spring Boot | 3.5.8 |
| 语言 | Java | 17 |
| ORM | MyBatis + Spring | 3.0.5 |
| 数据库 | MySQL | 8.0 |
| 认证 | JJWT | 0.9.1 |
| 实时通信 | WebSocket (Spring) | — |
| 构建工具 | Maven | 4.0 |
| 代码质量 | JaCoCo + SonarQube | 0.8.13 |

## 🏗 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        浏览器                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  React SPA (Vite)                     │  │
│  │  ┌─────────┐ ┌──────────────┐ ┌───────────────────┐  │  │
│  │  │FileTree │ │ TipTapEditor │ │  Settings/Modals  │  │  │
│  │  │         │ │  (ProseMirror│ │                   │  │  │
│  │  │ 共享    │ │   + Yjs CRDT)│ │  User Profile     │  │  │
│  │  │ 个人    │ │              │ │  Share Dialog     │  │  │
│  │  └─────────┘ └──────┬───────┘ └───────────────────┘  │  │
│  │                     │ WebSocket / HTTP REST           │  │
│  └─────────────────────┼────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────┼────────────────────────────────────┐
│                   Spring Boot 后端                           │
│  ┌─────────────────────┼──────────────────────────────────┐ │
│  │            Controller 层 (REST API)                    │ │
│  │  ┌──────────┐ ┌────────────┐ ┌──────────────────┐     │ │
│  │  │User API  │ │Document API│ │Permission API    │     │ │
│  │  └──────────┘ └────────────┘ └──────────────────┘     │ │
│  └─────────────────────┼──────────────────────────────────┘ │
│                        │                                     │
│  ┌─────────────────────┼──────────────────────────────────┐ │
│  │             Service 层 (业务逻辑)                       │ │
│  │  ┌──────────┐ ┌────────────┐ ┌──────────────────┐     │ │
│  │  │ Auth     │ │ Document   │ │ Permission       │     │ │
│  │  │ JWT      │ │ CRUD       │ │ RBAC             │     │ │
│  │  └──────────┘ └────────────┘ └──────────────────┘     │ │
│  └─────────────────────┼──────────────────────────────────┘ │
│                        │                                     │
│  ┌─────────────────────┼──────────────────────────────────┐ │
│  │             MyBatis Mapper 层                           │ │
│  │  ┌──────────┐ ┌────────────┐ ┌──────────────────┐     │ │
│  │  │User Mapper│ │Doc Mapper  │ │Permission Mapper │     │ │
│  │  └──────────┘ └────────────┘ └──────────────────┘     │ │
│  └─────────────────────┼──────────────────────────────────┘ │
│                        │                                     │
│  ┌─────────────────────┼──────────────────────────────────┐ │
│  │          WebSocket Handler (实时同步)                   │ │
│  │       DocumentSocketHandler — Yjs 协议                  │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────┼────────────────────────────────────┐
│                   MySQL 数据库                              │
│  ┌──────────┐ ┌────────────┐ ┌──────────────────┐          │
│  │  users   │ │ documents  │ │  permissions     │          │
│  └──────────┘ └────────────┘ └──────────────────┘          │
│         ┌───────────────┐   ┌──────────────────┐           │
│         │ document_delta│   │     folders      │           │
│         └───────────────┘   └──────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

```
多人编辑流程:

用户A编辑 ──► Yjs CRDT ──► WebSocket ──► 服务器 ──► 广播给用户B、C
                    ▲                                   │
                    └─────────── 确认 ◄─────────────────┘

自动保存流程:

编辑器变更 ──► 防抖2秒 ──► HTTP POST ──► 后端 ──► MySQL
    │                                                 │
    └────────────── 下次加载时同步 ◄──────────────────┘
```

## 🚀 快速开始

### 环境要求

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js | >= 18 | 前端运行时 |
| npm | >= 9 | 包管理器 |
| Java JDK | 17 | 后端运行时 |
| Maven | >= 3.8 | 后端构建 |
| MySQL | 8.0 | 数据库 |

### 1. 克隆项目

```bash
git clone https://github.com/SaMuel-101-cky/My-Cloud-Document-Interface.git
```

### 2. 数据库配置

创建 MySQL 数据库 `homework`:

```sql
CREATE DATABASE IF NOT EXISTS homework DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

在 `../Backend/src/main/resources/application.yml` 中配置数据库连接:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/homework
    username: root
    password: 你的密码
```

### 3. 启动后端

```bash
cd ../Backend
mvn clean package -DskipTests
mvn spring-boot:run
```

后端启动在 **http://localhost:8080**。

### 4. 启动前端

```bash
cd ../Frontend
npm install
npm run dev
```

前端启动在 **http://localhost:5173**。

### 5. 浏览器访问

打开 [http://localhost:5173](http://localhost:5173) 开始协作文档编辑！

## 📂 项目结构

```
My document/
├── Frontend/                        # React 前端
│   ├── src/
│   │   ├── api/                     # API 服务层
│   │   ├── components/              # 共享组件
│   │   │   ├── ui/                  #   UI 原子组件
│   │   │   ├── FileTree.jsx         #   文件导航树
│   │   │   ├── SettingsModal.jsx    #   设置弹窗
│   │   │   └── TipTapEditor.jsx     #   核心编辑器 ⭐
│   │   ├── constants/               # 常量与模板
│   │   ├── features/                # 功能模块
│   │   │   ├── editor/              #   编辑器扩展
│   │   │   ├── file-tree/           #   文件树功能
│   │   │   ├── home/                #   主页功能
│   │   │   └── settings/            #   设置功能
│   │   ├── pages/                   # 页面组件
│   │   │   ├── AuthPage.jsx         #   登录注册页
│   │   │   └── HomePage.jsx         #   主工作台
│   │   ├── utils/                   # 工具函数
│   │   ├── styles/                  # 全局样式
│   │   └── main.jsx                 # 应用入口
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── eslint.config.js
│
├── Backend/                         # Spring Boot 后端
│   ├── src/main/java/com/example/db_document/
│   │   ├── config/                  # 配置类（CORS, WS, 拦截器）
│   │   ├── controller/              # REST API 控制器
│   │   ├── service/                 # 业务逻辑层
│   │   ├── mapper/                  # MyBatis 映射接口
│   │   ├── pojo/                    # 数据实体
│   │   ├── model/
│   │   │   ├── dto/                 # 数据传输对象
│   │   │   └── vo/                  # 视图对象（响应）
│   │   ├── aspect/                  # AOP 切面（日志/权限）
│   │   └── utils/                   # 工具类（JWT/文件上传）
│   ├── src/main/resources/
│   │   ├── mapper/                  # MyBatis XML 映射
│   │   └── application.yml          # 主配置文件
│   ├── pom.xml
│   └── .env
│
└── Uploads/                         # 文件上传目录
```

## 🔌 API 概览

基础 URL: `http://localhost:8080/api`

| 方法 | 接口 | 说明 |
|------|------|------|
| `POST` | `/user/login` | 用户登录 |
| `POST` | `/user/register` | 用户注册 |
| `GET` | `/user/me` | 获取当前用户信息 |
| `POST` | `/document/create` | 创建文档 |
| `GET` | `/document/detail/{id}` | 获取文档详情 |
| `POST` | `/document/update/info` | 更新文档 (编辑者+) |
| `GET` | `/folder/content` | 获取个人文件 |
| `GET` | `/folder/shared-content` | 获取共享文件 |
| `POST` | `/permission/create` | 分享文档 |
| `GET` | `/permission/document/{documentId}` | 列出文档权限 |
| `POST` | `/file/upload/image` | 上传图片 |

响应格式：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

## 🔥 亮点设计

### 1. CRDT 驱动的协作引擎
与传统 OT（操作转换）不同，Yjs 使用 **CRDT（无冲突复制数据类型）**，无需中央协调服务器即可解决冲突，使系统对网络延迟更具弹性，并保证最终一致性。

### 2. 增量文档存储
文档以**增量 delta 更新**而非完整快照形式存储，优势包括高效的版本历史追溯、带宽友好的同步（仅传输变更部分）、从部分保存中可靠恢复。

### 3. 基于 AOP 的权限系统
自定义 `@RequirePermission` 注解配合 Spring AOP 拦截所有 API 调用，执行前校验用户角色（所有者/编辑者/查看者）—— 实现关注点清晰分离。

### 4. 心跳会话管理
客户端与服务器之间的定时心跳检测能识别过期会话，自动踢出已断开连接的用户 —— 防止被遗弃的浏览器标签页导致的未授权访问。

### 5. 渐进增强编辑器
TipTap/ProseMirror 提供可插拔扩展架构。自定义扩展（协作光标、任务项、链接处理）以声明式方式组合。

## 🧪 测试协同

```bash
# 1. 启动后端和前端
# 2. 在两个浏览器窗口中打开 http://localhost:5173
# 3. 使用不同用户账号登录
# 4. 导航到同一个共享文档
# 5. 在其中一个窗口编辑 —— 另一个窗口会即时同步变更
```

## 📄 许可证

MIT License — 自由使用、修改和分发。

## 🙏 致谢

- [TipTap](https://tiptap.dev/) — 无头编辑器框架
- [Yjs](https://docs.yjs.dev/) — CRDT 协作框架
- [Spring Boot](https://spring.io/projects/spring-boot) — Java 应用框架
- [MyBatis](https://mybatis.org/) — SQL 映射框架
- [Tailwind CSS](https://tailwindcss.com/) — 原子化 CSS 框架
- [Vite](https://vitejs.dev/) — 下一代前端构建工具
- [Lucide](https://lucide.dev/) — 精美开源图标库

---

<p align="center">
  <a href="README_EN.md">🇬🇧 Switch to English</a>
</p>

<p align="center">
  <sub>由 DocCollab 团队用 ❤️ 构建</sub>
</p>
