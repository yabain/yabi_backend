/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(res: any): string {
    return res.redirect('https://yabi.cm');
    // return 'Hello Yabi Events!';
  }
}
