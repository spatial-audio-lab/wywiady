import path from "path"
import { fileURLToPath } from "url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    base: env.VITE_BASE_URL || "/wywiady/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      // Do NOT inline any assets — keep audio files as separate fetches
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          // Keep JS chunks readable for debugging
          manualChunks: {
            react: ["react", "react-dom"],
          },
        },
      },
    },
  }
})
