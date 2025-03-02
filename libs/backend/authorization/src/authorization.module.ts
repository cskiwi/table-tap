import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      signOptions: { expiresIn: '30d' },
    }),
  ],
  exports: [JwtModule],
})
export class AuthorizationModule {}
