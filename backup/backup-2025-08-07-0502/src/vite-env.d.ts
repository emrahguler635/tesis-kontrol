/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_MONGODB_URI: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 