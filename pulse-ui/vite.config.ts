import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
export default defineConfig(() => {
  const env = loadEnv(process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), svgr()],
    server: {
      port: Number(env.VITE_DEV_PORT) || 3000,
    },
  };
});
