import Koa from "koa";
import { JwtUserState, Context } from "../../types/app";
import { UnauthorizedError } from "../../types/errors";

export function jwtAuth(): Koa.Middleware<JwtUserState, Context> {
      return async (ctx, next) => {
            const authorization = ctx.headers.authorization;

            if (!authorization)
                  throw new UnauthorizedError();


            const [type, token] = authorization.split(" ");

            if (type !== "Bearer")
                  throw new UnauthorizedError();

            if (!token)
                  throw new UnauthorizedError();

            try {
                  const payload = await ctx.jwtService.verify(token);

                  ctx.state.user = {
                        ...payload,
                  };
            } catch (error) {
                  throw new UnauthorizedError();
            }

            await ctx.usersService.validateSession(ctx.state.user.sub, ctx.state.user.sessionId);

            await next();
      }
}

export function jwtRefreshAuth(): Koa.Middleware<JwtUserState, Context> {
      return async (ctx, next) => {
            const authorization = ctx.headers.authorization;

            if (!authorization)
                  throw new UnauthorizedError();

            const [type, token] = authorization.split(" ");

            if (type !== "Bearer")
                  throw new UnauthorizedError();

            if (!token)
                  throw new UnauthorizedError();

            try {
                  const payload = await ctx.jwtRefreshService.verify(token);

                  ctx.state.user = {
                        ...payload,
                  };
            } catch (error) {
                  throw new UnauthorizedError();
            }

            const isRefreshValid = await ctx.usersService.validateRefreshToken(ctx.state.user.sub, token);

            if (!isRefreshValid)
                  throw new UnauthorizedError();

            await next();
      };
}
