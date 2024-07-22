import { z } from "zod";
import { UserRole } from "../database/schema";

export const UserDtoValidator = z.object({
      id: z.string().uuid(),
      username: z.string(),
      email: z.string().email(),
      role: z.number().min(0).max(Object.values(UserRole).reduce((a, b) => a | b, 0)),
      created_at: z.date(),
      is_verified: z.boolean(),
});

export type UserDto = z.infer<typeof UserDtoValidator>;

export const RegisterDtoValidator = z.object({
      username: z.string(),
      email: z.string().email(),
      password: z.string(),
});

export type RegisterDto = z.infer<typeof RegisterDtoValidator>;

export const LoginDtoValidator = z.object({
      username: z.string(),
      password: z.string(),
});

export type LoginDto = z.infer<typeof LoginDtoValidator>;

export type JwtDto = {
      access_token: string,
      refresh_token: string,
      expires_at: number,
}

export const RolesDtoValidator = z.object({
      role: z.number().min(0).max(Object.values(UserRole).reduce((a, b) => a | b, 0)),
});

export type RolesDto = z.infer<typeof RolesDtoValidator>;

export const EmailVerificationDtoValidator = z.object({
      code: z.string(),
});

export type EmailVerificationDto = z.infer<typeof EmailVerificationDtoValidator>;
