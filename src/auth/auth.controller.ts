import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

interface SignupBody {
  email: string;
  password: string;
  name: string;
}

interface LoginBody {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: SignupBody) {
    const { email, password, name } = body;
    return this.authService.signup({ email, password, name });
  }

  @Post('login')
  login(@Body() body: LoginBody) {
    const { email, password } = body;
    return this.authService.login({ email, password });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    const user = req.user as { userId: number };
    return this.authService.getProfile(user.userId);
  }
}
