import Router from "@koa/router";
import { DefaultState } from "koa";
import { Context } from "../../types/app";
import { koaBody } from "koa-body";
import { EmailVerificationDtoValidator, LoginDtoValidator, RegisterDtoValidator, RolesDtoValidator } from "../../users/users.dto";
import { jwtAuth, jwtRefreshAuth, roleGuard } from "../middleware";
import { UnauthorizedError, UnsupportedMediaTypeError, ValidationError } from "../../types/errors";
import { UserRole } from "../../database/schema";
import { z } from "zod";

export const usersRouter = new Router<DefaultState, Context>();

usersRouter.post("/register", koaBody(), async (ctx) => {
      if (ctx.headers["content-type"] !== "application/json")
            throw new UnsupportedMediaTypeError();

      const registerDto = RegisterDtoValidator.safeParse(ctx.request.body);

      if (!registerDto.success)
            throw new ValidationError();

      const createdUser = await ctx.usersService.register(registerDto.data);

      ctx.body = createdUser;
      ctx.status = 201;
});

usersRouter.post("/login", koaBody(), async (ctx) => {
      if (ctx.headers["content-type"] !== "application/json")
            throw new UnsupportedMediaTypeError();

      const loginDto = LoginDtoValidator.safeParse(ctx.request.body);

      if (!loginDto.success)
            throw new ValidationError();

      const tokens = await ctx.usersService.login(loginDto.data);

      ctx.body = tokens;
      ctx.status = 200;
});

usersRouter.post("/verify", jwtAuth(), koaBody(), async (ctx) => {
      if (ctx.headers["content-type"] !== "application/json")
            throw new UnsupportedMediaTypeError();


      const verificationDto = EmailVerificationDtoValidator.safeParse(ctx.request.body);

      if (!verificationDto.success)
            throw new ValidationError();

      const user = await ctx.usersService.verifyEmail(ctx.state.user.sub, verificationDto.data.code);

      ctx.body = user;
      ctx.status = 200;
});

usersRouter.post("/refresh", jwtRefreshAuth(), async (ctx) => {
      const payload = ctx.state.user;
      const token = ctx.headers.authorization?.split(" ")[1];

      if (!token)
            throw new UnauthorizedError();

      const tokens = await ctx.usersService.refreshToken(payload.sub, token, payload.sessionId);
      ctx.body = tokens;
      ctx.status = 200;
});

usersRouter.post("/logout", jwtAuth(), async (ctx) => {
      await ctx.usersService.logout(ctx.state.user.sub, ctx.state.user.sessionId);
      ctx.status = 204;
});

usersRouter.post("/logout-all", jwtAuth(), async (ctx) => {
      await ctx.usersService.logoutAll(ctx.state.user.sub);
      ctx.status = 204;
});

usersRouter.get("/me", jwtAuth(), async (ctx) => {
      const user = await ctx.usersService.me(ctx.state.user.sub);

      ctx.body = user;
      ctx.status = 200;
});

usersRouter.put("/:id/role", jwtAuth(), roleGuard(UserRole.ADMIN), koaBody(), async (ctx) => {
      const userId = z.string().uuid().safeParse(ctx.params.id);

      if (!userId.success)
            throw new ValidationError();

      if (ctx.headers["content-type"] !== "application/json")
            throw new UnsupportedMediaTypeError();


      const roleDto = RolesDtoValidator.safeParse(ctx.request.body);

      if (!roleDto.success)
            throw new ValidationError();

      const updatedUser = await ctx.usersService.updateRole(userId.data, roleDto.data.role);

      ctx.body = updatedUser;
      ctx.status = 200;
});
