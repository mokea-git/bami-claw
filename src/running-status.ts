import { Channel, SentMessage } from './types.js';
import { logger } from './logger.js';

export class RunningStatusManager {
  private pending = new Map<string, SentMessage>();

  constructor(private readonly text: string) {}

  async show(channel: Channel, jid: string): Promise<void> {
    await this.clear(channel, jid);

    try {
      const sent = await channel.sendMessage(jid, this.text);
      if (sent) {
        this.pending.set(jid, sent);
      }
    } catch (err) {
      logger.warn({ jid, err }, 'Failed to send running status');
    }
  }

  async clear(channel: Channel, jid: string): Promise<void> {
    const sent = this.pending.get(jid);
    if (!sent) return;

    this.pending.delete(jid);
    if (!channel.deleteMessage) return;

    try {
      await channel.deleteMessage(jid, sent);
    } catch (err) {
      logger.debug({ jid, err }, 'Failed to delete running status');
    }
  }
}
