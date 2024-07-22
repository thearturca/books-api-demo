import jwt from "jsonwebtoken";
import { JwtPayload } from "./jwt.dto";

export type Config = {
      secret: string,
      expires: string,
      publicKey?: string,
}

export class JwtService {
      constructor(
            private config: Config,
      ) {

      }

      async sign(payload: JwtPayload): Promise<string> {
            return new Promise((resolve, reject) => {
                  jwt.sign(payload, this.config.secret, {
                        expiresIn: this.config.expires,
                        algorithm: this.config.publicKey ? "RS256" : "HS256",
                  }, (err, token) => {
                        if (err) {
                              reject(err);
                              return;
                        }

                        if (!token) {
                              reject("Failed to generate token");
                              return;
                        }

                        resolve(token);
                  });
            });
      }

      async verify(token: string): Promise<JwtPayload> {
            return new Promise((resolve, reject) => {
                  jwt.verify(token, this.config.publicKey || this.config.secret, (err, decoded) => {
                        if (err) {
                              reject(err);
                              return;
                        }

                        resolve(decoded as JwtPayload);
                  });
            });
      }

      decode(token: string): JwtPayload & { sub: string, iat: number, exp: number } {
            return jwt.decode(token, { json: true }) as JwtPayload & { sub: string, iat: number, exp: number };
      }
}

export class JwtRefreshService extends JwtService {
}
