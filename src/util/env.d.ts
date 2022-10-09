export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      token_bot: string
    }
  }
}
