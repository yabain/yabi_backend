import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Query as ExpressQuery } from 'express-serve-static-core';
import { EventCategoriesService } from './event-categories.service';
import { CreateCategoryDto } from './create-category.dto';
import { EventCategories } from './event-categories.schema';

@Controller('category')
export class EventCategoriesController {
  constructor(private categoryService: EventCategoriesService) {}

  @Get()
  async getAllCategories(
    @Query() query: ExpressQuery,
  ): Promise<EventCategories[]> {
    // console.log('Getting all categories');
    return this.categoryService.findAll(query);
  }

  @Post('new')
  @UseGuards(AuthGuard()) // Applique un garde (guard) pour protéger la route. Ici, `AuthGuard` est utilisé pour vérifier l'authentification.
  @UsePipes(ValidationPipe) // Valide les données entrantes (body) en utilisant le DTO `CreateUserDto`
  async createCategory(
    @Body() category: CreateCategoryDto,
  ): Promise<EventCategories> {
    // console.log('Category creation');
    return this.categoryService.creatCategory(category);
  }

  @Delete(':id')
  @UseGuards(AuthGuard()) // Applique un garde (guard) pour protéger la route. Ici, `AuthGuard` est utilisé pour vérifier l'authentification.
  @UsePipes(ValidationPipe) // Valide les données entrantes (body) en utilisant le DTO `CreateUserDto`
  async deleteCategory(@Param('id') categoryId: string): Promise<any> {
    // console.log('Category deletion');
    return this.categoryService.deleteCategory(categoryId);
  }

  @Put(':id')
  @UseGuards(AuthGuard()) // Applique un garde (guard) pour protéger la route. Ici, `AuthGuard` est utilisé pour vérifier l'authentification.
  @UsePipes(ValidationPipe) // Valide les données entrantes (body) en utilisant le DTO `CreateUserDto`
  async updateCategory(
    @Param('id') categoryId: string,
    @Body() categoryData: CreateCategoryDto,
  ): Promise<any> {
    // console.log('Category deletion');
    return this.categoryService.updateCategory(categoryId, categoryData);
  }

  @Get(':id')
  async getCategory(@Param('id') categoryId: string): Promise<any> {
    // console.log('Getting one category');
    return this.categoryService.findById(categoryId);
  }

  @Post('import')
  async importCategory(): Promise<any> {
    // console.log('Import categories');
    return this.categoryService.importCategories();
  }

  @Get('eventslist/:id')
  async getUpcommingEventsOfCategory(
    @Param('id') categoryId: string,
    @Query() query: ExpressQuery,
  ): Promise<any> {
    return this.categoryService.getUpcommingEventsOfCategory(categoryId, query);
  }
}
