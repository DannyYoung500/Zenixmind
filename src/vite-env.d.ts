/// <reference types="vite/client" />

declare module '*.css';
declare module '*.png' {
  const assetUrl: string;
  export default assetUrl;
}
