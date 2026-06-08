# 视频二维码播放系统 · 部署说明

## 项目结构

```
video-qrcode/
├── server/
│   ├── index.js          # 后端服务（Express）
│   ├── package.json
│   ├── .env.example      # 配置模板（复制为 .env 后填入真实值）
│   └── .env              # 真实配置（不要提交到 Git）
└── public/
    ├── index.html        # 上传页
    └── play.html         # 播放页（扫码后打开）
```

---

## 第一步：阿里云 OSS 配置

### 1.1 创建 Bucket

1. 登录 [阿里云OSS控制台](https://oss.console.aliyun.com/)
2. 点击「创建 Bucket」
   - Bucket 名称：随意（如 `my-videos-2024`）
   - 地域：选距离用户近的（如杭州 `oss-cn-hangzhou`）
   - **读写权限：公共读**（视频需要被扫码者访问）
3. 记录 Bucket 名称和地域

### 1.2 配置跨域（CORS）

在 Bucket「权限控制」→「跨域设置」→ 添加规则：

| 字段 | 值 |
|------|----|
| 来源 | `*` |
| 允许方法 | GET, POST, PUT, DELETE, HEAD |
| 允许 Headers | `*` |
| 暴露 Headers | `ETag, x-oss-request-id` |
| 缓存时间 | `600` |

### 1.3 获取 AccessKey

1. 控制台右上角头像 → 「AccessKey 管理」
2. 建议创建「子账号（RAM 用户）」并只授予 OSS 权限（更安全）
3. 记录 AccessKey ID 和 AccessKey Secret

---

## 第二步：配置 .env

```bash
# 进入 server 目录
cd server

# 复制配置模板
cp .env.example .env
```

编辑 `.env`，填入真实值：

```env
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=LTAI5t...（你的AK）
OSS_ACCESS_KEY_SECRET=xxxx...（你的SK）
OSS_BUCKET=my-videos-2024

PORT=3000

# OSS 公开访问域名，格式固定：
OSS_PUBLIC_DOMAIN=https://my-videos-2024.oss-cn-hangzhou.aliyuncs.com

# 本服务的外网地址（本地测试用 localhost）
APP_BASE_URL=http://localhost:3000
```

---

## 第三步：启动服务

```bash
cd server

# 安装依赖（首次）
npm install

# 启动
npm start
```

访问 http://localhost:3000 即可看到上传页。

---

## 第四步：使用流程

1. 打开上传页，选择或拖拽视频文件
2. 点击「开始上传」，等待进度条完成
3. 上传成功后页面自动展示二维码
4. 点击「下载二维码」保存图片，或截图发给别人
5. 别人用微信/手机相机扫码 → 打开播放页 → 直接播放

---

## 部署到公网（可选）

如果希望其他人能扫码播放，需要把服务部署到有公网 IP 的服务器：

### 方式 A：阿里云 ECS（推荐）
1. 购买 ECS 实例（1核2G 足够）
2. 用 PM2 运行：`npm install -g pm2 && pm2 start index.js`
3. 修改 `.env` 中 `APP_BASE_URL` 为服务器 IP 或域名

### 方式 B：Vercel / Railway（免费）
- 后端需改造为 Serverless Function（可进一步咨询）

### 方式 C：内网测试用 ngrok
```bash
ngrok http 3000
# 把生成的 https://xxx.ngrok.io 填入 APP_BASE_URL
```

---

## 费用参考（阿里云）

| 项目 | 说明 | 估算 |
|------|------|------|
| OSS 存储 | 100MB视频 × 100个 = 10GB | ~0.13元/月 |
| OSS 外网流量 | 每次播放 ~100MB | ~0.5元/GB |
| ECS（可选）| 1核2G 按量付费 | ~0.1元/小时 |

少量使用几乎免费。

---

## 常见问题

**Q: 上传报 "403 Access Denied"**
> 检查 AccessKey 是否有 OSS 写权限，以及 Bucket 名称/地域是否填写正确。

**Q: 上传报跨域错误**
> 检查 OSS Bucket 的 CORS 配置是否设置正确（见第一步 1.2）。

**Q: 扫码后视频播放不了**
> 确认 Bucket 读写权限为「公共读」，以及 `OSS_PUBLIC_DOMAIN` 填写正确。

**Q: 微信内扫码打不开**
> 需要将页面部署到 HTTPS 域名。可以给域名申请免费 SSL 证书（阿里云提供）。
