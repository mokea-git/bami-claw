import { describe, expect, it, vi } from 'vitest';

import { RunningStatusManager } from './running-status.js';
import { Channel, SentMessage } from './types.js';

function createChannel() {
  const sent: SentMessage = { id: 'running-1', chatJid: 'chat@g.us' };
  const channel: Channel = {
    name: 'test',
    connect: vi.fn(),
    sendMessage: vi.fn().mockResolvedValue(sent),
    deleteMessage: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn(() => true),
    ownsJid: vi.fn(() => true),
    disconnect: vi.fn(),
  };
  return { channel, sent };
}

describe('RunningStatusManager', () => {
  it('sends a running status immediately and deletes it before the answer', async () => {
    const { channel, sent } = createChannel();
    const manager = new RunningStatusManager('실행 중...');

    await manager.show(channel, 'chat@g.us');
    await manager.clear(channel, 'chat@g.us');

    expect(channel.sendMessage).toHaveBeenCalledWith('chat@g.us', '실행 중...');
    expect(channel.deleteMessage).toHaveBeenCalledWith('chat@g.us', sent);
  });

  it('replaces an old running status when the same chat receives more work', async () => {
    const { channel, sent } = createChannel();
    const newer: SentMessage = { id: 'running-2', chatJid: 'chat@g.us' };
    vi.mocked(channel.sendMessage)
      .mockResolvedValueOnce(sent)
      .mockResolvedValueOnce(newer);
    const manager = new RunningStatusManager('실행 중...');

    await manager.show(channel, 'chat@g.us');
    await manager.show(channel, 'chat@g.us');
    await manager.clear(channel, 'chat@g.us');

    expect(channel.deleteMessage).toHaveBeenNthCalledWith(1, 'chat@g.us', sent);
    expect(channel.deleteMessage).toHaveBeenNthCalledWith(
      2,
      'chat@g.us',
      newer,
    );
  });

  it('does nothing when a channel cannot delete messages', async () => {
    const { channel } = createChannel();
    delete channel.deleteMessage;
    const manager = new RunningStatusManager('실행 중...');

    await manager.show(channel, 'chat@g.us');
    await manager.clear(channel, 'chat@g.us');

    expect(channel.sendMessage).toHaveBeenCalledOnce();
  });
});
