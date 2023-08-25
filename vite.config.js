import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import rust from "@wasm-tool/rollup-plugin-rust";


let rustPluginInstance = rust({
  verbose: true,
  serverPath: ""
});
rustPluginInstance["handleHotUpdate"] = (ctx) => {
  if (ctx.file.endsWith(".rs")) {
    console.log("Rust code changed");
    ctx.server.restart();
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), rustPluginInstance],
})
