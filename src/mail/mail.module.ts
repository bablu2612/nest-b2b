import { Module } from '@nestjs/common';
import { mailService } from './mail.service';
// import { MailService } from './mail.service';

@Module({
  providers: [mailService],
  exports: [mailService], // <-- important
})
export class MailModule {}