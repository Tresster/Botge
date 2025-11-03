/** @format */

import { defineConfig, type ViteUserConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

const viteUserConfig: ViteUserConfig = defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    name: { label: 'Testge', color: 'cyan' },
    logHeapUsage: true,
    typecheck: {
      enabled: true
    }
  }
});

export default viteUserConfig;
