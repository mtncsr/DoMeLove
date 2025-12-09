import { defineConfig, type UserConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

type VitestPlugin = NonNullable<UserConfig['plugins']>[number]

export default defineConfig({
  // Cast React plugin to Vitest's plugin type to sidestep dual-Vite type mismatch
  plugins: [react() as VitestPlugin],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.ts',
  },
})
