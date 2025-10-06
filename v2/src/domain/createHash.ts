import crypto from 'crypto';

export default function createDataHash(data: any): string {
	// null/undefinedチェック
	if (data === null || data === undefined) {
		return crypto.createHash('sha256').update('null/undefined', 'utf8').digest('hex');
	}
	
  // 再帰的にキーをソートしてJSON化
  const stableJson = JSON.stringify(data, (key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // オブジェクトの場合、キーをソート
      const sorted: any = {};
      for (const k of Object.keys(value).sort()) {
        sorted[k] = value[k];
      }
      return sorted;
    }
    return value;
  });
  
  return crypto.createHash('sha256').update(stableJson, 'utf8').digest('hex');
}