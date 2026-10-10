import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 로컬 dev 서버에서 원격 API(staging 등)에 붙을 때 — .env.local에
  //   VITE_API_URL=/api
  //   DEV_PROXY_TARGET=https://api-staging.lunoteapp.com
  // 브라우저는 같은 오리진(/api)만 호출하고 Vite가 중계하므로 API의 CORS 허용 목록에 localhost를 넣을 필요가 없다.
  const target = loadEnv(mode, process.cwd(), '').DEV_PROXY_TARGET
  return {
    plugins: [react()],
    server: target
      ? {
          proxy: {
            '/api': {
              target,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          },
        }
      : undefined,
  }
})
