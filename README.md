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

---

<h1 align="center">📝 DocCollab</h1>
<p align="center"><strong>Full-Stack Collaborative Document Management System</strong></p>
<p align="center"><em>全栈协同文档管理系统</em></p>

<p align="center">
  <a href="#-features--核心特性">✨ Features</a> •
  <a href="#-tech-stack--技术栈">🛠 Tech Stack</a> •
  <a href="#-architecture--系统架构">🏗 Architecture</a> •
  <a href="#-quick-start--快速开始">🚀 Quick Start</a> •
  <a href="#-project-structure--项目结构">📂 Structure</a> •
  <a href="#-api-overview--接口概览">🔌 API</a>
</p>

---

## 📖 Introduction | 项目介绍

DocCollab is a **full-stack collaborative document editing platform** inspired by Google Docs and Notion. It supports **real-time multi-user editing** with live cursors, rich text formatting, document sharing with granular permissions, and automatic conflict resolution — all powered by **CRDT technology** (Yjs) over WebSocket.

DocCollab 是一个受飞书启发的**全栈协同文档编辑平台**。它通过 WebSocket 上的 **CRDT 技术**（Yjs）实现**实时多人编辑**、光标同步、富文本格式化、文档共享与细粒度权限控制，以及自动冲突解决。

---

## ✨ Features | 核心特性

<table>
<tr>
<th width="50%">🇬🇧 English</th>
<th width="50%">🇨🇳 中文</th>
</tr>
<tr>
<td>

### 🔄 Real-Time Collaboration
- Multi-user concurrent editing with live cursors
- CRDT-based conflict resolution (Yjs)
- WebSocket persistent connection
- Debounced auto-save (2s)

### 📝 Rich Text Editing
- Headings, lists, blockquotes, code blocks
- Task lists (checkboxes)
- Image embedding with upload
- Hyperlinks (Ctrl+Click to open)
- Text underline, bold, italic
- Placeholder hints

### 🔐 Authentication & Authorization
- JWT token-based authentication
- Three-tier roles: OWNER / EDITOR / VIEWER
- AOP aspect-driven permission enforcement
- Cross-session kick-out detection (heartbeat)

### 📁 Document Management
- Personal & shared file trees
- Folder-based document organization
- Context menu operations (rename, delete, share)
- Document templates (weekly report, meeting notes)

### 🖼 File Upload
- Image upload with preview
- 5 MB file size limit
- Automatic embedding in editor

### 🎨 UI/UX
- Tailwind CSS responsive design
- Lucide React icon library
- Resizable sidebar panels
- Modal-based user settings

</td>
<td>

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

</td>
</tr>
</table>

---

## 🛠 Tech Stack | 技术栈

### Frontend | 前端

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React | 19.2 |
| Build Tool | Vite | 7.2 |
| Editor Engine | TipTap (ProseMirror) | 2.27 |
| CRDT Sync | Yjs + y-websocket | 13.6 / 3.0 |
| Styling | Tailwind CSS | 3.4 |
| Icons | Lucide React | 0.555 |
| Linting | ESLint | 9.39 |

### Backend | 后端

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Spring Boot | 3.5.8 |
| Language | Java | 17 |
| ORM | MyBatis + Spring | 3.0.5 |
| Database | MySQL | 8.0 |
| Auth | JJWT | 0.9.1 |
| Realtime | WebSocket (Spring) | — |
| Build | Maven | 4.0 |
| Code Quality | JaCoCo + SonarQube | 0.8.13 |

---

