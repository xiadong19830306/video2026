require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 静态文件服务（上传页 + 播放页）
app.use(express.static(path.join(__dirname, '../public')));

/**
 * GET /api/upload-params
 * 生成前端直传OSS所需的PostObject签名参数
 */
app.get('/api/upload-params', async (req, res) => {
  try {
    const fileId = uuidv4();
    const ext = req.query.ext || 'mp4';
    const objectKey = `videos/${fileId}.${ext}`;

    // 生成PostObject Policy（有效期15分钟）
    const expireDate = new Date(Date.now() + 15 * 60 * 1000);
    const policy = {
      expiration: expireDate.toISOString(),
      conditions: [
        ['content-length-range', 0, 500 * 1024 * 1024],
        ['eq', '$key', objectKey],
      ],
    };

    const policyBase64 = Buffer.from(JSON.stringify(policy)).toString('base64');

    // 签名：HMAC-SHA1(AccessKeySecret, policyBase64) → base64
    const signature = crypto
      .createHmac('sha1', process.env.OSS_ACCESS_KEY_SECRET)
      .update(policyBase64)
      .digest('base64');

    const ossPublicDomain = process.env.OSS_PUBLIC_DOMAIN || '';
    const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

    res.json({
      host: `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com`,
      key: objectKey,
      policy: policyBase64,
      OSSAccessKeyId: process.env.OSS_ACCESS_KEY_ID,
      signature,
      videoUrl: `${ossPublicDomain}/${objectKey}`,
      playUrl: `${appBaseUrl}/play.html?v=${encodeURIComponent(`${ossPublicDomain}/${objectKey}`)}`,
    });
  } catch (err) {
    console.error('生成上传参数失败:', err);
    res.status(500).json({ error: '生成上传参数失败', detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  服务已启动：http://localhost:${PORT}`);
  console.log(`  上传页：http://localhost:${PORT}/index.html`);
  console.log(`  播放页：http://localhost:${PORT}/play.html?v=<视频URL>\n`);
});
