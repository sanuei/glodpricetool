/**
 * 黄金价格计算器 - 计算逻辑
 */

// 常量
export const OZ_TO_KG = 32.1507; // 1公斤 = 32.1507 金衡盎司

// 输入参数接口
export interface CalculatorInput {
    // 自动爬取的数据
    goldPriceUSD: number;     // 盎司单价 (USD/oz) - 蓝色
    tanakaPrice: number;      // 田中买取价格 (日元/g) - 红色

    // 手动输入参数 - 黄色
    subsidy: number;          // 补贴 (港币)
    hkdToUsd: number;         // 港币/美金汇率
    water: number;            // 水/溢价 (USD/oz)
    reduction: number;        // 减价 (日元)
    uRate: number;            // U行情价 (日元/USD)
}

// 计算结果接口
export interface CalculatorResult {
    // 补贴计算
    subsidyUSD: number;           // 补贴单价 (USD)

    // 国际金价成本
    priceAfterWater: number;      // 水后单价 (USD/oz)
    pricePerGram: number;         // 每克单价 (USD/g)

    // 总成本
    totalCostPerGram: number;     // 每克单价成本 (USD/g)

    // 田中收入
    shippingPriceJPY: number;     // 出货价 (日元)
    tanakaPriceUSD: number;       // 田中单价 (USD/g)

    // 利润
    profitPerGram: number;        // 每克利润 (USD)
    profitPercentage: number;     // 利润百分比

    // 综合利润 (新增)
    profitPerKg: number;          // 每公斤毛利 (USD)
    profitPerKgJPY: number;       // 每公斤毛利 (JPY)
}

/**
 * 执行所有计算
 */
export function calculate(input: CalculatorInput): CalculatorResult {
    // 1. 补贴成本计算
    const subsidyUSD = input.subsidy / input.hkdToUsd;

    // 2. 国际金价成本计算
    const priceAfterWater = input.goldPriceUSD + input.water;
    const pricePerGram = priceAfterWater / OZ_TO_KG;

    // 3. 每克总成本
    const totalCostPerGram = pricePerGram + subsidyUSD;

    // 4. 田中卖出收入计算
    const shippingPriceJPY = input.tanakaPrice - input.reduction;
    const tanakaPriceUSD = shippingPriceJPY / input.uRate;

    // 5. 利润计算
    const profitPerGram = tanakaPriceUSD - totalCostPerGram;
    const profitPercentage = (profitPerGram / totalCostPerGram) * 100;

    // 6. 综合利润计算 (新增)
    // 公式: (田中单价 - 每克总成本) * 1000
    const profitPerKg = (tanakaPriceUSD - totalCostPerGram) * 1000;
    // 公式: 美元毛利 * U行情价
    const profitPerKgJPY = profitPerKg * input.uRate;

    return {
        subsidyUSD,
        priceAfterWater,
        pricePerGram,
        totalCostPerGram,
        shippingPriceJPY,
        tanakaPriceUSD,
        profitPerGram,
        profitPercentage,
        profitPerKg,
        profitPerKgJPY,
    };
}

/**
 * 格式化数字显示
 */
export function formatNumber(value: number, decimals: number = 2): string {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/**
 * 格式化货币显示
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
    const formatted = formatNumber(value);
    switch (currency) {
        case 'USD':
            return `$${formatted}`;
        case 'JPY':
            return `¥${formatted}`;
        case 'HKD':
            return `HK$${formatted}`;
        default:
            return formatted;
    }
}