## 🏗 Architecture | 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  React SPA (Vite)                     │  │
│  │  ┌─────────┐ ┌──────────────┐ ┌───────────────────┐  │  │
│  │  │FileTree │ │ TipTapEditor │ │  Settings/Modals  │  │  │
│  │  │         │ │  (ProseMirror│ │                   │  │  │
│  │  │ Shared  │ │   + Yjs CRDT)│ │  User Profile     │  │  │
│  │  │ Personal│ │              │ │  Share Dialog     │  │  │
│  │  └─────────┘ └──────┬───────┘ └───────────────────┘  │  │
│  │                     │ WebSocket / HTTP REST           │  │
│  └─────────────────────┼────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────┼────────────────────────────────────┐
│                   Spring Boot Backend                        │
│  ┌─────────────────────┼──────────────────────────────────┐ │
│  │          Controller Layer (REST API)                   │ │
│  │  ┌──────────┐ ┌────────────┐ ┌──────────────────┐     │ │
│  │  │User API  │ │Document API│ │Permission API    │     │ │
│  │  └──────────┘ └────────────┘ └──────────────────┘     │ │
│  └─────────────────────┼──────────────────────────────────┘ │
│                        │                                     │
│  ┌─────────────────────┼──────────────────────────────────┐ │
│  │            Service Layer (Business Logic)              │ │
│  │  ┌──────────┐ ┌────────────┐ ┌──────────────────┐     │ │
│  │  │ Auth     │ │ Document   │ │ Permission       │     │ │
│  │  │ JWT      │ │ CRUD       │ │ RBAC             │     │ │
│  │  └──────────┘ └────────────┘ └──────────────────┘     │ │
│  └─────────────────────┼──────────────────────────────────┘ │
│                        │                                     │
│  ┌─────────────────────┼──────────────────────────────────┐ │
│  │             MyBatis Mapper Layer                        │ │
│  │  ┌──────────┐ ┌────────────┐ ┌──────────────────┐     │ │
│  │  │User Mapper│ │Doc Mapper  │ │Permission Mapper │     │ │
│  │  └──────────┘ └────────────┘ └──────────────────┘     │ │
│  └─────────────────────┼──────────────────────────────────┘ │
│                        │                                     │
│  ┌─────────────────────┼──────────────────────────────────┐ │
│  │          WebSocket Handler (Real-Time Sync)            │ │
│  │       DocumentSocketHandler — Yjs protocol             │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────┼────────────────────────────────────┐
│                   MySQL Database                             │
│  ┌──────────┐ ┌────────────┐ ┌──────────────────┐          │
│  │  users   │ │ documents  │ │  permissions     │          │
│  └──────────┘ └────────────┘ └──────────────────┘          │
│         ┌───────────────┐   ┌──────────────────┐           │
│         │ document_delta│   │     folders      │           │
│         └───────────────┘   └──────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow | 数据流

```
Multi-User Editing Flow | 多人编辑流程:

User A edits ──► Yjs CRDT ──► WebSocket ──► Server ──► Broadcast to Users B, C
                     ▲                                       │
                     └─────────── Acknowledgment ◄───────────┘

Auto-Save Flow | 自动保存流程:

Editor changes ──► Debounce 2s ──► HTTP POST ──► Backend ──► MySQL
     │                                                     │
     └────────────── Reconcile on next load ◄──────────────┘
```

---

## 🚀 Quick Start | 快速开始

### Prerequisites | 环境要求

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 18 | Frontend runtime |
| npm | ≥ 9 | Package manager |
| Java JDK | 17 | Backend runtime |
| Maven | ≥ 3.8 | Backend build |
| MySQL | 8.0 | Database |

### 1. Clone & Enter Project | 克隆项目

```bash
git clone https://github.com/SaMuel-101-cky/My-Cloud-Document-Interface.git
```

### 2. Database Setup | 数据库配置

Create a MySQL database named `homework`:

```sql
CREATE DATABASE IF NOT EXISTS homework DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Configure your database credentials in `../Backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/homework
    username: root
    password: your_password_here
```

### 3. Start Backend | 启动后端

```bash
cd ../Backend

# Install dependencies & build
mvn clean package -DskipTests

# Run the server (port 8080)
mvn spring-boot:run
```

Backend starts at **http://localhost:8080**.

### 4. Start Frontend | 启动前端

```bash
cd ../Frontend

# Install dependencies
npm install

# Start dev server (port 5173)
npm run dev
```

Frontend starts at **http://localhost:5173**.

### 5. Open in Browser | 浏览器访问

Navigate to [http://localhost:5173](http://localhost:5173) and start collaborating!

---

## 📂 Project Structure | 项目结构

```
My document/
├── Frontend/                        # React 前端
│   ├── src/
│   │   ├── api/                     # API 服务层
│   │   │   ├── auth.js              #   认证接口
│   │   │   ├── document.js          #   文档 CRUD
│   │   │   ├── file.js              #   文件上传
│   │   │   ├── folder.js            #   文件夹管理
│   │   │   ├── permission.js        #   权限控制
│   │   │   └── user.js              #   用户信息
│   │   ├── components/              # 共享组件
│   │   │   ├── ui/                  #   UI 原子组件
│   │   │   ├── FileTree.jsx         #   文件导航树
│   │   │   ├── SettingsModal.jsx    #   设置弹窗
│   │   │   └── TipTapEditor.jsx     #   核心编辑器 ⭐
│   │   ├── constants/               # 常量 & 模板
│   │   │   └── templates.js         #   文档模板
│   │   ├── features/                # 功能模块
│   │   │   ├── editor/              #   编辑器扩展
│   │   │   │   ├── components/      #     编辑器 UI
│   │   │   │   ├── extensions.js    #     TipTap 扩展
│   │   │   │   └── nodes/           #     自定义节点
│   │   │   ├── file-tree/           #   文件树功能
│   │   │   ├── home/                #   主页功能
│   │   │   └── settings/            #   设置功能
│   │   ├── pages/                   # 页面组件
│   │   │   ├── AuthPage.jsx         #   登录注册页
│   │   │   └── HomePage.jsx         #   主工作台
│   │   ├── utils/                   # 工具函数
│   │   │   └── request.js           #   HTTP 请求封装
│   │   ├── styles/                  # 全局样式
│   │   └── main.jsx                 # 应用入口
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js               # Vite 配置
│   ├── tailwind.config.js           # Tailwind 配置
│   └── eslint.config.js             # ESLint 配置
│
├── Backend/                         # Spring Boot 后端
│   ├── src/main/java/com/example/db_document/
│   │   ├── config/                  # 配置类（CORS, WebSocket, 拦截器）
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
│   └── .env                         # 环境变量
│
└── Uploads/                         # 文件上传目录
```

---

## 🔌 API Overview | 接口概览

### Base URL: `http://localhost:8080/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Auth** | | |
| `POST` | `/user/login` | User login |
| `POST` | `/user/register` | User registration |
| `GET` | `/user/me` | Get current user info |
| **Documents** | | |
| `POST` | `/document/create` | Create document |
| `GET` | `/document/detail/{id}` | Get document details |
| `POST` | `/document/update/info` | Update document (EDITOR+) |
| **Folders** | | |
| `GET` | `/folder/content` | Get personal files |
| `GET` | `/folder/shared-content` | Get shared files |
| **Permissions** | | |
| `POST` | `/permission/create` | Share document |
| `GET` | `/permission/document/{documentId}` | List permissions |
| **Files** | | |
| `POST` | `/file/upload/image` | Upload image |

