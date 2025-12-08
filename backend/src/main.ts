import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 启用CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // API前缀
  app.setGlobalPrefix('api');

  // Swagger文档配置
  const config = new DocumentBuilder()
    .setTitle('奶茶店销售管理系统 API')
    .setDescription('基于NestJS的奶茶店销售管理系统API文档')
    .setVersion('1.0')
    .addTag('认证', '用户登录和认证相关接口')
    .addTag('用户', '用户管理相关接口')
    .addTag('产品', '产品管理相关接口')
    .addTag('订单', '订单管理相关接口')
    .addTag('库存', '库存管理相关接口')
    .addTag('会员', '会员管理相关接口')
    .addTag('报表', '数据统计和报表相关接口')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 后端服务启动成功！`);
  console.log(`📖 API文档: http://localhost:${port}/api/docs`);
  console.log(`🌐 服务地址: http://localhost:${port}/api`);
}

bootstrap();