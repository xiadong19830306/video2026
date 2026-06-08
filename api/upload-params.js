// Vercel Serverless Function: 生成OSS直传签名参数
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    // HMAC-SHA1签名
    const signature = crypto
      .createHmac('sha1', process.env.OSS_ACCESS_KEY_SECRET)
      .update(policyBase64)
      .digest('base64');

    const ossPublicDomain = process.env.OSS_PUBLIC_DOMAIN || '';
    const appBaseUrl = process.env.APP_BASE_URL || '';

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
};
