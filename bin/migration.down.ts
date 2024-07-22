import { FileMigrationProvider, Kysely, Migrator, PostgresDialect } from "kysely";
import pg from "pg";
import { EnvValidator } from "../src/env.validation.js";
import { Database } from "../src/database/schema.js";
import { promises as fs } from "fs";
import path from "path"

const { Pool } = pg;

async function down() {
      EnvValidator.parse(process.env);

      const db = new Kysely<Database>({
            dialect: new PostgresDialect({
                  pool: new Pool({
                        user: process.env.PG_USERNAME,
                        password: process.env.PG_PASSWORD,
                        host: process.env.PG_HOST,
                        port: Number(process.env.PG_PORT),
                        database: process.env.PG_DATABASE,
                  })
            }),
      });

      const migrator = new Migrator({
            db,
            provider: new FileMigrationProvider({
                  fs,
                  path,
                  migrationFolder: path.join(process.cwd(), "./migrations/"),
            })
      });
      const { error, results } = await migrator.migrateDown()

      results?.forEach((it) => {
            if (it.status === 'Success') {
                  console.log(`migration "${it.migrationName}" was executed successfully`)
            } else if (it.status === 'Error') {
                  console.error(`failed to execute migration "${it.migrationName}"`)
            }
      })

      await db.destroy();

      if (error) {
            console.error('failed to migrate')
            throw error;
      }
}

down().catch((error) => {
      console.error(error);
      process.exit(1);
});
