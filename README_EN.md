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
<p align="center"><strong>Full-Stack Collaborative Document Management System</strong></p>
<p align="center">
  <a href="README.md">
    <img src="https://img.shields.io/badge/%E4%B8%AD%E6%96%87-%E4%B8%AD%E6%96%87%E9%98%85%E8%AF%BB-red?logo=markdown&logoColor=white&style=for-the-badge" alt="中文" />
  </a>
</p>

<p align="center">
  <a href="#introduction">📖 Introduction</a> •
  <a href="#features">✨ Features</a> •
  <a href="#tech-stack">🛠 Tech Stack</a> •
  <a href="#architecture">🏗 Architecture</a> •
  <a href="#quick-start">🚀 Quick Start</a> •
  <a href="#project-structure">📂 Structure</a> •
  <a href="#api-overview">🔌 API</a> •
  <a href="#highlights">🔥 Highlights</a>
</p>

---
## 📖 Introduction

DocCollab is a **full-stack collaborative document editing platform** inspired by Google Docs and Notion. It supports **real-time multi-user editing** with live cursors, rich text formatting, document sharing with granular permissions, and automatic conflict resolution — all powered by **CRDT technology** (Yjs) over WebSocket.

## ✨ Features

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

## 🛠 Tech Stack

### Frontend

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React | 19.2 |
| Build Tool | Vite | 7.2 |
| Editor Engine | TipTap (ProseMirror) | 2.27 |
| CRDT Sync | Yjs + y-websocket | 13.6 / 3.0 |
| Styling | Tailwind CSS | 3.4 |
| Icons | Lucide React | 0.555 |
| Linting | ESLint | 9.39 |

### Backend

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

## 🏗 Architecture

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

### Data Flow

```
Multi-User Editing Flow:

User A edits ──► Yjs CRDT ──► WebSocket ──► Server ──► Broadcast to Users B, C
                     ▲                                       │
                     └─────────── Acknowledgment ◄───────────┘

Auto-Save Flow:

Editor changes ──► Debounce 2s ──► HTTP POST ──► Backend ──► MySQL
     │                                                     │
     └────────────── Reconcile on next load ◄──────────────┘
```

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 18 | Frontend runtime |
| npm | >= 9 | Package manager |
| Java JDK | 17 | Backend runtime |
| Maven | >= 3.8 | Backend build |
| MySQL | 8.0 | Database |

### 1. Clone

```bash
git clone https://github.com/SaMuel-101-cky/My-Cloud-Document-Interface.git
```

### 2. Database Setup

Create a MySQL database named `homework`:

```sql
CREATE DATABASE IF NOT EXISTS homework DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Configure credentials in `../Backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/homework
    username: root
    password: your_password_here
