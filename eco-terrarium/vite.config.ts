import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    // 기본 포트가 사용 중이면 Vite가 다음 사용 가능한 포트를 자동으로 찾는다.
    strictPort: false,
    open: false,
  },
  preview: {
    port: 3000,
    // preview 서버도 개발 서버와 동일하게 포트 충돌을 우회한다.
    strictPort: false,
  },
});
