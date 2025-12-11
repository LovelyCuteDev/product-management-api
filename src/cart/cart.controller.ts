import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AddToCartBody {
  productId: number;
  quantity: number;
}

interface UpdateCartBody {
  quantity: number;
}

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req: any) {
    const userId = req.user.userId as number;
    return this.cartService.findUserCart(userId);
  }

  @Post()
  addItem(@Req() req: any, @Body() body: AddToCartBody) {
    const userId = req.user.userId as number;
    const { productId, quantity } = body;
    return this.cartService.addItem(userId, { productId, quantity });
  }

  @Put(':id')
  updateItem(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateCartBody,
  ) {
    const userId = req.user.userId as number;
    const { quantity } = body;
    return this.cartService.updateItem(userId, Number(id), { quantity });
  }

  @Delete(':id')
  deleteItem(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId as number;
    return this.cartService.removeItem(userId, Number(id));
  }
}
