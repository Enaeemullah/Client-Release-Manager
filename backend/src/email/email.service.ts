import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

interface ProjectInviteTemplate {
  inviteLink: string;
  projectName: string;
  inviterEmail: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly configService: ConfigService) {
    this.transporter = this.createTransporter();
  }

  async sendProjectInvite(recipient: string, template: ProjectInviteTemplate) {
    if (!this.transporter) {
      this.logger.warn(
        `Email transport not configured. Invite for ${recipient}: ${template.inviteLink}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to: recipient,
        subject: `Invitation to collaborate on ${template.projectName}`,
        text: this.buildPlainText(template),
        html: this.buildHtml(template),
      });
    } catch (error) {
      this.logger.error(
        'Failed to send invite email',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private createTransporter(): Transporter | null {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT'));

    if (!host || !port) {
      this.logger.warn('SMTP configuration missing. Emails will not be sent.');
      return null;
    }

    const secure =
      this.configService.get<string>('SMTP_SECURE') === 'true' || port === 465;

    const auth = {
      user: this.configService.get<string>('SMTP_USER'),
      pass: this.configService.get<string>('SMTP_PASSWORD'),
    };

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth,
    });
  }

  private buildPlainText({ projectName, inviteLink, inviterEmail }: ProjectInviteTemplate) {
    return `
${inviterEmail} has invited you to collaborate on the project "${projectName}".

To accept the invitation, open this link:
${inviteLink}

If you did not expect this email, you can safely ignore it.
`;
  }

  private buildHtml({ projectName, inviteLink, inviterEmail }: ProjectInviteTemplate) {
    return `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="font-weight: 600; font-size: 20px;">You've been invited!</h2>

      <p style="font-size: 15px;">
        <strong>${inviterEmail}</strong> has invited you to collaborate on the project
        <strong>${projectName}</strong>.
      </p>

      <a href="${inviteLink}"
         style="display: inline-block; margin: 20px 0; padding: 12px 22px; background-color: #4f46e5; 
                color: #fff; text-decoration: none; border-radius: 6px; font-size: 15px;">
        Accept Invitation
      </a>

      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        If the button above doesn’t work, copy and paste this link into your browser:
      </p>

      <p style="font-size: 14px; color: #555;">
        ${inviteLink}
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

      <p style="font-size: 12px; color: #999;">
        This email was sent automatically. If you did not expect it, you can ignore it.
      </p>
  </div>
`;
  }
}
