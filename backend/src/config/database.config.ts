import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    // 基础配置
    const host = this.configService.get('DB_HOST', 'localhost');
    const port = this.configService.get('DB_PORT', 3306);
    const username = this.configService.get('DB_USERNAME', 'root');
    const password = this.configService.get('DB_PASSWORD', '');
    const database = this.configService.get('DB_DATABASE', 'copyright');

    // JDBC参数配置（从Spring Boot配置转换而来）
    const useSSL = this.configService.get('DB_USE_SSL', 'false') === 'true';
    const serverTimezone = this.configService.get('DB_SERVER_TIMEZONE', 'Asia/Shanghai');
    const allowPublicKeyRetrieval = this.configService.get('DB_ALLOW_PUBLIC_KEY_RETRIEVAL', 'true') === 'true';
    const useUnicode = this.configService.get('DB_USE_UNICODE', 'true') === 'true';
    const characterEncoding = this.configService.get('DB_CHARACTER_ENCODING', 'utf8');
    const createDatabaseIfNotExist = this.configService.get('DB_CREATE_DATABASE_IF_NOT_EXIST', 'true') === 'true';
    const useAffectedRows = this.configService.get('DB_USE_AFFECTED_ROWS', 'true') === 'true';

    // 连接池配置
    const connectionTimeout = parseInt(this.configService.get('DB_CONNECTION_TIMEOUT', '30000'));
    const acquireTimeout = parseInt(this.configService.get('DB_ACQUIRE_TIMEOUT', '60000'));
    const timeout = parseInt(this.configService.get('DB_TIMEOUT', '60000'));
    const retryAttempts = parseInt(this.configService.get('DB_RETRY_ATTEMPTS', '3'));
    const retryDelay = parseInt(this.configService.get('DB_RETRY_DELAY', '3000'));

    // 构建MySQL连接URL参数
    const urlParams = new URLSearchParams({
      useSSL: useSSL.toString(),
      serverTimezone: serverTimezone,
      allowPublicKeyRetrieval: allowPublicKeyRetrieval.toString(),
      useUnicode: useUnicode.toString(),
      characterEncoding: characterEncoding,
      createDatabaseIfNotExist: createDatabaseIfNotExist.toString(),
      useAffectedRows: useAffectedRows.toString(),
    });

    return {
      type: 'mysql',
      host,
      port,
      username,
      password,
      database,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false, // 临时关闭自动同步，避免索引冲突
      logging: this.configService.get('NODE_ENV') === 'development',

      // 连接池配置
      extra: {
        // 基础字符集配置
        charset: `${characterEncoding}_unicode_ci`,
        supportBigNumbers: true,
        bigNumberStrings: true,

        // 连接参数（MySQL2特定）
        connectionTimeout: connectionTimeout,
        acquireTimeout: acquireTimeout,
        timeout: timeout,

        // 重试配置
        retryAttempts: retryAttempts,
        retryDelay: retryDelay,

        // SSL配置
        ssl: useSSL ? {
          rejectUnauthorized: false
        } : false,

        // 时区配置
        timezone: serverTimezone,

        // 允许获取公钥（用于MySQL 8.0+认证）
        allowPublicKeyRetrieval: allowPublicKeyRetrieval,

        // Unicode支持
        supportUnicode: useUnicode,

        // 其他MySQL特定参数
        multipleStatements: false,
        dateStrings: true,
        debug: false, // 关闭调试日志，避免输出底层协议细节
      },
    };
  }
}