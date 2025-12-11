import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Req() req: any) {
    const userId = req.user.userId as number;
    return this.ordersService.createOrderFromCart(userId);
  }

  @Get()
  findUserOrders(@Req() req: any) {
    const userId = req.user.userId as number;
    return this.ordersService.findUserOrders(userId);
  }

  @Get(':id')
  async findUserOrder(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId as number;
    const order = await this.ordersService.findUserOrderById(
      userId,
      Number(id),
    );
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
