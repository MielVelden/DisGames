import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { ExceptionEnum } from '../../interfaces/enums';
import { ErrorHelper } from '../application/Error';
import { getConfigValue } from '../application/Config';
import { EnvConfigEnum } from '../../interfaces/enums/application/EnvConfigEnum';

dotenv.config();

export class DatabaseConnection {
  private static pool: mysql.Pool;
  private static connection: mysql.PoolConnection;
  private static databaseUrl = getConfigValue(EnvConfigEnum.DATABASE_URL) as string;
  public static databaseName = DatabaseConnection.databaseUrl.split('/').pop()?.split('?')[0] as string;

  static async createConnection(): Promise<mysql.PoolConnection> {
    this.pool = mysql.createPool(this.databaseUrl);
    this.connection = await this.pool.getConnection();
    return this.connection;
  }

  static async closeConnection(): Promise<void> {
    if (this.connection) {
      this.connection.release();
    }
    if (this.pool) {
      await this.pool.end();
    }
  }

  static getConnection(): mysql.PoolConnection {
    if (!this.connection)
      ErrorHelper.throw(ExceptionEnum.DATABASE_CONNECTION_FAILED);

    return this.connection;
  }
} 