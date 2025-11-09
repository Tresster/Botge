/** @format */

import { defineConfig, type ViteUserConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

const viteUserConfig: ViteUserConfig = defineConfig({
  plugins: [tsconfigPaths({ parseNative: true })],
  test: {
    name: { label: 'Testge', color: 'cyan' },
    logHeapUsage: true
  }
});

export default viteUserConfig;
