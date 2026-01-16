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
    <div class="min-h-screen bg-[#f5f5f7]">
      <!-- 顶部导航栏 (Compact Header) -->
      <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 h-14 flex items-center mb-6">
        <div class="max-w-[1400px] mx-auto px-6 w-full flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    $
                </div>
                <h1 class="text-lg font-semibold text-[#1d1d1f] tracking-tight">
                  黄金价格计算工具
                </h1>
            </div>
            <p class="text-sm text-[#86868b] hidden sm:block">实时计算套利成本与利润</p>
        </div>
      </header>

      <main class="max-w-[1400px] mx-auto px-6 pb-12 space-y-6">
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- 左侧面板：数据与参数 (占 4/12) -->
            <div class="lg:col-span-4 space-y-6">
                
                <!-- 实时数据卡片 (紧凑版) -->
                <section class="card p-5 transition-apple">
                  <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-semibold text-[#1d1d1f] flex items-center gap-2">
                      <span class="w-2 h-2 bg-[#34c759] rounded-full"></span>
                      实时数据
                    </h2>
                    <button id="btn-refresh" class="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
                      <svg id="refresh-icon" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      刷新
                    </button>
                  </div>
                  
                  <div class="space-y-3">
                    <!-- International Gold -->
                    <div class="flex items-center justify-between p-3 bg-[#f5f5f7] rounded-lg">
                        <div class="flex flex-col">
                             <span class="text-xs text-[#86868b]">国际金价 (USD/oz)</span>
                             <span id="gold-price" class="text-xl font-bold text-[#1d1d1f] tabular-nums">
                                ${currentGoldPrice ? formatNumber(currentGoldPrice.price) : '---'}
                             </span>
                        </div>
                        <div class="text-[10px] text-[#86868b] text-right">
                             <div>goldprice.org</div>
                             <div>${currentGoldPrice ? new Date(currentGoldPrice.timestamp).toLocaleTimeString('zh-CN') : '--:--'}</div>
                        </div>
                    </div>

                    <!-- Tanaka -->
                    <div class="flex items-center justify-between p-3 bg-[#f5f5f7] rounded-lg">
                        <div class="flex flex-col">
                             <span class="text-xs text-[#86868b]">田中买取 (円/g)</span>
                             <span id="tanaka-price" class="text-xl font-bold text-[#1d1d1f] tabular-nums">
                                ${currentTanakaPrice ? formatNumber(currentTanakaPrice.buybackPrice, 0) : '---'}
                             </span>
                        </div>
                        <div class="text-[10px] text-[#86868b] text-right">
                             <div>田中贵金属</div>
                             <div>${currentTanakaPrice ? new Date(currentTanakaPrice.timestamp).toLocaleTimeString('zh-CN') : '--:--'}</div>
                        </div>
                    </div>
                  </div>
                </section>

                <!-- 参数设置 (紧凑版) -->
                <section class="card p-5 transition-apple">
                  <div class="flex items-center justify-between mb-4">
                      <h2 class="text-lg font-semibold text-[#1d1d1f]">参数设置</h2>
                      <span class="text-xs font-normal text-[#fbbf24] bg-[#fffbeb] px-2 py-0.5 rounded-full">可编辑</span>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1">
                      <label class="text-[#86868b] text-xs font-medium">补贴 (HKD)</label>
                      <input type="number" id="input-subsidy" value="25000" 
                        class="w-full input-apple input-highlight font-mono text-[#1d1d1f] text-sm py-2">
                    </div>
                    <div class="space-y-1">
                      <label class="text-[#86868b] text-xs font-medium">汇率 (HKD/USD)</label>
                      <input type="number" id="input-hkd-usd" value="7.69" step="0.01"
                        class="w-full input-apple input-highlight font-mono text-[#1d1d1f] text-sm py-2">
                    </div>
                    <div class="space-y-1">
                      <label class="text-[#86868b] text-xs font-medium">水 (USD/oz)</label>
                      <input type="number" id="input-water" value="10" step="1"
                        class="w-full input-apple input-highlight font-mono text-[#1d1d1f] text-sm py-2">
                    </div>
                    <div class="space-y-1">
                      <label class="text-[#86868b] text-xs font-medium">减价 (JPY)</label>
                      <input type="number" id="input-reduction" value="1550" step="10"
                        class="w-full input-apple input-highlight font-mono text-[#1d1d1f] text-sm py-2">
                    </div>
                    <div class="col-span-2 space-y-1">
                      <label class="text-[#86868b] text-xs font-medium">U行情价</label>
                      <input type="number" id="input-u-rate" value="159.8" step="0.1"
                        class="w-full input-apple input-highlight font-mono text-[#1d1d1f] text-sm py-2">
                    </div>
                  </div>
                  
                  <div class="mt-6">
                    <button id="btn-calculate" class="btn-primary w-full shadow-lg shadow-blue-500/30">
                      开始计算
                    </button>
                  </div>
                </section>

            </div>

            <!-- 右侧面板：结果展示 (占 8/12) -->
            <div class="lg:col-span-8">
                <section class="card p-6 transition-apple h-full min-h-[500px] flex flex-col">
                  <div class="flex items-center justify-between mb-6">
                      <h2 class="text-xl font-semibold text-[#1d1d1f]">计算结果</h2>
                      <button id="btn-save" class="btn-secondary text-sm py-1.5 px-3" ${!currentResult ? 'disabled' : ''}>
                        保存记录
                      </button>
                  </div>
                  
                  ${currentResult ? renderResult(currentResult) : `
                    <div class="flex-1 flex flex-col items-center justify-center text-[#86868b] py-12">
                      <svg class="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                      </svg>
                      <p>请点击左侧"开始计算"按钮</p>
                    </div>
                  `}
                </section>
            </div>
            
        </div>

        <!-- 历史记录卡片 -->
        <section class="card p-6 transition-apple">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-[#1d1d1f]">历史记录</h2>
            <div class="flex gap-2">
              <button id="btn-export" class="btn-secondary text-xs py-1.5 px-3">
                导出 CSV
              </button>
              <button id="btn-clear-history" class="text-xs py-1.5 px-3 text-[#ff3b30] hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100">
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
  const profitBg = result.profitPerGram >= 0 ? 'bg-[#34c759]/5 border-[#34c759]/10' : 'bg-[#ff3b30]/5 border-[#ff3b30]/10'
  const profitSign = result.profitPerGram >= 0 ? '+' : ''

  return `
    <div class="space-y-6 h-full flex flex-col">
      
      <!--  핵심 核心指标的高亮展示 -->
      <div class="grid grid-cols-2 gap-6">
         <!-- 毛利 -->
         <div class="${profitBg} border rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
            <div class="text-[#86868b] mb-1 text-sm font-medium uppercase tracking-wide relative z-10">每克利润 (USD)</div>
            <div class="${profitClass} text-5xl font-bold font-mono tracking-tighter relative z-10 my-2">
                ${profitSign}${formatNumber(result.profitPerGram, 3)}
            </div>
            <div class="${profitClass} text-sm font-medium bg-white/60 px-2 py-0.5 rounded-full relative z-10">
                ${profitSign}${formatNumber(result.profitPercentage)}%
            </div>
         </div>
         
         <!-- 综合毛利 -->
         <div class="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col justify-center space-y-4">
            <div class="flex justify-between items-end border-b border-gray-200 pb-3">
                <span class="text-[#86868b] text-sm font-medium">每公斤毛利 (USD)</span>
                <span class="text-[#1d1d1f] font-bold font-mono text-2xl">${formatNumber(result.profitPerKg, 2)}</span>
            </div>
            <div class="flex justify-between items-end">
                <span class="text-[#86868b] text-sm font-medium">每公斤毛利 (JPY)</span>
                <span class="text-[#1d1d1f] font-bold font-mono text-2xl">${formatNumber(result.profitPerKgJPY, 0)}</span>
            </div>
         </div>
      </div>

      <!-- 详细数据明细 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
        
        <!-- 左边：成本构成 -->
        <div class="bg-white rounded-xl">
           <h3 class="text-sm font-semibold text-[#1d1d1f] mb-4 flex items-center gap-2">
             <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
             成本明细
           </h3>
           <div class="space-y-3 pl-1">
             <div class="flex justify-between items-center text-sm">
               <span class="text-[#86868b]">补贴单价</span>
               <span class="text-[#1d1d1f] font-mono">${formatNumber(result.subsidyUSD, 4)} USD</span>
             </div>
             <div class="flex justify-between items-center text-sm">
               <span class="text-[#86868b]">水后单价</span>
               <span class="text-[#1d1d1f] font-mono">${formatNumber(result.priceAfterWater)} USD/oz</span>
             </div>
             <div class="flex justify-between items-center text-sm">
               <span class="text-[#86868b]">每克单价</span>
               <span class="text-[#1d1d1f] font-mono">${formatNumber(result.pricePerGram, 4)} USD/g</span>
             </div>
             <div class="h-px bg-gray-100 my-2"></div>
             <div class="flex justify-between items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
               <span class="text-[#007aff] font-medium text-sm">每克总成本</span>
               <span class="text-[#007aff] font-bold font-mono text-lg">${formatNumber(result.totalCostPerGram, 4)} USD</span>
             </div>
           </div>
        </div>

        <!-- 右边：收入构成 -->
        <div class="bg-white rounded-xl">
           <h3 class="text-sm font-semibold text-[#1d1d1f] mb-4 flex items-center gap-2">
             <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             收入明细
           </h3>
           <div class="space-y-3 pl-1">
             <div class="flex justify-between items-center text-sm">
               <span class="text-[#86868b]">出货价(JPY)</span>
               <span class="text-[#1d1d1f] font-mono">${formatNumber(result.shippingPriceJPY, 0)} 円</span>
             </div>
             <div class="h-px bg-gray-100 my-2"></div>
             <div class="flex justify-between items-center bg-red-50/50 p-3 rounded-lg border border-red-100/50">
               <span class="text-[#ff3b30] font-medium text-sm">田中单价(USD)</span>
               <span class="text-[#ff3b30] font-bold font-mono text-lg">${formatNumber(result.tanakaPriceUSD, 4)} USD</span>
             </div>
             <div class="mt-4 p-3 bg-gray-50 rounded text-xs text-[#86868b] leading-relaxed">
                * 收入按 Tanaka 买入价扣除减价后计算<br>
                * 美元汇率参考 U行情价
             </div>
           </div>
        </div>

      </div>
    </div>
  `


  // 绑定事件
  bindEvents()
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

    // 自动保存记录
    saveRecord({
      input: {
        goldPriceUSD: currentGoldPrice.price,
        tanakaPrice: currentTanakaPrice.buybackPrice,
        subsidy: input.subsidy,
        hkdToUsd: input.hkdToUsd,
        water: input.water,
        reduction: input.reduction,
        uRate: input.uRate,
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
