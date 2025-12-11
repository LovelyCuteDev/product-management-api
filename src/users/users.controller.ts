import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from './user.entity';

interface UpsertUserBody {
  email: string;
  name: string;
  password?: string;
  role?: UserRole;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private ensureSuperAdmin(req: any) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Only super admin users can manage users');
    }
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    this.ensureSuperAdmin(req);

    return this.usersService.listUsers({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q: q || undefined,
    });
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    this.ensureSuperAdmin(req);
    return this.usersService.findById(Number(id));
  }

  @Post()
  create(@Req() req: any, @Body() body: UpsertUserBody) {
    this.ensureSuperAdmin(req);

    const role =
      body.role === UserRole.ADMIN || body.role === UserRole.USER
        ? body.role
        : UserRole.USER;

    return this.usersService.createUser({
      email: body.email,
      name: body.name,
      password: body.password ?? '',
      role,
    });
  }

  @Put(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpsertUserBody,
  ) {
    this.ensureSuperAdmin(req);

    const role =
      body.role === UserRole.ADMIN || body.role === UserRole.USER
        ? body.role
        : undefined;

    return this.usersService.updateUser(Number(id), {
      email: body.email,
      name: body.name,
      role,
      password: body.password,
    });
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    this.ensureSuperAdmin(req);
    return this.usersService.deleteUser(Number(id));
  }
}
