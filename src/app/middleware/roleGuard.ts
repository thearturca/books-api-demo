import { Middleware } from "koa";
import { Context, JwtUserState } from "../../types/app";
import { UserRoles } from "../../database/schema";
import { ForbiddenError } from "../../types/errors";

export function roleGuard(role: UserRoles): Middleware<JwtUserState, Context> {
      return async (ctx, next) => {
            const user = await ctx.usersService.me(ctx.state.user.sub);

            if (!ctx.usersService.isRole(user.role, role))
                  throw new ForbiddenError();

            await next();
      }
}
