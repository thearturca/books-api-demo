import { Kysely } from "kysely";
import { Database, UserRole, UserRoles } from "../database/schema.js"
import { JwtDto, LoginDto, RegisterDto, UserDto } from "./users.dto.js";
import crypto from "crypto";
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from "../types/errors.js";
import { EmailService } from "../email/email.service.js";
import { JwtRefreshService, JwtService } from "../jwt/jwt.service.js";
import { JwtPayload } from "../jwt/jwt.dto.js";

export class UsersService {
      constructor(
            private db: Kysely<Database>,
            private emailService: EmailService,
            private jwtService: JwtService,
            private jwtRefreshService: JwtRefreshService
      ) {
      }

      private hashPassword(password: string, salt?: string): Promise<string> {
            return new Promise((resolve, reject) => {
                  if (!salt)
                        salt = crypto.randomBytes(16).toString('hex');

                  crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, deriveKey) => {
                        if (err) {
                              reject(err);
                              return;
                        }

                        resolve(deriveKey.toString('hex') + ":" + salt);
                  });
            })
      }

      private async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
            const hash = await this.hashPassword(password, hashedPassword.split(':')[1]);

            return hash === hashedPassword;
      }

      public async register(user: RegisterDto): Promise<UserDto> {
            const existingUser = await this.db
                  .selectFrom("Users")
                  .select(["id"])
                  .where((eb) => eb.or([eb("username", "=", user.username), eb("email", "=", user.email)]))
                  .executeTakeFirst();

            if (existingUser) {
                  throw new ConflictError("User already exists");
            }

            user.password = await this.hashPassword(user.password);

            const createdUser = await this.db
                  .insertInto("Users")
                  .values(user)
                  .returning(["id", "username", "email", "role", "is_verified", "created_at"])
                  .executeTakeFirstOrThrow();

            await this.createVerification(createdUser.id);

            return createdUser;
      }

      public async createVerification(userId: UserDto["id"]): Promise<void> {
            const user = await this.db.selectFrom("Users")
                  .select(["id", "username", "email", "role", "is_verified", "created_at"])
                  .where("id", "=", userId)
                  .executeTakeFirst();

            if (!user) {
                  throw new NotFoundError("User not found");
            }

            if (user.is_verified) {
                  throw new ConflictError("User already verified");
            }

            const verification = await this.db
                  .insertInto("EmailVerification")
                  .values({
                        user_id: userId,
                        token: crypto.randomBytes(3).toString('hex').toLowerCase(),
                  })
                  .returningAll()
                  .executeTakeFirstOrThrow();

            await this.emailService.sendVerificationEmail(user.email, verification.token);
      }

      public async verifyEmail(userId: UserDto["id"], token: string): Promise<UserDto> {
            const verifiedUser = await this.db
                  .updateTable("Users")
                  .set({ is_verified: true })
                  .from("EmailVerification")
                  .whereRef("EmailVerification.user_id", "=", "Users.id")
                  .where("Users.id", "=", userId)
                  .where("EmailVerification.user_id", "=", userId)
                  .where("EmailVerification.token", "=", token.toLowerCase())
                  .returning([
                        "Users.id",
                        "Users.username",
                        "Users.email",
                        "Users.role",
                        "Users.is_verified",
                        "Users.created_at",
                  ])
                  .executeTakeFirst();

            if (!verifiedUser) {
                  throw new NotFoundError("User not found");
            }

            const deletedCodes = await this.db
                  .deleteFrom("EmailVerification")
                  .where("user_id", "=", userId)
                  .returning("id")
                  .execute();

            if (deletedCodes.length === 0) {
                  throw new Error("Verification code not found");
            }

            return verifiedUser;
      }

      public async login(user: LoginDto): Promise<JwtDto> {
            const existingUser = await this.db
                  .selectFrom("Users")
                  .selectAll()
                  .where("username", "=", user.username)
                  .executeTakeFirst();

            if (!existingUser) {
                  throw new UnauthorizedError("User not found");
            }

            const isPasswordValid = await this.validatePassword(user.password, existingUser.password);

            if (!isPasswordValid) {
                  throw new UnauthorizedError("User not found");
            }

            return await this.generateTokens(existingUser.id);
      }

      private hashRefreshToken(refreshToken: string): string {
            return crypto.createHash('sha256').update(refreshToken).digest('hex');
      }

      async refreshToken(userSub: UserDto["id"], refreshToken: string, sessionId: string): Promise<JwtDto> {
            const hashedRefreshToken = this.hashRefreshToken(refreshToken);
            const token = await this.db.selectFrom("Sessions")
                  .select(["id", "refresh_token", "expires_at"])
                  .where("user_id", "=", userSub)
                  .where("refresh_token", "=", hashedRefreshToken)
                  .where("id", "=", sessionId)
                  .executeTakeFirst();

            if (!token)
                  throw new UnauthorizedError();

            if (token.expires_at < new Date()) {
                  await this.db.deleteFrom("Sessions").where("user_id", "=", userSub).where("refresh_token", "=", refreshToken).execute();
                  throw new UnauthorizedError();
            }

            const tokens = await this.generateTokens(userSub, token.id);

            return tokens;
      }

      async validateRefreshToken(userSub: UserDto["id"], refreshToken: string): Promise<boolean> {
            const hashedRefreshToken = this.hashRefreshToken(refreshToken);
            const token = await this.db.selectFrom("Sessions")
                  .select(["refresh_token", "expires_at"])
                  .where("user_id", "=", userSub)
                  .where("refresh_token", "=", hashedRefreshToken)
                  .executeTakeFirst();

            if (!token)
                  return false;

            if (token.expires_at < new Date()) {
                  await this.db.deleteFrom("Sessions").where("user_id", "=", userSub).where("refresh_token", "=", hashedRefreshToken).execute();
                  return false;
            }

            return true;
      }

      private async generateTokens(userSub: UserDto["id"], sessionId?: string): Promise<JwtDto> {
            sessionId ??= crypto.randomUUID();

            const payload: JwtPayload = {
                  sub: userSub,
                  sessionId: sessionId,
            };

            const access_token = await this.jwtService.sign(payload);

            const refresh_token = await this.jwtRefreshService.sign(payload);

            const hashedRefreshToken = this.hashRefreshToken(refresh_token);

            const decodedAccessToken = this.jwtService.decode(access_token);

            const decodedRefreshToken = this.jwtRefreshService.decode(refresh_token);

            const isSessionExists = await this.db.selectFrom("Sessions")
                  .select(["id"])
                  .where("user_id", "=", userSub)
                  .where("id", "=", sessionId)
                  .executeTakeFirst();

            if (isSessionExists) {
                  await this.db.updateTable("Sessions").set({
                        refresh_token: hashedRefreshToken,
                        expires_at: new Date(decodedRefreshToken.exp * 1000).toISOString(),
                  }).where("id", "=", sessionId).execute();
            }
            else {
                  await this.db.insertInto("Sessions").values({
                        id: sessionId,
                        user_id: userSub,
                        refresh_token: hashedRefreshToken,
                        expires_at: new Date(decodedRefreshToken.exp * 1000).toISOString(),
                  }).execute();
            }


            return {
                  access_token,
                  refresh_token,
                  expires_at: decodedAccessToken.exp,
            };
      }

      async validateSession(userSub: UserDto["id"], sessionId: string): Promise<void> {
            const isSessionExists = await this.db.selectFrom("Sessions")
                  .select(["id"])
                  .where("user_id", "=", userSub)
                  .where("id", "=", sessionId)
                  .executeTakeFirst();

            if (!isSessionExists)
                  throw new UnauthorizedError();
      }

      async logout(userSub: UserDto["id"], sessionId: string): Promise<void> {
            await this.db.deleteFrom("Sessions")
                  .where("user_id", "=", userSub)
                  .where("id", "=", sessionId)
                  .execute();
      }

      async logoutAll(userSub: UserDto["id"]): Promise<void> {
            await this.db.deleteFrom("Sessions")
                  .where("user_id", "=", userSub)
                  .execute();
      }

      public async me(id: UserDto["id"]): Promise<UserDto> {
            const user = await this.db.selectFrom("Users")
                  .select(["id", "username", "email", "role", "is_verified", "created_at"])
                  .where("id", "=", id)
                  .executeTakeFirst()

            if (!user) {
                  throw new NotFoundError("User not found");
            }

            return user;
      }

      public isRoleValid(role: number): boolean {
            return Object.values<number>(UserRole).includes(role)
                  || role === 0
                  || Object.values(UserRole).reduce((a, b) => a | b, 0) === role;
      }

      public isRole(role: number, needle: UserRoles): boolean {
            return (role & needle) === needle;
      }

      public async updateRole(id: UserDto["id"], role: UserDto["role"]): Promise<UserDto> {
            if (!this.isRoleValid(role))
                  throw new ValidationError("Invalid role");

            const user = await this.db
                  .updateTable("Users")
                  .set({ role })
                  .where("id", "=", id)
                  .returning(["id", "username", "email", "role", "is_verified", "created_at"])
                  .executeTakeFirst();

            if (!user) {
                  throw new NotFoundError("User not found");
            }

            return user;
      }
}
