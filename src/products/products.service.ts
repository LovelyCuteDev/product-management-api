import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Multer } from 'multer';

import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';

interface UpsertProductInput {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImagesRepository: Repository<ProductImage>,
  ) {}

  async findAll(options?: {
    page?: number;
    limit?: number;
    q?: string;
    sort?: 'createdAt' | 'price';
    order?: 'ASC' | 'DESC';
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limitRaw = options?.limit && options.limit > 0 ? options.limit : 12;
    const limit = Math.min(limitRaw, 100);

    const sortField =
      options?.sort === 'price' ? 'product.price' : 'product.createdAt';
    const sortOrder = options?.order === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.productsRepository.createQueryBuilder('product');

    if (options?.q) {
      qb.andWhere(
        '(product.name LIKE :q OR product.description LIKE :q)',
        { q: `%${options.q}%` },
      );
    }

    if (options?.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', {
        minPrice: options.minPrice,
      });
    }

    if (options?.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', {
        maxPrice: options.maxPrice,
      });
    }

    qb.orderBy(sortField, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb
      .leftJoinAndSelect('product.images', 'images')
      .getManyAndCount();

    return { items, total, page, limit };
  }

  async findOneById(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['images'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(data: UpsertProductInput): Promise<Product> {
    const product = this.productsRepository.create({
      name: data.name,
      description: data.description ?? null,
      price: data.price.toString(),
      stock: data.stock,
    });
    return this.productsRepository.save(product);
  }

  async update(id: number, data: Partial<UpsertProductInput>): Promise<Product> {
    const product = await this.findOneById(id);

    if (data.name !== undefined) {
      product.name = data.name;
    }
    if (data.description !== undefined) {
      product.description = data.description;
    }
    if (data.price !== undefined) {
      product.price = data.price.toString();
    }
    if (data.stock !== undefined) {
      product.stock = data.stock;
    }

    return this.productsRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOneById(id);
    await this.productsRepository.remove(product);
  }

  async addImages(productId: number, files: Multer.File[]) {
    const product = await this.findOneById(productId);

    const existingCount = product.images?.length ?? 0;

    const images = files.map((file, index) =>
      this.productImagesRepository.create({
        productId: product.id,
        url: `/uploads/products/${file.filename}`,
        sortOrder: existingCount + index,
      }),
    );

    await this.productImagesRepository.save(images);

    return this.findOneById(productId);
  }
}