```

### 3. Start Backend

```bash
cd ../Backend
mvn clean package -DskipTests
mvn spring-boot:run
```

Backend starts at **http://localhost:8080**.

### 4. Start Frontend

```bash
cd ../Frontend
npm install
npm run dev
```

Frontend starts at **http://localhost:5173**.

### 5. Open in Browser

Navigate to [http://localhost:5173](http://localhost:5173) and start collaborating!

## 📂 Project Structure

```
My document/
├── Frontend/                        # React Frontend
│   ├── src/
│   │   ├── api/                     # API service layer
│   │   ├── components/              # Shared components
│   │   │   ├── ui/                  #   UI primitives
│   │   │   ├── FileTree.jsx         #   File navigation tree
│   │   │   ├── SettingsModal.jsx    #   Settings modal
│   │   │   └── TipTapEditor.jsx     #   Core editor
│   │   ├── constants/               # Constants & templates
│   │   ├── features/                # Feature modules
│   │   │   ├── editor/              #   Editor extensions
│   │   │   ├── file-tree/           #   File tree features
│   │   │   ├── home/                #   Home page features
│   │   │   └── settings/            #   Settings features
│   │   ├── pages/                   # Page components
│   │   │   ├── AuthPage.jsx         #   Login/Register
│   │   │   └── HomePage.jsx         #   Main workspace
│   │   ├── utils/                   # Utility functions
│   │   ├── styles/                  # Global styles
│   │   └── main.jsx                 # App entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── eslint.config.js
│
├── Backend/                         # Spring Boot Backend
│   ├── src/main/java/com/example/db_document/
│   │   ├── config/                  # Config (CORS, WS, Interceptor)
│   │   ├── controller/              # REST API controllers
│   │   ├── service/                 # Business logic
│   │   ├── mapper/                  # MyBatis mapper interfaces
│   │   ├── pojo/                    # Data entities
│   │   ├── model/
│   │   │   ├── dto/                 # Data Transfer Objects
│   │   │   └── vo/                  # View Objects
│   │   ├── aspect/                  # AOP aspects
│   │   └── utils/                   # Utilities (JWT/File)
│   ├── src/main/resources/
│   │   ├── mapper/                  # MyBatis XML mappings
│   │   └── application.yml          # Main config
│   ├── pom.xml
│   └── .env
│
└── Uploads/                         # File upload directory
```

## 🔌 API Overview

Base URL: `http://localhost:8080/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/user/login` | User login |
| `POST` | `/user/register` | User registration |
| `GET` | `/user/me` | Get current user info |
| `POST` | `/document/create` | Create document |
| `GET` | `/document/detail/{id}` | Get document details |
| `POST` | `/document/update/info` | Update document (EDITOR+) |
| `GET` | `/folder/content` | Get personal files |
| `GET` | `/folder/shared-content` | Get shared files |
| `POST` | `/permission/create` | Share document |
| `GET` | `/permission/document/{documentId}` | List permissions |
| `POST` | `/file/upload/image` | Upload image |

Response format:

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

## 🔥 Highlights

### 1. CRDT-Powered Collaboration
Unlike OT (Operational Transformation), Yjs uses **CRDT (Conflict-free Replicated Data Type)** which eliminates the need for a central coordination server for conflict resolution. This makes the system more resilient to network delays and ensures eventual consistency.

### 2. Incremental Document Storage
Documents are stored as **incremental delta updates** rather than full snapshots. This enables efficient version history, bandwidth-efficient sync (only changed parts are transmitted), and reliable recovery from partial saves.

### 3. AOP-Based Permission System
Custom `@RequirePermission` annotation with Spring AOP intercepts all API calls, checking user roles (OWNER/EDITOR/VIEWER) before execution — clean separation of concerns.

### 4. Heartbeat Session Management
Periodic heartbeat between client and server detects stale sessions, enabling automatic kick-out of disconnected users — preventing unauthorized access from abandoned browser tabs.

### 5. Progressive Enhancement Editor
TipTap/ProseMirror provides a pluggable extension architecture. Custom extensions (collaboration cursor, task items, link handling) are composed declaratively.

## 🧪 Testing

```bash
# 1. Start backend and frontend
# 2. Open http://localhost:5173 in two browser windows
# 3. Log in with different user accounts
# 4. Navigate to the same shared document
# 5. Edit in one window — changes appear instantly in the other
```

## 📄 License

MIT License — feel free to use, modify, and distribute.

## 🙏 Acknowledgements

- [TipTap](https://tiptap.dev/) — Headless editor framework
- [Yjs](https://docs.yjs.dev/) — CRDT collaboration framework
- [Spring Boot](https://spring.io/projects/spring-boot) — Java application framework
- [MyBatis](https://mybatis.org/) — SQL mapping framework
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Vite](https://vitejs.dev/) — Next-gen frontend build tool
- [Lucide](https://lucide.dev/) — Beautiful open-source icons

---

<p align="center">
  <a href="README.md">🇨🇳 切换到中文</a>
</p>

<p align="center">
  <sub>Built with ❤️ by the DocCollab team</sub>
</p>
