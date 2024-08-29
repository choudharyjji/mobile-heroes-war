import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';

import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { Item, ItemSchema } from './item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
  ],
  controllers: [ItemController],
  providers: [ItemService],
  exports: [MongooseModule],
})
export class ItemModule {}
