import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class BullFileProducerService {
  constructor(@InjectQueue('cleanup-operation') private cleanupQueue: Queue) {}
  // Bull Producer to clean up downloads directory daily
  public async cleanUpDir() {
    const dirPath = 'download';
    await this.cleanupQueue.add(
      'cleanup-dir',
      {
        path: dirPath,
      },
      {
        repeat: {
          every: 86400000,
        },
      },
    );
  }
}
