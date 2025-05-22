import { Entity, PrimaryKey, Unique, OneToMany, Field } from '../../utils/database/EntityDecorators';
import { Language } from '../../interfaces/application/Language';

@Entity('servers')
export class ServerEntity {
  @PrimaryKey()
  id!: number;
  
  @Unique()
  serverId!: string;
  
  @Field()
  name!: string;
  
  @Field()
  language!: Language;
  
  @OneToMany('GameEntity', 'server')
  games!: any[];
  
  @Field()
  createdAt!: Date;
  
  @Field()
  updatedAt!: Date;
}