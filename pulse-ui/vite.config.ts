import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const configuredPort = Number.parseInt(env.VITE_APP_PORT ?? "3000", 10);

  return {
    plugins: [react(), tailwindcss(), svgr()],
    server: {
      port: Number.isNaN(configuredPort) ? 3000 : configuredPort,
    },
  };
});
