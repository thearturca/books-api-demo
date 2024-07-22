import { Kysely } from "kysely";
import { Database } from "../database/schema.js";
import { UsersService } from "../users/users.service.js";
import { BooksService } from "../books/books.service.js";
import { JwtRefreshService, JwtService } from "../jwt/jwt.service.js";
import { EmailService } from "../email/email.service.js";
import { JwtPayload } from "../jwt/jwt.dto.js";
import { Config as EmailConfig } from "../email/email.service.js";
import { Config as JwtConfig } from "../jwt/jwt.service.js";

export type Config = {
      port: number,
      db: Kysely<Database>
      jwt: JwtConfig,
      jwtRefresh: JwtConfig,
      email: EmailConfig,
}

export type Context = {
      usersService: UsersService,
      booksService: BooksService,
      jwtService: JwtService,
      jwtRefreshService: JwtRefreshService,
      emailService: EmailService,
}

export type JwtUserState = {
      user: JwtPayload
}
