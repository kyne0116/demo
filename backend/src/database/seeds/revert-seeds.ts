/**
 * 数据库种子数据回滚脚本
 * 用于清除测试数据
 */

import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import * as path from 'path';

// 加载环境变量
config({ path: path.resolve(__dirname, '../../../.env') });

// 创建数据源配置
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'copyright',
  entities: [path.join(__dirname, '../../**/*.entity{.ts,.js}')],
  synchronize: false,
  connectTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
  extra: {
    charset: 'utf8_unicode_ci',
    allowPublicKeyRetrieval: true,
    timezone: 'Asia/Shanghai',
  },
});

async function revertSeeds() {
  console.log('🔄 开始回滚种子数据...\n');

  try {
    // 初始化数据源
    await AppDataSource.initialize();
    console.log('✅ 数据库连接成功');

    const userRepository = AppDataSource.getRepository(User);

    // 删除测试账户
    console.log('\n🗑️  删除测试账户...');

    const testEmails = [
      'admin@example.com',
      'manager@example.com',
      'cashier@example.com',
    ];

    for (const email of testEmails) {
      const user = await userRepository.findOne({ where: { email } });
      if (user) {
        await userRepository.remove(user);
        console.log(`✅ 已删除账户: ${email}`);
      } else {
        console.log(`ℹ️  账户不存在: ${email}`);
      }
    }

    console.log('\n🎉 种子数据回滚完成！');

  } catch (error) {
    console.error('\n❌ 种子数据回滚失败:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

// 执行回滚
if (require.main === module) {
  revertSeeds();
}

export { revertSeeds };
