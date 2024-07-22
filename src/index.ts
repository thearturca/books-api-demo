import { Kysely, PostgresDialect } from "kysely";
import { EnvValidator } from "./env.validation";
import { Database } from "./database/schema.js";
import pg from "pg";
import { createAppAndListen } from "./app/index.js";
import { promises as fs } from "node:fs";

const { Pool } = pg;

async function main() {
      EnvValidator.parse(process.env);

      const db = new Kysely<Database>({
            dialect: new PostgresDialect({
                  pool: new Pool({
                        user: process.env.PG_USERNAME,
                        password: process.env.PG_PASSWORD,
                        host: process.env.PG_HOST,
                        port: Number(process.env.PG_PORT),
                        database: process.env.PG_DATABASE,
                  }),
            }),
      });

      const publicKey = await fs.readFile(process.env.JWT_ACCESS_PUBLIC_KEY, "utf-8");
      const privateKey = await fs.readFile(process.env.JWT_ACCESS_PRIVATE_KEY, "utf-8");

      const [app, server] = createAppAndListen({
            db,
            port: Number(process.env.PORT),
            jwt: {
                  secret: privateKey,
                  publicKey,
                  expires: process.env.JWT_ACCESS_EXPIRES,
            },
            jwtRefresh: {
                  secret: process.env.JWT_REFRESH_SECRET,
                  expires: process.env.JWT_REFRESH_EXPIRES,
            },
            email: {
                  host: process.env.SMTP_HOST,
                  port: Number(process.env.SMTP_PORT),
                  username: process.env.SMTP_USER,
                  password: process.env.SMTP_PASSWORD,
            },
      });

      console.log("Listening on port %s", process.env.PORT);

      process.once('SIGINT', () => {
            app.removeAllListeners();
            server.close((err) => {
                  process.exit(err ? 1 : 0);
            });
      });
      process.once('SIGTERM', () => {
            app.removeAllListeners();
            server.close((err) => {
                  process.exit(err ? 1 : 0);
            });
      });
}

main().catch((error) => {
      console.error(error);
      process.exit(1);
});
