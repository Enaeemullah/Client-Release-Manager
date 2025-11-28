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
        from: this.configService.get<string>('EMAIL_FROM') ?? 'Verto <no-reply@verto.app>',
        to: recipient,
        subject: `You're invited to collaborate on ${template.projectName}`,
        text: this.buildPlainText(template),
        html: this.buildHtml(template),
      });
    } catch (error) {
      this.logger.error('Failed to send invite email', error instanceof Error ? error.stack : undefined);
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
      this.configService.get<string>('SMTP_SECURE', 'false') === 'true' || port === 465;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  private buildPlainText({ projectName, inviteLink, inviterEmail }: ProjectInviteTemplate) {
    return [
      `${inviterEmail} invited you to collaborate on ${projectName}.`,
      'Click the link below to accept the invitation:',
      inviteLink,
      '',
      'If you did not expect this email, you can ignore it.',
    ].join('\n');
  }

  private buildHtml({ projectName, inviteLink, inviterEmail }: ProjectInviteTemplate) {
    return `
      <p><strong>${inviterEmail}</strong> invited you to collaborate on <strong>${projectName}</strong>.</p>
      <p><a href="${inviteLink}" target="_blank" rel="noopener">Accept invitation</a></p>
      <p style="font-size: 12px; color: #555;">If the button above does not work, copy and paste this link into your browser:<br>${inviteLink}</p>
    `;
  }
}
