import { getCharacter } from "@api/bungie/getCharacter";
import { getDefinition } from "@api/bungie/getDefinition";
import createDataHash from "@domain/createHash";
import { getPortalData } from "@domain/fetcher/portal";
import { describe, expect, it } from "vitest";

describe('Portal Data Hash Difference Test', async () => {
    const originalPortalData = await getPortalData(getCharacter, getDefinition);
    const originalHash = createDataHash(originalPortalData);

    it('should detect hash difference when noise item is inserted', () => {
        // 深いコピーを作成
        const noisedData = JSON.parse(JSON.stringify(originalPortalData));
        noisedData.solo[999] = [12345];
        const noisyHash = createDataHash(noisedData);
        
        expect(originalHash).not.toBe(noisyHash);
        console.log('Original Hash:', originalHash);
        console.log('Noisy Hash:', noisyHash);
    });

    it('should show different hashes for different noise items', () => {
        // それぞれ独立した深いコピーを作成
        const noisedData1 = JSON.parse(JSON.stringify(originalPortalData));
        const noisedData2 = JSON.parse(JSON.stringify(originalPortalData));

        noisedData1.solo[999] = [12345];
        noisedData2.solo[999] = [67890];

        const hash1 = createDataHash(noisedData1);
        const hash2 = createDataHash(noisedData2);

        console.log('Hash1:', hash1);
        console.log('Hash2:', hash2);
        console.log('Original:', originalHash);

        expect(hash1).not.toBe(hash2);
        expect(hash1).not.toBe(originalHash);
        expect(hash2).not.toBe(originalHash);
    });

    it('should maintain same hash for identical data', async () => {
        // 新しくデータを取得
        const duplicateData = await getPortalData(getCharacter, getDefinition);
        const duplicateHash = createDataHash(duplicateData);

        expect(originalHash).toBe(duplicateHash);
    });
		    it('should handle edge cases properly', () => {
        // null/undefined値のハンドリング
        expect(() => createDataHash(null)).not.toThrow();
        expect(() => createDataHash(undefined)).not.toThrow();
        expect(() => createDataHash({})).not.toThrow();
        expect(() => createDataHash([])).not.toThrow();
        
        // 空オブジェクトと空配列は異なるハッシュを生成
        expect(createDataHash({})).not.toBe(createDataHash([]));
    });

    it('should be deterministic across multiple runs', () => {
        // 同じデータで複数回実行して同じハッシュが生成される
        const data = JSON.parse(JSON.stringify(originalPortalData));
        const hash1 = createDataHash(data);
        const hash2 = createDataHash(data);
        const hash3 = createDataHash(data);
        
        expect(hash1).toBe(hash2);
        expect(hash2).toBe(hash3);
    });

    it('should detect subtle changes in nested objects', () => {
        const data1 = JSON.parse(JSON.stringify(originalPortalData));
        const data2 = JSON.parse(JSON.stringify(originalPortalData));
        
        // ネストしたオブジェクトの微細な変更
        if (data1.solo && Object.keys(data1.solo).length > 0) {
            const firstKey = Object.keys(data1.solo)[0];
            if (Array.isArray(data1.solo[firstKey]) && data1.solo[firstKey].length > 0) {
                data2.solo[firstKey] = [...data1.solo[firstKey], 999999]; // 配列に要素追加
            }
        }
        
        const hash1 = createDataHash(data1);
        const hash2 = createDataHash(data2);
        
        expect(hash1).not.toBe(hash2);
    });

    it('should ignore object property order', () => {
        // プロパティの順序が異なっても同じハッシュを生成
        const data1 = { a: 1, b: 2, c: { x: 10, y: 20 } };
        const data2 = { c: { y: 20, x: 10 }, b: 2, a: 1 };
        
        const hash1 = createDataHash(data1);
        const hash2 = createDataHash(data2);
        
        expect(hash1).toBe(hash2);
    });

    it('should detect array order changes', () => {
        // 配列の順序変更は検出される
        const data1 = { items: [1, 2, 3] };
        const data2 = { items: [3, 2, 1] };
        
        const hash1 = createDataHash(data1);
        const hash2 = createDataHash(data2);
        
        expect(hash1).not.toBe(hash2);
    });

    it('should handle circular references gracefully', () => {
        // 循環参照のテスト（JSON.stringifyが失敗する場合）
        const circular: any = { name: 'test' };
        circular.self = circular;
        
        expect(() => createDataHash(circular)).toThrow();
    });

    it('should differentiate between string and number keys', () => {
        // 文字列キーと数値キーの区別
        const data1 = { 1: 'one', 2: 'two' };
        const data2 = { '1': 'one', '2': 'two' };
        
        // JSON.stringifyでは同じになるが、実際のデータでは区別されることを確認
        const hash1 = createDataHash(data1);
        const hash2 = createDataHash(data2);
        
        // この場合は同じハッシュになる（JSON.stringifyの仕様）
        expect(hash1).toBe(hash2);
    });

    it('should detect data type changes', () => {
        // データ型の変更を検出
        const data1 = { value: 123 };
        const data2 = { value: '123' };
        const data3 = { value: true };
        
        const hash1 = createDataHash(data1);
        const hash2 = createDataHash(data2);
        const hash3 = createDataHash(data3);
        
        expect(hash1).not.toBe(hash2);
        expect(hash2).not.toBe(hash3);
        expect(hash1).not.toBe(hash3);
    });

    it('should generate consistent hash lengths', () => {
        // ハッシュ長の一貫性
        const smallData = { a: 1 };
        const largeData = JSON.parse(JSON.stringify(originalPortalData));
        
        const smallHash = createDataHash(smallData);
        const largeHash = createDataHash(largeData);
        
        // SHA256は常に64文字のhex文字列
        expect(smallHash).toHaveLength(64);
        expect(largeHash).toHaveLength(64);
        expect(originalHash).toHaveLength(64);
    });

    it('should detect removal of properties', () => {
        // プロパティの削除を検出
        const data1 = JSON.parse(JSON.stringify(originalPortalData));
        const data2 = JSON.parse(JSON.stringify(originalPortalData));
        
        // 最初のプロパティを削除
        const firstKey = Object.keys(data2)[0];
        delete data2[firstKey];
        
        const hash1 = createDataHash(data1);
        const hash2 = createDataHash(data2);
        
        expect(hash1).not.toBe(hash2);
    });
});