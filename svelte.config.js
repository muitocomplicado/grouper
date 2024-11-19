import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Keep the existing preprocess configuration
    preprocess: vitePreprocess(),

    kit: {
        // Replace adapter-auto with adapter-static
        adapter: adapter({
            // Directory to output the static build
            pages: 'build',
            assets: 'build',
            // Fallback for SPA routing
            fallback: 'index.html',
            // Enable strict mode for better error checking
            strict: true
        }),
        prerender: {
            entries: ['/', '/groups']
        }
    }
};

export default config;
