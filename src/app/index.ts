import Koa, { DefaultState } from "koa";
import { Config, Context } from "../types/app.js";
import { Server } from "http";
import { UsersService } from "../users/users.service.js";
import { BooksService } from "../books/books.service.js";
import { defaultRouter } from "./routes/index.js";
import { JwtRefreshService, JwtService } from "../jwt/jwt.service.js";
import { EmailService } from "../email/email.service.js";
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, UnsupportedMediaTypeError, ValidationError } from "../types/errors.js";

export function createAppAndListen(config: Config): [Koa<DefaultState, Context>, Server] {
      const app = new Koa<DefaultState, Context>();
      const server = app.listen(config.port);

      const jwtService = new JwtService(config.jwt);

      const jwtRefreshService = new JwtRefreshService(config.jwtRefresh);

      const emailService = new EmailService(config.email);
      const userService = new UsersService(config.db, emailService, jwtService, jwtRefreshService);
      const booksService = new BooksService(config.db);

      app.context.usersService = userService;
      app.context.booksService = booksService;
      app.context.jwtService = jwtService;
      app.context.jwtRefreshService = jwtRefreshService;
      app.context.emailService = emailService;

      app.use(async (ctx, next) => {
            try {
                  await next();
            } catch (error) {
                  switch (true) {
                        case error instanceof UnauthorizedError:
                              ctx.status = 401;
                              break;

                        case error instanceof ForbiddenError:
                              ctx.status = 403;
                              break;

                        case error instanceof NotFoundError:
                              ctx.status = 404;
                              break;

                        case error instanceof ConflictError:
                              ctx.status = 409;
                              break;

                        case error instanceof ValidationError:
                              ctx.status = 400;
                              break;

                        case error instanceof UnsupportedMediaTypeError:
                              ctx.status = 415;
                              break;

                        default:
                              throw error;
                  }
            }
      });

      app.use(defaultRouter.routes()).use(defaultRouter.allowedMethods());

      return [app, server];
}
