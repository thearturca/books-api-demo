import { Generated, ColumnType } from "kysely"

export const UserRole = {
      USER: 0b10,
      ADMIN: 0b01
} as const;

export type UserRoles = typeof UserRole[keyof typeof UserRole];

export interface Database {
      Users: UsersTable,
      EmailVerification: EmailVerificationTable,
      Books: BooksTable,
      Sessions: SessionsTable,
}

export interface UsersTable {
      id: Generated<string>,
      email: string,
      password: string,
      username: string,
      is_verified: ColumnType<boolean, boolean | undefined, boolean>,
      role: ColumnType<number, number | undefined, number>,
      created_at: Generated<Date>
}

export interface EmailVerificationTable {
      id: Generated<number>,
      user_id: string,
      token: string,
      created_at: Generated<Date>
}

export interface SessionsTable {
      id: Generated<string>,
      user_id: string,
      refresh_token: string,
      expires_at: ColumnType<Date, string, string>,
      created_at: Generated<Date>
}

export interface BooksTable {
      id: Generated<string>,
      title: string,
      author: string,
      created_at: Generated<Date>
      publicationDate: Date,
      genres: ColumnType<string[], string, string>
}
