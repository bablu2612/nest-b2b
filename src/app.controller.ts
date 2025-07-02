import { Get, Controller, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')
  public root() {}

  @Get('hello')
  public getHello() {
    return 'Hello World!';
  }
}
