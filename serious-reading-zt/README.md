# Serious Reading — ZTools 插件

隐私小说阅读器，支持 TXT / EPUB / PDF，原生透明留窗伪装模式、老板键、自动翻页。

## 技术栈

- **平台**：ZTools（Electron）
- **UI**：React 18 + TypeScript + Vite（双入口：主窗 `index.html` / 悬浮阅读窗 `reader.html`）
- **样式**：Tailwind CSS + shadcn/ui（Radix）
- **PDF**：pdfjs-dist（前端 canvas 渲染）
- **TXT 编码**：BOM 检测 + jschardet + iconv-lite（在 preload 层，不编译）
- **EPUB**：adm-zip 解析（提取章节 + 封面）
- **存储**：`ztools.dbStorage`（kv）+ `ztools.db`（书架文档 / 封面附件）

## 功能

- 书架网格（EPUB 显示封面，TXT/PDF 显示书名色块）
- 章节跳转（右键菜单 → 搜索过滤章节列表）
- 全文搜索跳转（关键字 + 上下文高亮，TXT）
- 百分比跳转（阅读窗右下角输入框）
- 透明留窗伪装（`#00000001` 近全透明，鼠标离开/双击/中键/Esc 可自定义）
- 真隐藏 `win.hide()`（右键等可自定义，命令/全局快捷键恢复）
- 三功能触发器自定义绑定 + 冲突实时检测
- 阅读窗原地拖拽 / 系统边缘缩放（无需回主窗）
- 自动翻页（可配置间隔，stealth 时可暂停）
- 明暗主题（跟随系统 + 手动切换）
- 阅读窗自闭环（翻页/切章/存进度直接调用 preload，不回主窗中转）

## 触发器与隐藏模式

三种功能可在设置面板自定义绑定触发动作，系统检测冲突：

| 功能 | 默认 | 含义 |
|------|------|------|
| Stealth 切换 | 双击 / 中键 / Esc | 透明留窗显↔隐双向 |
| 边缘隐藏 | 鼠标离开边缘 | 离开→隐，移回→显 |
| 真隐藏 | 右键 | `win.hide()` 彻底消失，靠命令恢复 |

恢复命令（可在 ZTools 全局快捷键绑定）：

- `show_reader`：显示阅读窗
- `toggle_reader`：切换阅读窗显隐

## 目录结构

```
serious-reading-zt/
├── plugin.json          # ZTools 插件配置
├── index.html           # 主窗入口
├── reader.html          # 悬浮阅读窗入口
├── preload/             # 不编译的 CommonJS（+ node_modules）
│   ├── main.js          # 主窗 preload
│   ├── reader.js        # 阅读窗 preload
│   └── package.json     # adm-zip / iconv-lite / jschardet
├── src/
│   ├── main/            # 主窗 React（书架/设置/跳转 Dialog）
│   ├── reader/          # 阅读窗 React（分页/伪装/PDF）
│   ├── shared/          # 共享类型/存储/IPC/Parser
│   ├── components/ui/   # shadcn 基础组件
│   └── styles/globals.css
└── vite.config.ts
```

## 开发

```bash
# 1. 安装前端依赖
npm install

# 2. 安装 preload 原生依赖（不编译，随源码提交）
cd preload && npm install && cd ..

# 3. 开发模式（Vite dev server :5173，ZTools 开发者工具以本目录为根加载）
npm run dev

# 4. 构建产物到 dist/
npm run build
# 构建后 reader.html / index.html 在 dist/ 下，preload 保持原样
```

## 打包发布

```bash
npm install -g @ztools-center/plugin-cli
git init && git add . && git commit -m "Initial commit"
ztools publish
```

> 注意：preload 依赖必须原样放 `preload/node_modules/` 且不要压缩；ZTools 要求 preload 代码清晰可读。