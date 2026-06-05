import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        open: true,
        port: 3000,
    },
    build: {
        outDir: 'dist',
    },
    test: {
        globals: true,
        include: ['src/**/*.test.ts'],
    },
});
