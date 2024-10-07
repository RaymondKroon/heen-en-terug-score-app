import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import rust from "@wasm-tool/rollup-plugin-rust";
import {nodePolyfills} from 'vite-plugin-node-polyfills';
import resolve from "@rollup/plugin-node-resolve";


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

  plugins: [
    svelte(),
    rustPluginInstance,
    resolve({ browser: true, preferBuiltins: false, }),
    nodePolyfills()],
})
