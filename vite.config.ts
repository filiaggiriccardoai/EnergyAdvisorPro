import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// Pages uses the case-sensitive repository path; Electron needs relative paths.
export default defineConfig(({mode}) => ({
  plugins: [react()],
  base: mode === 'github-pages' ? '/EnergyAdvisorPro/' : './',
}));
