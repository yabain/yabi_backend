import { Module } from '@nestjs/common';
import { RevokedTokenService } from './revoked-token.service';

@Module({
  providers: [RevokedTokenService]
})
export class RevokedTokenModule {}
