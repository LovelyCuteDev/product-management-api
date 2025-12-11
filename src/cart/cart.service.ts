import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';

interface AddToCartInput {
  productId: number;
  quantity: number;
}

interface UpdateCartItemInput {
  quantity: number;
}

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  findUserCart(userId: number): Promise<CartItem[]> {
    return this.cartRepository.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async addItem(userId: number, data: AddToCartInput): Promise<CartItem> {
    if (data.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const product = await this.productsRepository.findOne({
      where: { id: data.productId },
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    const existing = await this.cartRepository.findOne({
      where: { userId, productId: data.productId },
    });

    const nextQuantity = existing
      ? existing.quantity + data.quantity
      : data.quantity;

    if (nextQuantity > product.stock) {
      throw new BadRequestException(
        `Requested quantity exceeds available stock (${product.stock})`,
      );
    }

    if (existing) {
      existing.quantity = nextQuantity;
      return this.cartRepository.save(existing);
    }

    const item = this.cartRepository.create({
      userId,
      productId: data.productId,
      quantity: data.quantity,
    });
    return this.cartRepository.save(item);
  }

  async updateItem(
    userId: number,
    itemId: number,
    data: UpdateCartItemInput,
  ): Promise<CartItem> {
    if (data.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const item = await this.cartRepository.findOne({
      where: { id: itemId, userId },
      relations: ['product'],
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    const product = item.product;
    if (data.quantity > product.stock) {
      throw new BadRequestException(
        `Requested quantity exceeds available stock (${product.stock})`,
      );
    }

    item.quantity = data.quantity;
    return this.cartRepository.save(item);
  }

  async removeItem(userId: number, itemId: number): Promise<void> {
    const item = await this.cartRepository.findOne({
      where: { id: itemId, userId },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartRepository.remove(item);
  }
}
