import { z } from "zod";

export const EnvValidator = z.object({
      PORT: z.string(),

      PG_USERNAME: z.string(),
      PG_PASSWORD: z.string(),
      PG_HOST: z.string(),
      PG_PORT: z.string(),
      PG_DATABASE: z.string(),

      JWT_REFRESH_SECRET: z.string(),
      JWT_REFRESH_EXPIRES: z.string(),

      JWT_ACCESS_PUBLIC_KEY: z.string(),
      JWT_ACCESS_PRIVATE_KEY: z.string(),
      JWT_ACCESS_EXPIRES: z.string(),

      SMTP_HOST: z.string(),
      SMTP_PORT: z.string(),
      SMTP_USER: z.string(),
      SMTP_PASSWORD: z.string(),
});

export type EnvSchema = z.infer<typeof EnvValidator>;
