import crypto from 'crypto';

export default function createDataHash(data: any): string {
  // タイムスタンプなど動的データを除外
  return crypto.createHash('sha256')
    .update(JSON.stringify(data, Object.keys(data).sort()))
    .digest('hex');
}