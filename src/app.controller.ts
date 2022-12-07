import {
  BadRequestException,
  Controller,
  Logger,
  Post,
  Req,
  Response,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { RabbitMQService } from './rabbit-mq.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FileValidationPipe } from './pipes/fileSizePipeValidation';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

const logger = new Logger('FileUpload');

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  public fileName = '';

  @Post('upload/send')
  uploadFle(@Req() req, @Response({ passthrough: true }) res): any {
    if (!this.fileName) {
      logger.debug('Upload file first.');
      return '[404] File not found.';
    }
    res.set({
      'Content-Type': 'text/plain',
    });
    const file = path.join(`upload/${this.fileName}`);
    fs.createReadStream(file)
      .pipe(csv())
      .on('data', (chunk) => this.rabbitMQService.send('append_cars', chunk))
      .on('end', () => {
        console.log('DONE ✅');
        fs.unlink(`upload/${this.fileName}`, () => {
          console.log('[X] File deleted successfully. ❌');
        });
      })
      .on('error', (err) => {
        console.error(err);
      });
  }

  @Post('/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: FileValidationPipe,
      storage: diskStorage({
        destination: './upload',
      }),
    }),
  )
  public uploadFile(
    @Req() req: any,
    @UploadedFile()
    file: Express.Multer.File,
  ): string {
    if (!file || req.fileValidationError) {
      throw new BadRequestException(
        'Invalid file provided. [X] Allowed filetype: .csv [X] Max size: 5MB',
      );
    }
    this.fileName = file.filename;
    logger.debug('File uploaded successfully. 📁');
    return '[X] File uploaded successfully.';
  }
}
