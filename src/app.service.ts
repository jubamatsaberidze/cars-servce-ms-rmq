import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { RabbitMQService } from './rabbit-mq.service';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

const logger = new Logger('FileUploadService');

@Injectable()
export class AppService {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  public fileName = '';
  public tmp = [];

  uploadFle(req, res, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'Invalid file provided. [X] Allowed filetype: .csv',
      );
    }
    this.fileName = file.filename;
    logger.verbose('File uploaded successfully. 📁');
    if (!this.fileName) {
      logger.debug('Upload file first.');
      return '[404] File not found.';
    }

    const filePath = path.join(`upload/${this.fileName}`);
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (chunk) => {
        this.tmp.push(chunk);
        if (this.tmp.length == 100) {
          logger.debug('Reached 100. Sending...');
          this.rabbitMQService.send('append_cars', this.tmp);
          this.tmp = [];
        }
      })
      .on('end', () => {
        logger.debug('Sending last rows...');
        this.rabbitMQService.send('append_cars', this.tmp);
        this.tmp = [];
        logger.log('[X] DONE ✅');
        fs.unlink(`upload/${this.fileName}`, () => {
          logger.warn('[X] File deleted successfully. ❌');
        });
      })
      .on('error', (err) => {
        console.error(err);
      });
  }
}
