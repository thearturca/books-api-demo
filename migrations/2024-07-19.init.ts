import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
      await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`.execute(db);

      await db.schema.createTable("Users")
            .ifNotExists()
            .addColumn("id", "uuid", col => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
            .addColumn("email", "varchar(255)", col => col.notNull())
            .addColumn("password", "varchar(255)", col => col.notNull())
            .addColumn("username", "varchar(255)")
            .addColumn("created_at", "timestamptz", col => col.defaultTo(sql`now()`))
            .addColumn("is_verified", "boolean", col => col.defaultTo(false))
            .addColumn("role", "smallint", col => col.defaultTo(0b10)) // Defaults to User
            .execute();

      await db.schema.createTable("Sessions")
            .ifNotExists()
            .addColumn("id", "uuid", col => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
            .addColumn("user_id", "uuid", col => col.references("Users.id"))
            .addColumn("refresh_token", "varchar(1024)", col => col.notNull())
            .addColumn("expires_at", "timestamp", col => col.notNull())
            .addColumn("created_at", "timestamp", col => col.defaultTo(sql`now()`))
            .execute();

      await db.schema.createTable("EmailVerification")
            .ifNotExists()
            .addColumn("id", "uuid", col => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
            .addColumn("user_id", "uuid", col => col.references("Users.id"))
            .addColumn("token", "varchar(1024)", col => col.notNull())
            .addColumn("created_at", "timestamp", col => col.defaultTo(sql`now()`))
            .execute();

      await db.schema.createTable("Books")
            .ifNotExists()
            .addColumn("id", "uuid", col => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
            .addColumn("title", "varchar(255)", col => col.notNull())
            .addColumn("author", "varchar(255)", col => col.notNull())
            .addColumn("created_at", "timestamp", col => col.defaultTo(sql`now()`))
            .addColumn("publicationDate", "timestamp", col => col.notNull())
            .addColumn("genres", "jsonb", col => col.notNull())
            .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
      await db.schema.dropTable("EmailVerification").execute();
      await db.schema.dropTable("Sessions").execute();
      await db.schema.dropTable("Users").execute();
}
