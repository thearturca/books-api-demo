import { createTransport, Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export type Config = {
      host: string,
      port: number,
      username: string,
      password: string,
}

export class EmailService {
      private transport: Transporter<SMTPTransport.SentMessageInfo>;
      constructor(private config: Config) {
            this.transport = createTransport({
                  host: this.config.host,
                  port: this.config.port,
                  secure: true,
                  auth: {
                        user: this.config.username,
                        pass: this.config.password
                  },
            })
      }

      public async sendEmail(email: string, subject: string, html: string): Promise<void> {
            await this.transport.sendMail({
                  from: this.config.username,
                  to: email,
                  subject,
                  html,
            });
      }

      public async sendVerificationEmail(email: string, token: string): Promise<void> {
            await this.sendEmail(email, "Email verification", `Your verification code is <br> <b>${token}</b>`);
      }
}
