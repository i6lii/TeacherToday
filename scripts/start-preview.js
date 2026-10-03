import { preview } from 'vite'

const port = Number(process.env.PORT) || 10000

const server = await preview({
  preview: {
    host: '0.0.0.0',
    port,
    strictPort: true,
  },
})

server.printUrls()