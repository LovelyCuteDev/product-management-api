import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';

export interface SafeUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toSafeUsers(users: User[]): SafeUser[] {
    return users.map((u) => this.toSafeUser(u));
  }

  async createUser(params: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
  }): Promise<SafeUser> {
    const existing = await this.findByEmail(params.email);
    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(params.password, 10);

    const user = this.usersRepository.create({
      email: params.email,
      passwordHash,
      name: params.name,
      role: params.role ?? UserRole.USER,
    });

    const saved = await this.usersRepository.save(user);
    return this.toSafeUser(saved);
  }

  async updateUser(
    id: number,
    params: {
      email?: string;
      name?: string;
      role?: UserRole;
      password?: string;
    },
  ): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (params.email && params.email !== user.email) {
      const existing = await this.findByEmail(params.email);
      if (existing && existing.id !== user.id) {
        throw new BadRequestException('Email is already registered');
      }
      user.email = params.email;
    }

    if (params.name !== undefined) {
      user.name = params.name;
    }

    if (params.role !== undefined) {
      user.role = params.role;
    }

    if (params.password) {
      user.passwordHash = await bcrypt.hash(params.password, 10);
    }

    const saved = await this.usersRepository.save(user);
    return this.toSafeUser(saved);
  }

  async deleteUser(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async listUsers(options?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<{
    items: SafeUser[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limitRaw = options?.limit && options.limit > 0 ? options.limit : 20;
    const limit = Math.min(limitRaw, 100);

    const qb = this.usersRepository.createQueryBuilder('user');

    if (options?.q) {
      qb.where(
        'user.email LIKE :q OR user.name LIKE :q',
        { q: `%${options.q}%` },
      );
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: this.toSafeUsers(items),
      total,
      page,
      limit,
    };
  }
}
