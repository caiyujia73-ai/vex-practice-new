# VEX Practice — 部署指南

## 项目结构

```
vex-practice/
├── public/
│   └── index.html      ← 网站前端页面
├── api/
│   └── judge.js        ← 后端 API（调用 Claude）
├── vercel.json         ← Vercel 配置
└── README.md
```

---

## 部署步骤（约 10 分钟）

### 第一步：注册 GitHub 账号
1. 打开 https://github.com
2. 注册一个免费账号

### 第二步：创建新仓库
1. 登录后点击右上角 "+" → "New repository"
2. Repository name 填写：`vex-practice`
3. 选择 **Public**
4. 点击 "Create repository"

### 第三步：上传文件
1. 在新仓库页面，点击 "uploading an existing file"
2. 将整个 vex-practice 文件夹里的所有文件拖进去
   - 注意要保持文件夹结构（api/ 和 public/ 文件夹）
3. 点击 "Commit changes"

### 第四步：注册 Vercel
1. 打开 https://vercel.com
2. 点击 "Sign Up" → 选择 "Continue with GitHub"
3. 授权 Vercel 访问你的 GitHub

### 第五步：部署项目
1. 在 Vercel 首页点击 "Add New Project"
2. 找到 vex-practice 仓库，点击 "Import"
3. 不需要改任何设置，直接点击 "Deploy"
4. 等待约 1 分钟，部署完成

### 第六步：添加 API Key（重要！）
1. 打开 https://console.anthropic.com 注册账号
2. 进入 "API Keys" 页面，创建一个新的 Key，复制它
3. 回到 Vercel，进入你的项目 → Settings → Environment Variables
4. 添加：
   - Name: `ANTHROPIC_API_KEY`
   - Value: 你刚才复制的 Key
5. 点击 Save，然后去 Deployments → 点击最新的部署 → Redeploy

### 完成！
你的网站地址会是：`https://vex-practice-你的用户名.vercel.app`

---

## 如何添加新题目

打开 `public/index.html`，找到 `const questions = [...]` 数组，
按照现有格式添加新的题目对象即可。

每道题包含：
- `title`：题目名称
- `diff`：难度（Easy / Medium / Hard）
- `cat`：分类标签
- `desc`：题目描述（支持 HTML）
- `expected`：期望的结果说明
- `judge`：给 AI 的判断标准（越详细越准确）
- `hint`：提示内容
