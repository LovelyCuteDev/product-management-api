import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CartItem } from '../cart/cart-item.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
    private readonly dataSource: DataSource,
  ) {}

  async createOrderFromCart(userId: number): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const cartRepo = manager.getRepository(CartItem);
      const orderRepo = manager.getRepository(Order);
      const orderItemRepo = manager.getRepository(OrderItem);
      const productRepo = manager.getRepository(Product);

      const cartItems = await cartRepo.find({
        where: { userId },
        relations: ['product'],
      });

      if (cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // Validate stock and compute total using latest product data
      let totalPriceNumber = 0;
      const productsToUpdate: Product[] = [];

      for (const item of cartItems) {
        const product = await productRepo.findOne({
          where: { id: item.productId },
        });
        if (!product) {
          throw new BadRequestException(
            `Product with id ${item.productId} no longer exists`,
          );
        }
        if (item.quantity > product.stock) {
          throw new BadRequestException(
            `Not enough stock for product "${product.name}"`,
          );
        }
        totalPriceNumber += Number(product.price) * item.quantity;
        product.stock -= item.quantity;
        productsToUpdate.push(product);
      }

      if (productsToUpdate.length > 0) {
        await productRepo.save(productsToUpdate);
      }

      const order = orderRepo.create({
        userId,
        status: OrderStatus.PAID,
        totalPrice: totalPriceNumber.toFixed(2),
      });

      const savedOrder = await orderRepo.save(order);

      const orderItems = cartItems.map((item) =>
        orderItemRepo.create({
          orderId: savedOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.product.price,
        }),
      );

      await orderItemRepo.save(orderItems);

      await cartRepo.remove(cartItems);

      return orderRepo.findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.product'],
      }) as Promise<Order>;
    });
  }

  findUserOrders(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  findUserOrderById(userId: number, id: number): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { id, userId },
      relations: ['items', 'items.product'],
    });
  }
}
