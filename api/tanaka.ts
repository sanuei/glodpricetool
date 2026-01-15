/**
 * 田中贵金属爬虫 API
 * 使用 Cheerio 从页面 HTML 中提取价格
 */

import * as cheerio from 'cheerio';

export const config = {
    runtime: 'edge',
};

export default async function handler() {
    try {
        // 直接获取价格页面
        const response = await fetch('https://gold.tanaka.co.jp/commodity/souba/index.php', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ja,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        let buybackPrice: number | null = null;

        // 方法1: 直接查找包含价格的表格单元格
        // 田中的价格表格结构: 店頭買取価格 行的金额
        $('table').each((_, table) => {
            $(table).find('tr').each((_, row) => {
                const rowText = $(row).text();
                if (rowText.includes('店頭買取価格')) {
                    // 找到买取价格行，获取第一个 td 中的价格
                    const cells = $(row).find('td');
                    cells.each((_, cell) => {
                        const cellText = $(cell).text().trim();
                        // 匹配类似 "25,655円" 的格式
                        const match = cellText.match(/(\d{1,3}(?:,\d{3})*)\s*円/);
                        if (match && !buybackPrice) {
                            buybackPrice = parseInt(match[1].replace(/,/g, ''), 10);
                            return false;
                        }
                    });
                }
            });
        });

        // 方法2: 搜索页面中所有符合金价范围的数字
        if (!buybackPrice) {
            const bodyText = $('body').text();
            // 匹配 20,000-40,000 范围的价格
            const priceRegex = /(\d{2},\d{3})\s*円/g;
            const matches = [...bodyText.matchAll(priceRegex)];

            for (const match of matches) {
                const price = parseInt(match[1].replace(/,/g, ''), 10);
                // 金的买取价格通常在 20000-40000 范围
                if (price >= 20000 && price <= 40000) {
                    buybackPrice = price;
                    break;
                }
            }
        }

        // 方法3: 查找特定 class 或 id 的元素
        if (!buybackPrice) {
            // 尝试查找可能包含价格的元素
            const priceElements = $('.price, .gold-price, [class*="price"], [class*="kaitori"]');
            priceElements.each((_, el) => {
                const text = $(el).text();
                const match = text.match(/(\d{2},\d{3})/);
                if (match && !buybackPrice) {
                    const price = parseInt(match[1].replace(/,/g, ''), 10);
                    if (price >= 20000 && price <= 40000) {
                        buybackPrice = price;
                        return false;
                    }
                }
            });
        }

        if (!buybackPrice || isNaN(buybackPrice)) {
            throw new Error('无法从页面提取田中买取价格');
        }

        return new Response(JSON.stringify({
            buybackPrice,
            timestamp: new Date().toISOString(),
            source: 'gold.tanaka.co.jp',
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
                'Access-Control-Allow-Origin': '*',
            },
        });

    } catch (error) {
        console.error('Tanaka scraping error:', error);

        return new Response(JSON.stringify({
            error: String(error),
            message: '获取田中价格失败，请手动输入',
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}
