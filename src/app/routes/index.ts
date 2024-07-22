import Router from "@koa/router";
import { booksRouter } from "./books";
import { Context } from "../../types/app";
import { usersRouter } from "./users";
import { DefaultState } from "koa";

export const defaultRouter = new Router<DefaultState, Context>();

defaultRouter.use("/books", booksRouter.routes(), booksRouter.allowedMethods());
defaultRouter.use("/users", usersRouter.routes(), usersRouter.allowedMethods());
