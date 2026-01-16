import './style.css'
import { calculate, formatNumber, type CalculatorInput, type CalculatorResult } from './calculator'
import { fetchAllPrices, type GoldPriceData, type TanakaData } from './api'
import { saveRecord, getHistory, downloadCSV, clearHistory, type HistoryRecord } from './history'

// 状态
let currentGoldPrice: GoldPriceData | null = null
let currentTanakaPrice: TanakaData | null = null
let currentResult: CalculatorResult | null = null

// DOM 元素
const app = document.querySelector<HTMLDivElement>('#app')!

// 渲染主界面
function render() {
  app.innerHTML = `
    <div class="min-h-screen bg-[#f5f5f7]">
      <!-- 顶部标题 -->
      <header class="pt-12 pb-6 text-center">
        <h1 class="text-4xl font-semibold text-[#1d1d1f] tracking-tight">
          黄金价格计算工具
        </h1>
        <p class="mt-2 text-[#86868b] text-lg">实时计算黄金套利成本和利润</p>
      </header>

      <main class="max-w-5xl mx-auto px-6 pb-12 space-y-6">
        <!-- 实时数据卡片 -->
        <section class="card p-6 transition-apple">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-[#1d1d1f] flex items-center gap-3">
              <span class="w-2 h-2 bg-[#34c759] rounded-full"></span>
              实时数据
            </h2>
            <button id="btn-refresh" class="btn-primary flex items-center gap-2">
              <svg id="refresh-icon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              刷新数据
            </button>
          </div>
          
          <div class="grid md:grid-cols-2 gap-6">
            <!-- GoldPrice 数据 -->
            <div class="bg-[#f5f5f7] rounded-xl p-5 border border-[#e5e5e5]">
              <div class="flex items-center gap-2 mb-3">
                <span class="w-3 h-3 bg-[#007aff] rounded-full"></span>
                <span class="text-[#1d1d1f] font-medium">国际金价</span>
                <span class="text-xs text-[#86868b] ml-auto">goldprice.org</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span id="gold-price" class="text-3xl font-bold text-[#1d1d1f] tabular-nums">
                  ${currentGoldPrice ? formatNumber(currentGoldPrice.price) : '---'}
                </span>
                <span class="text-[#86868b]">USD/oz</span>
              </div>
              <div id="gold-time" class="text-sm text-[#86868b] mt-2">
                ${currentGoldPrice ? `更新: ${new Date(currentGoldPrice.timestamp).toLocaleString('zh-CN')}` : '点击刷新获取数据'}
              </div>
            </div>
            
            <!-- 田中数据 -->
            <div class="bg-[#f5f5f7] rounded-xl p-5 border border-[#e5e5e5]">
              <div class="flex items-center gap-2 mb-3">
                <span class="w-3 h-3 bg-[#ff3b30] rounded-full"></span>
                <span class="text-[#1d1d1f] font-medium">田中买取价</span>
                <span class="text-xs text-[#86868b] ml-auto">田中贵金属</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span id="tanaka-price" class="text-3xl font-bold text-[#1d1d1f] tabular-nums">
                  ${currentTanakaPrice ? formatNumber(currentTanakaPrice.buybackPrice, 0) : '---'}
                </span>
                <span class="text-[#86868b]">円/g</span>
              </div>
              <div id="tanaka-time" class="text-sm text-[#86868b] mt-2">
                ${currentTanakaPrice ? `更新: ${new Date(currentTanakaPrice.timestamp).toLocaleString('zh-CN')}` : '点击刷新获取数据'}
              </div>
            </div>
          </div>
        </section>

        <!-- 参数输入卡片 -->
        <section class="card p-6 transition-apple">
          <h2 class="text-xl font-semibold text-[#1d1d1f] mb-6 flex items-center gap-2">
            参数设置
            <span class="text-sm font-normal text-[#fbbf24] bg-[#fffbeb] px-2 py-1 rounded-full">可编辑</span>
          </h2>
          
          <div class="grid md:grid-cols-5 gap-4">
            <div class="space-y-2">
              <label class="text-[#86868b] text-sm font-medium">补贴 (港币)</label>
              <input type="number" id="input-subsidy" value="25000" 
                class="w-full input-apple input-highlight font-mono text-[#1d1d1f]">
            </div>
            <div class="space-y-2">
              <label class="text-[#86868b] text-sm font-medium">港币/美金</label>
              <input type="number" id="input-hkd-usd" value="7.69" step="0.01"
                class="w-full input-apple input-highlight font-mono text-[#1d1d1f]">
            </div>
            <div class="space-y-2">
              <label class="text-[#86868b] text-sm font-medium">水 (USD/oz)</label>
              <input type="number" id="input-water" value="10" step="1"
                class="w-full input-apple input-highlight font-mono text-[#1d1d1f]">
            </div>
            <div class="space-y-2">
              <label class="text-[#86868b] text-sm font-medium">减价 (日元)</label>
              <input type="number" id="input-reduction" value="1550" step="10"
                class="w-full input-apple input-highlight font-mono text-[#1d1d1f]">
            </div>
            <div class="space-y-2">
              <label class="text-[#86868b] text-sm font-medium">U行情价</label>
              <input type="number" id="input-u-rate" value="159.8" step="0.1"
                class="w-full input-apple input-highlight font-mono text-[#1d1d1f]">
            </div>
          </div>
          
          <div class="mt-6 flex gap-3">
            <button id="btn-calculate" class="btn-primary">
              计算
            </button>
            <button id="btn-save" class="btn-secondary" ${!currentResult ? 'disabled' : ''}>
              保存记录
            </button>
          </div>
        </section>

        <!-- 计算结果卡片 -->
        <section class="card p-6 transition-apple">
          <h2 class="text-xl font-semibold text-[#1d1d1f] mb-6">计算结果</h2>
          
          ${currentResult ? renderResult(currentResult) : `
            <div class="text-center py-12 text-[#86868b]">
              请先刷新数据并点击"计算"按钮
            </div>
          `}
        </section>

        <!-- 历史记录卡片 -->
        <section class="card p-6 transition-apple">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-[#1d1d1f]">历史记录</h2>
            <div class="flex gap-2">
              <button id="btn-export" class="btn-secondary text-sm py-2">
                导出 CSV
              </button>
              <button id="btn-clear-history" class="text-sm py-2 px-4 text-[#ff3b30] hover:bg-red-50 rounded-lg transition-all">
                清空
              </button>
            </div>
          </div>
          
          ${renderHistory()}
        </section>
      </main>
      
      <!-- 页脚 -->
      <footer class="text-center py-8 text-[#86868b] text-sm">
        © 2026 黄金价格计算工具
      </footer>
    </div>
  `

  // 绑定事件
  bindEvents()
}

