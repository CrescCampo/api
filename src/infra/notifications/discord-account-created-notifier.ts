import { Injectable, Logger } from '@nestjs/common';
import AccountCreatedNotifier, {
  AccountCreatedNotification,
} from 'domain/application/notifications/account-created-notifier';
import config from 'infra/config';

const REQUEST_TIMEOUT_MS = 5000;

@Injectable()
export default class DiscordAccountCreatedNotifier implements AccountCreatedNotifier {
  private readonly logger = new Logger(DiscordAccountCreatedNotifier.name);

  async notifyAccountCreated(input: AccountCreatedNotification): Promise<void> {
    const webhookUrl = config.discord.accountCreatedWebhookUrl;

    if (!webhookUrl) {
      this.logger.debug(
        'Discord webhook URL not configured, skipping account-created notification',
      );
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🌱 Nova conta criada no CrescCampo!\nNome: ${input.name}\nEmail: ${input.email}`,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.error(
          `Discord webhook returned status ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to send Discord account-created notification',
        error,
      );
    }
  }
}
