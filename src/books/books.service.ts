import { Kysely } from "kysely";
import { Database } from "../database/schema.js"
import { BookDto, CreateBookDto } from "./books.dto.js";
import { NotFoundError } from "../types/errors.js";

export class BooksService {
      constructor(private db: Kysely<Database>) {

      }

      async getBooks(): Promise<BookDto[]> {
            return await this.db
                  .selectFrom("Books")
                  .selectAll()
                  .execute()
      }

      async create(book: CreateBookDto) {
            return await this.db
                  .insertInto("Books")
                  .values({
                        ...book,
                        publicationDate: new Date(book.publicationDate),
                        genres: JSON.stringify(book.genres),
                  })
                  .returningAll()
                  .executeTakeFirstOrThrow();
      }

      async getBook(id: BookDto["id"]): Promise<BookDto> {
            const book = await this.db.
                  selectFrom("Books")
                  .selectAll()
                  .where("id", "=", id)
                  .executeTakeFirst();

            if (!book)
                  throw new NotFoundError("Book not found");

            return book;
      }

      async update(id: BookDto["id"], book: CreateBookDto): Promise<BookDto> {
            const updatedBook = await this.db
                  .updateTable("Books")
                  .set({
                        ...book,
                        publicationDate: new Date(book.publicationDate),
                        genres: JSON.stringify(book.genres),
                  })
                  .where("id", "=", id)
                  .returningAll()
                  .executeTakeFirst();

            if (!updatedBook)
                  throw new NotFoundError("Book not found");

            return updatedBook;
      }

      async delete(id: BookDto["id"]): Promise<void> {
            await this.db
                  .deleteFrom("Books")
                  .where("id", "=", id)
                  .execute();
      }
}
