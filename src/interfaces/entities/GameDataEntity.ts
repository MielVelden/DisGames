import { Entity, PrimaryKey, Unique, ManyToOne, Field } from '../../utils/database/EntityDecorators';

@Entity('gameData')
export class GameDataEntity {
  @PrimaryKey()
  id!: number;
  
  @Field()
  gameId!: number;
  
  @Field()
  serverId!: string;
  
  @Unique()
  channelId!: string;

  @Field()
  messageId!: string;
  
  @Field()
  lastUserId!: string;

  @Field()
  answer!: string;

  @Field()
  createdAt!: Date;
  
  @Field()
  updatedAt!: Date;
}