// Type definitions for import.meta in Node.js environment
interface ImportMetaEnv {
  [key: string]: string | undefined;
}

interface ImportMeta {
  env: ImportMetaEnv;
}
