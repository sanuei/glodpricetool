/**
 * 历史记录模块
 */

export interface HistoryRecord {
    id: string;
    timestamp: string;
    input: {
        goldPriceUSD: number;
        tanakaPrice: number;
        subsidy: number;
        hkdToUsd: number;
        water: number;
        reduction: number;
        uRate: number;
    };
    result: {
        totalCostPerGram: number;
        tanakaPriceUSD: number;
        profitPerGram: number;
        profitPercentage: number;
        profitPerKg: number;
        profitPerKgJPY: number;
    };
}

const STORAGE_KEY = 'gold_calculator_history';
const MAX_RECORDS = 100;

/**
 * 获取所有历史记录
 */
export function getHistory(): HistoryRecord[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * 保存一条记录
 */
export function saveRecord(record: Omit<HistoryRecord, 'id' | 'timestamp'>): HistoryRecord {
    const history = getHistory();

    const newRecord: HistoryRecord = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...record,
    };

    // 添加到开头
    history.unshift(newRecord);

    // 限制数量
    if (history.length > MAX_RECORDS) {
        history.pop();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return newRecord;
}

/**
 * 删除一条记录
 */
export function deleteRecord(id: string): void {
    const history = getHistory().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

/**
 * 清空所有记录
 */
export function clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * 导出为 CSV
 */
export function exportToCSV(): string {
    const history = getHistory();

    const headers = [
        '时间',
        '国际金价(USD/oz)',
        '田中价格(JPY/g)',
        '补贴(HKD)',
        '港币/美金',
        '水(USD/oz)',
        '减价(JPY)',
        'U行情价',
        '总成本(USD/g)',
        '田中单价(USD/g)',
        '利润(USD/g)',
        '利润率(%)',
        '每公斤毛利(USD)',
        '每公斤毛利(JPY)',
    ];

    const rows = history.map(r => [
        new Date(r.timestamp).toLocaleString('zh-CN'),
        r.input.goldPriceUSD,
        r.input.tanakaPrice,
        r.input.subsidy,
        r.input.hkdToUsd,
        r.input.water,
        r.input.reduction,
        r.input.uRate,
        r.result.totalCostPerGram.toFixed(4),
        r.result.tanakaPriceUSD.toFixed(4),
        r.result.profitPerGram.toFixed(4),
        r.result.profitPercentage.toFixed(2),
        // 兼容旧数据，如果有则显示，没有显示 0
        (r.result.profitPerKg || 0).toFixed(4),
        (r.result.profitPerKgJPY || 0).toFixed(2),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * 下载 CSV 文件
 */
export function downloadCSV(): void {
    const csv = exportToCSV();
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const timestamp = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0');

    const link = document.createElement('a');
    link.href = url;
    link.download = `gold_price_history_${timestamp}.csv`;
    link.click();

    URL.revokeObjectURL(url);
}