// 渲染计算结果
function renderResult(result: CalculatorResult): string {
  const profitClass = result.profitPerGram >= 0 ? 'text-[#34c759]' : 'text-[#ff3b30]'
  const profitBg = result.profitPerGram >= 0 ? 'bg-[#34c759]/5 border-[#34c759]/20' : 'bg-[#ff3b30]/5 border-[#ff3b30]/20'
  const profitSign = result.profitPerGram >= 0 ? '+' : ''

  // 6. 综合利润计算 (新增)
  // 公式: (田中单价 - 每克总成本) * 1000
  // const profitPerKg = (tanakaPriceUSD - totalCostPerGram) * 1000;
  // 公式: 美元毛利 * U行情价
  // const profitPerKgJPY = profitPerKg * input.uRate;

  return `
    <div class="space-y-6">
      <!-- 成本计算 -->
      <div class="grid md:grid-cols-2 gap-6">
        <!-- 左侧：成本 -->
        <div class="space-y-4">
          <h3 class="text-base font-semibold text-[#1d1d1f] pb-3 border-b border-[#e5e5e5]">成本计算</h3>
          
          <div class="space-y-3">
            <div class="flex justify-between items-center py-2">
              <span class="text-[#86868b]">补贴单价</span>
              <span class="text-[#1d1d1f] font-mono font-medium">${formatNumber(result.subsidyUSD, 4)} USD</span>
            </div>
            <div class="flex justify-between items-center py-2">
              <span class="text-[#86868b]">水后单价</span>
              <span class="text-[#1d1d1f] font-mono font-medium">${formatNumber(result.priceAfterWater)} USD/oz</span>
            </div>
            <div class="flex justify-between items-center py-2">
              <span class="text-[#86868b]">每克单价</span>
              <span class="text-[#1d1d1f] font-mono font-medium">${formatNumber(result.pricePerGram, 4)} USD/g</span>
            </div>
            <div class="flex justify-between items-center py-3 bg-[#f5f5f7] rounded-xl px-4 -mx-4">
              <span class="text-[#1d1d1f] font-semibold">每克总成本</span>
              <span class="text-[#007aff] font-bold font-mono text-lg">${formatNumber(result.totalCostPerGram, 4)} USD/g</span>
            </div>
          </div>
        </div>
        
        <!-- 右侧：收入 -->
        <div class="space-y-4">
          <h3 class="text-base font-semibold text-[#1d1d1f] pb-3 border-b border-[#e5e5e5]">田中收入</h3>
          
          <div class="space-y-3">
            <div class="flex justify-between items-center py-2">
              <span class="text-[#86868b]">出货价 (日元)</span>
              <span class="text-[#1d1d1f] font-mono font-medium">${formatNumber(result.shippingPriceJPY, 0)} 円</span>
            </div>
            <div class="flex justify-between items-center py-3 bg-[#f5f5f7] rounded-xl px-4 -mx-4">
              <span class="text-[#1d1d1f] font-semibold">田中单价</span>
              <span class="text-[#ff3b30] font-bold font-mono text-lg">${formatNumber(result.tanakaPriceUSD, 4)} USD/g</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 利润展示 -->
      <div class="${profitBg} border rounded-2xl p-6 text-center">
        <div class="text-[#86868b] mb-2 text-sm font-medium uppercase tracking-wide">每克利润</div>
        <div class="flex items-center justify-center gap-4 mb-6">
          <span class="${profitClass} text-4xl font-bold font-mono tracking-tight">
            ${profitSign}${formatNumber(result.profitPerGram, 4)} USD
          </span>
          <span class="${profitClass} text-xl font-medium">
            (${profitSign}${formatNumber(result.profitPercentage)}%)
          </span>
        </div>

        <!-- 综合利润展示 (新增) -->
        <div class="grid grid-cols-2 gap-4 pt-6 border-t border-${profitClass}/20">
            <div>
                <div class="text-[#86868b] text-xs mb-1">每公斤毛利 (USD)</div>
                <div class="text-[#1d1d1f] font-bold font-mono text-xl">${formatNumber(result.profitPerKg, 4)}</div>
            </div>
            <div>
                <div class="text-[#86868b] text-xs mb-1">每公斤毛利 (JPY)</div>
                <div class="text-[#1d1d1f] font-bold font-mono text-xl">${formatNumber(result.profitPerKgJPY, 2)}</div>
            </div>
        </div>
      </div>
    </div>
  `
}

