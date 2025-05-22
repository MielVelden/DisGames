import { Entity, PrimaryKey, Unique, ManyToOne, Field } from '../../utils/database/EntityDecorators';
import { GameType } from '../domain/Game';

@Entity('games')
export class GameEntity {
  @PrimaryKey()
  id!: number;
  
  @Unique()
  gameId!: string;
  
  @Field()
  type!: string;
  
  @ManyToOne('ServerEntity', 'games', 'serverId')
  server!: any;
  
  @Field()
  serverId!: number;
  
  @Field()
  data!: string;
  
  @Field()
  createdAt!: Date;
  
  @Field()
  updatedAt!: Date;
}