# 黄金价格计算工具 (Gold Price Calculator)

这是一个用于计算跨境黄金套利成本和收益的实时计算工具。它结合了实时爬取的国际金价和 Tanaka 贵金属回收价格，帮助用户快速计算利润空间。

## 功能特点

- **实时数据获取**：
  - 🔵 自动获取 [GoldPrice.org](https://goldprice.org/ja) 的国际现货黄金价格 (USD/oz)
  - 🔴 自动获取 [田中贵金属](https://gold.tanaka.co.jp/index.php) 的店頭買取価格 (JPY/g)
  - ⚡️ 支持手动刷新数据

- **智能计算**：
  - 自动根据汇率和单位换算（盎司转克）
  - 支持自定义补贴、汇率、溢价（水）、减价等参数
  - **核心指标**：
    - 每克总成本 (USD)
    - 田中单价 (USD)
    - 每克利润 (USD/%)
    - **每公斤毛利 (USD)**
    - **每公斤毛利 (JPY)**

- **其他功能**：
  - 💾 自动保存计算历史记录到本地
  - 📊 支持导出历史记录为 CSV 文件
  - 📱 响应式设计（适配移动端和桌面端）

## 技术栈

- **前端框架**: [Vite](https://vitejs.dev/) + TypeScript
- **样式库**: [Tailwind CSS](https://tailwindcss.com/)
- **后端/API**: Vercel Serverless Functions
- **爬虫**: Cheerio + Axios

## 本地开发

1. **安装依赖**

```bash
npm install
```

2. **启动开发服务器**

```bash
vercel dev
# 或者仅启动前端（无法使用爬虫API）
npm run dev
```

3. **构建生产版本**

```bash
npm run build
```

## 部署

本项目配置为直接部署到 [Vercel](https://vercel.com)。

1. Fork 本仓库
2. 在 Vercel 中导入项目
3. 部署即可（无需额外配置）

## 目录结构

```
├── api/                # Serverless 爬虫 API
├── src/
│   ├── calculator.ts   # 核心计算逻辑
│   ├── history.ts      # 历史记录管理
│   ├── main.ts         # UI 渲染与交互
│   └── api.ts          # 前端 API 调用封装
├── public/             # 静态资源
└── doc/                # 设计文档
```

## License

MIT