### Response Format

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

---

## 🔥 Highlights | 亮点设计

<table>
<tr>
<th width="50%">🇬🇧 English</th>
<th width="50%">🇨🇳 中文</th>
</tr>
<tr>
<td>

### 1. CRDT-Powered Collaboration
Unlike OT (Operational Transformation), Yjs uses **CRDT (Conflict-free Replicated Data Type)** which eliminates the need for a central coordination server for conflict resolution. This makes the system more resilient to network delays and ensures eventual consistency.

### 2. Incremental Document Storage
Documents are stored as **incremental delta updates** rather than full snapshots. This enables:
- Efficient version history
- Bandwidth-efficient sync (only changed parts are transmitted)
- Reliable recovery from partial saves

### 3. AOP-Based Permission System
Custom `@RequirePermission` annotation with Spring AOP intercepts all API calls, checking user roles (OWNER/EDITOR/VIEWER) before execution — clean separation of concerns.

### 4. Heartbeat Session Management
Periodic heartbeat between client and server detects stale sessions, enabling automatic kick-out of disconnected users — preventing unauthorized access from abandoned browser tabs.

### 5. Progressive Enhancement Editor
TipTap/ProseMirror provides a pluggable extension architecture. Custom extensions (collaboration cursor, task items, link handling) are composed declaratively.

</td>
<td>

### 1. CRDT 驱动的协作引擎
与传统 OT（操作转换）不同，Yjs 使用 **CRDT（无冲突复制数据类型）**，无需中央协调服务器即可解决冲突，使系统对网络延迟更具弹性，并保证最终一致性。

### 2. 增量文档存储
文档以**增量 delta 更新**而非完整快照形式存储，优势包括：
- 高效的版本历史追溯
- 带宽友好的同步（仅传输变更部分）
- 从部分保存中可靠恢复

### 3. 基于 AOP 的权限系统
自定义 `@RequirePermission` 注解配合 Spring AOP 拦截所有 API 调用，执行前校验用户角色（所有者/编辑者/查看者）—— 实现关注点清晰分离。

### 4. 心跳会话管理
客户端与服务器之间的定时心跳检测能识别过期会话，自动踢出已断开连接的用户 —— 防止被遗弃的浏览器标签页导致的未授权访问。

### 5. 渐进增强编辑器
TipTap/ProseMirror 提供可插拔扩展架构。自定义扩展（协作光标、任务项、链接处理）以声明式方式组合。

</td>
</tr>
</table>

---

## 🧪 Testing Collaboration | 测试协同

To verify real-time collaboration works:

```bash
# 1. Start backend and frontend
# 2. Open http://localhost:5173 in two browser windows
# 3. Log in with different user accounts
# 4. Navigate to the same shared document
# 5. Edit in one window — changes appear instantly in the other
```

---

## 📄 License | 许可证

MIT License — feel free to use, modify, and distribute.

---

## 🙏 Acknowledgements | 致谢

- [TipTap](https://tiptap.dev/) — Headless editor framework
- [Yjs](https://docs.yjs.dev/) — CRDT collaboration framework
- [Spring Boot](https://spring.io/projects/spring-boot) — Java application framework
- [MyBatis](https://mybatis.org/) — SQL mapping framework
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Vite](https://vitejs.dev/) — Next-gen frontend build tool
- [Lucide](https://lucide.dev/) — Beautiful open-source icons

---

<p align="center">
  <sub>Built with ❤️ by the DocCollab team | 由 DocCollab 团队用 ❤️ 构建</sub>
</p>
