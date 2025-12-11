import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CartItem } from '../cart/cart-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, CartItem])],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
