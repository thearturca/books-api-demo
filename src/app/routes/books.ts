import Router from "@koa/router";
import { Context } from "../../types/app";
import { DefaultState } from "koa";
import { jwtAuth, roleGuard } from "../middleware";
import { UnsupportedMediaTypeError, ValidationError } from "../../types/errors";
import { CreateBookDtoValidator } from "../../books/books.dto";
import koaBody from "koa-body";
import { UserRole } from "../../database/schema";
import { z } from "zod";

export const booksRouter = new Router<DefaultState, Context>();

booksRouter.post("/", jwtAuth(), roleGuard(UserRole.ADMIN), koaBody(), async (ctx) => {
      if (ctx.headers["content-type"] !== "application/json")
            throw new UnsupportedMediaTypeError();

      const bookDto = CreateBookDtoValidator.safeParse(ctx.request.body);

      if (!bookDto.success)
            throw new ValidationError();

      const createdBook = await ctx.booksService.create(bookDto.data);

      ctx.body = createdBook;
      ctx.status = 201;
});

booksRouter.get("/", async (ctx) => {
      const books = await ctx.booksService.getBooks();
      ctx.body = books;
      ctx.status = 200;
});

booksRouter.get("/:id", async (ctx) => {
      const bookId = z.string().uuid().safeParse(ctx.params.id);

      if (!bookId.success)
            throw new ValidationError();

      const book = await ctx.booksService.getBook(bookId.data);

      ctx.body = book;
      ctx.status = 200;
});

booksRouter.put("/:id", jwtAuth(), roleGuard(UserRole.ADMIN), koaBody(), async (ctx) => {
      const bookId = z.string().uuid().safeParse(ctx.params.id);

      if (!bookId.success)
            throw new ValidationError();

      if (ctx.headers["content-type"] !== "application/json")
            throw new UnsupportedMediaTypeError();

      const bookDto = CreateBookDtoValidator.safeParse(ctx.request.body);

      if (!bookDto.success)
            throw new ValidationError();

      const updatedBook = await ctx.booksService.update(bookId.data, bookDto.data);

      ctx.body = updatedBook;
      ctx.status = 200;
});

booksRouter.delete("/:id", jwtAuth(), roleGuard(UserRole.ADMIN), async (ctx) => {
      const bookId = z.string().uuid().safeParse(ctx.params.id);

      if (!bookId.success)
            throw new ValidationError();

      await ctx.booksService.delete(bookId.data);
      ctx.status = 204;
});
