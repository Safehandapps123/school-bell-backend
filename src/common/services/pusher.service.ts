import { Injectable } from '@nestjs/common';
import Pusher from 'pusher';

@Injectable()
export class PusherService {
  private pusher: Pusher;

  constructor() {
    this.pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID !,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }

  async trigger(channel: string, event: string, data: any) {
    try {
      await this.pusher.trigger(channel, event, data);
    } catch (error) {
      console.error('Pusher trigger error:', error);
    }
  }

  async triggerBatch(batch: Array<{ channel: string; name: string; data: any }>) {
    try {
      await this.pusher.triggerBatch(batch);
    } catch (error) {
      console.error('Pusher batch trigger error:', error);
    }
  }
}
