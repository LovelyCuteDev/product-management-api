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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Multer } from 'multer';

interface UpsertProductBody {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.productsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q: q || undefined,
      sort: sort === 'price' ? 'price' : 'createdAt',
      order: order === 'ASC' ? 'ASC' : 'DESC',
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOneById(Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() body: UpsertProductBody) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Only admin users can manage products');
    }

    const { name, description, price, stock } = body;
    return this.productsService.create({
      name,
      description: description ?? null,
      price,
      stock,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: 'uploads/products',
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  addImages(
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFiles() files: Multer.File[],
  ) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Only admin users can manage products');
    }

    if (!files || files.length === 0) {
      return this.productsService.findOneById(Number(id));
    }

    return this.productsService.addImages(Number(id), files);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: Partial<UpsertProductBody>,
  ) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Only admin users can manage products');
    }

    return this.productsService.update(Number(id), body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Only admin users can manage products');
    }

    return this.productsService.remove(Number(id));
  }
}