// 渲染历史记录
function renderHistory(): string {
  const history = getHistory()

  if (history.length === 0) {
    return `<div class="text-center py-8 text-[#86868b]">暂无历史记录</div>`
  }

  return `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-[#86868b] border-b border-[#e5e5e5]">
            <th class="text-left py-3 px-2 font-medium">时间</th>
            <th class="text-right py-3 px-2 font-medium">国际金价</th>
            <th class="text-right py-3 px-2 font-medium">田中价格</th>
            <th class="text-right py-3 px-2 font-medium">总成本</th>
            <th class="text-right py-3 px-2 font-medium">田中单价</th>
            <th class="text-right py-3 px-2 font-medium">利润</th>
          </tr>
        </thead>
        <tbody>
          ${history.slice(0, 10).map((r: HistoryRecord) => {
    const profitClass = r.result.profitPerGram >= 0 ? 'text-[#34c759]' : 'text-[#ff3b30]'
    return `
              <tr class="border-b border-[#f5f5f7] hover:bg-[#f5f5f7] transition-colors">
                <td class="py-3 px-2 text-[#1d1d1f]">${new Date(r.timestamp).toLocaleString('zh-CN')}</td>
                <td class="py-3 px-2 text-right text-[#007aff] font-mono">${formatNumber(r.input.goldPriceUSD)}</td>
                <td class="py-3 px-2 text-right text-[#ff3b30] font-mono">${formatNumber(r.input.tanakaPrice, 0)}</td>
                <td class="py-3 px-2 text-right text-[#1d1d1f] font-mono">${formatNumber(r.result.totalCostPerGram, 4)}</td>
                <td class="py-3 px-2 text-right text-[#1d1d1f] font-mono">${formatNumber(r.result.tanakaPriceUSD, 4)}</td>
                <td class="py-3 px-2 text-right ${profitClass} font-mono font-medium">${formatNumber(r.result.profitPerGram, 4)}</td>
              </tr>
            `
  }).join('')}
        </tbody>
      </table>
    </div>
    ${history.length > 10 ? `<div class="text-center mt-4 text-[#86868b] text-sm">显示最近10条，共${history.length}条记录</div>` : ''}
  `
}

