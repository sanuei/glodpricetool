import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        tailwindcss(),
        // 开发环境模拟 API
        {
            name: 'mock-api',
            configureServer(server) {
                // 模拟 GoldPrice API
                server.middlewares.use('/api/goldprice', (_req, res) => {
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({
                        price: 4633.57,
                        timestamp: new Date().toISOString(),
                        source: 'goldprice.org (mock)',
                    }))
                })

                // 模拟田中 API
                server.middlewares.use('/api/tanaka', (_req, res) => {
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({
                        buybackPrice: 25931,
                        timestamp: new Date().toISOString(),
                        source: 'gold.tanaka.co.jp (mock)',
                    }))
                })
            },
        },
    ],
})
