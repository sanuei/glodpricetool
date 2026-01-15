/**
 * API 调用模块 - 获取实时金价数据
 */

export interface GoldPriceData {
    price: number;        // 盎司价格 USD
    timestamp: string;    // 更新时间
    source: string;       // 数据来源
}

export interface TanakaData {
    buybackPrice: number; // 买取价格 日元/g
    timestamp: string;    // 更新时间
    source: string;       // 数据来源
}

/**
 * 获取 GoldPrice.org 的黄金价格
 */
export async function fetchGoldPrice(): Promise<GoldPriceData> {
    try {
        const response = await fetch('/api/goldprice');
        if (!response.ok) {
            throw new Error('获取国际金价失败');
        }
        return await response.json();
    } catch (error) {
        console.error('获取国际金价错误:', error);
        throw error;
    }
}

/**
 * 获取田中贵金属的买取价格
 */
export async function fetchTanakaPrice(): Promise<TanakaData> {
    try {
        const response = await fetch('/api/tanaka');
        if (!response.ok) {
            throw new Error('获取田中价格失败');
        }
        return await response.json();
    } catch (error) {
        console.error('获取田中价格错误:', error);
        throw error;
    }
}

/**
 * 同时获取两个数据源
 */
export async function fetchAllPrices(): Promise<{
    goldPrice: GoldPriceData;
    tanakaPrice: TanakaData;
}> {
    const [goldPrice, tanakaPrice] = await Promise.all([
        fetchGoldPrice(),
        fetchTanakaPrice(),
    ]);
    return { goldPrice, tanakaPrice };
}
