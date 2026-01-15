/**
 * GoldPrice.org 爬虫 API
 * 使用官方 JSON API 获取实时金价
 */

export const config = {
    runtime: 'edge',
};

export default async function handler() {
    try {
        // 使用 GoldPrice.org 的 JSON API
        const response = await fetch('https://data-asg.goldprice.org/dbXRates/USD', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Referer': 'https://goldprice.org/',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 提取金价 (xauPrice = 黄金价格 USD/oz)
        const goldPrice = data.items?.[0]?.xauPrice;

        if (!goldPrice || isNaN(goldPrice)) {
            throw new Error('无法解析金价数据');
        }

        return new Response(JSON.stringify({
            price: goldPrice,
            timestamp: new Date().toISOString(),
            source: 'goldprice.org',
            change: data.items?.[0]?.chgXau || 0,
            changePercent: data.items?.[0]?.pcXau || 0,
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 's-maxage=30, stale-while-revalidate=15',
                'Access-Control-Allow-Origin': '*',
            },
        });

    } catch (error) {
        console.error('GoldPrice API error:', error);

        return new Response(JSON.stringify({
            error: String(error),
            message: '获取国际金价失败',
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}
