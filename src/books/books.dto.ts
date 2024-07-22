import { Selectable } from "kysely";
import { z } from "zod";
import { BooksTable } from "../database/schema";

export const CreateBookDtoValidator = z.object({
      title: z.string(),
      author: z.string(),
      publicationDate: z.string().date().or(z.string().datetime()),
      genres: z.array(z.string()),
});

export type CreateBookDto = z.infer<typeof CreateBookDtoValidator>;

export type BookDto = Selectable<BooksTable>;
