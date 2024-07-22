import { EnvSchema } from "./env.validation.ts";

declare global {
      namespace NodeJS {
            interface ProcessEnv extends EnvSchema { }
      }
}

export { }