// 绑定事件
function bindEvents() {
  // 刷新按钮
  document.getElementById('btn-refresh')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-refresh')!
    const icon = document.getElementById('refresh-icon')!

    btn.setAttribute('disabled', 'true')
    icon.classList.add('loading-spinner')

    try {
      const { goldPrice, tanakaPrice } = await fetchAllPrices()
      currentGoldPrice = goldPrice
      currentTanakaPrice = tanakaPrice
      render()
    } catch (error) {
      alert('获取数据失败，请稍后重试')
      console.error(error)
    } finally {
      btn.removeAttribute('disabled')
      icon.classList.remove('loading-spinner')
    }
  })

  // 计算按钮
  document.getElementById('btn-calculate')?.addEventListener('click', () => {
    if (!currentGoldPrice || !currentTanakaPrice) {
      alert('请先刷新获取实时数据')
      return
    }

    const input: CalculatorInput = {
      goldPriceUSD: currentGoldPrice.price,
      tanakaPrice: currentTanakaPrice.buybackPrice,
      subsidy: parseFloat((document.getElementById('input-subsidy') as HTMLInputElement).value) || 0,
      hkdToUsd: parseFloat((document.getElementById('input-hkd-usd') as HTMLInputElement).value) || 7.69,
      water: parseFloat((document.getElementById('input-water') as HTMLInputElement).value) || 0,
      reduction: parseFloat((document.getElementById('input-reduction') as HTMLInputElement).value) || 0,
      uRate: parseFloat((document.getElementById('input-u-rate') as HTMLInputElement).value) || 159.8,
    }

    currentResult = calculate(input)
    render()
  })

  // 保存按钮
  document.getElementById('btn-save')?.addEventListener('click', () => {
    if (!currentResult || !currentGoldPrice || !currentTanakaPrice) return

    saveRecord({
      input: {
        goldPriceUSD: currentGoldPrice.price,
        tanakaPrice: currentTanakaPrice.buybackPrice,
        subsidy: parseFloat((document.getElementById('input-subsidy') as HTMLInputElement).value) || 0,
        hkdToUsd: parseFloat((document.getElementById('input-hkd-usd') as HTMLInputElement).value) || 7.69,
        water: parseFloat((document.getElementById('input-water') as HTMLInputElement).value) || 0,
        reduction: parseFloat((document.getElementById('input-reduction') as HTMLInputElement).value) || 0,
        uRate: parseFloat((document.getElementById('input-u-rate') as HTMLInputElement).value) || 159.8,
      },
      result: {
        totalCostPerGram: currentResult.totalCostPerGram,
        tanakaPriceUSD: currentResult.tanakaPriceUSD,
        profitPerGram: currentResult.profitPerGram,
        profitPercentage: currentResult.profitPercentage,
        profitPerKg: currentResult.profitPerKg,
        profitPerKgJPY: currentResult.profitPerKgJPY,
      },
    })

    render()
  })

  // 导出按钮
  document.getElementById('btn-export')?.addEventListener('click', () => {
    downloadCSV()
  })

  // 清空历史
  document.getElementById('btn-clear-history')?.addEventListener('click', () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      clearHistory()
      render()
    }
  })
}

// 初始化
render()
