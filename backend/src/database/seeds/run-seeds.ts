/**
 * 数据库种子数据运行脚本
 * 用于初始化系统所需的基础数据
 */

import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../modules/users/entities/user.entity';
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

async function runSeeds() {
  console.log('🌱 开始运行种子数据...\n');

  try {
    // 初始化数据源
    await AppDataSource.initialize();
    console.log('✅ 数据库连接成功');

    const userRepository = AppDataSource.getRepository(User);

    // 1. 创建管理员账户
    console.log('\n👤 创建管理员账户...');

    const adminExists = await userRepository.findOne({
      where: { email: 'admin@example.com' }
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);

      const admin = userRepository.create({
        email: 'admin@example.com',
        password: hashedPassword,
        phone: '13800138000',
        name: 'admin',
        roles: [UserRole.ADMIN],
        isActive: true,
        isDeleted: false,
      });

      await userRepository.save(admin);
      console.log('✅ 管理员账户创建成功');
      console.log('   邮箱: admin@example.com');
      console.log('   用户名: admin');
      console.log('   密码: admin123');
    } else {
      console.log('ℹ️  管理员账户已存在，跳过创建');
    }

    // 2. 创建测试经理账户
    console.log('\n👤 创建测试经理账户...');

    const managerExists = await userRepository.findOne({
      where: { email: 'manager@example.com' }
    });

    if (!managerExists) {
      const hashedPassword = await bcrypt.hash('manager123', 10);

      const manager = userRepository.create({
        email: 'manager@example.com',
        password: hashedPassword,
        phone: '13800138001',
        name: '张经理',
        roles: [UserRole.MANAGER],
        isActive: true,
        isDeleted: false,
      });

      await userRepository.save(manager);
      console.log('✅ 经理账户创建成功');
      console.log('   邮箱: manager@example.com');
      console.log('   密码: manager123');
    } else {
      console.log('ℹ️  经理账户已存在，跳过创建');
    }

    // 3. 创建测试收银员账户
    console.log('\n👤 创建测试收银员账户...');

    const cashierExists = await userRepository.findOne({
      where: { email: 'cashier@example.com' }
    });

    if (!cashierExists) {
      const hashedPassword = await bcrypt.hash('cashier123', 10);

      const cashier = userRepository.create({
        email: 'cashier@example.com',
        password: hashedPassword,
        phone: '13800138002',
        name: '李收银',
        roles: [UserRole.CASHIER],
        isActive: true,
        isDeleted: false,
      });

      await userRepository.save(cashier);
      console.log('✅ 收银员账户创建成功');
      console.log('   邮箱: cashier@example.com');
      console.log('   密码: cashier123');
    } else {
      console.log('ℹ️  收银员账户已存在，跳过创建');
    }

    console.log('\n🎉 种子数据运行完成！');
    console.log('\n📋 账户汇总:');
    console.log('┌──────────┬────────────────────────┬──────────────┐');
    console.log('│ 角色     │ 邮箱/用户名             │ 密码          │');
    console.log('├──────────┼────────────────────────┼──────────────┤');
    console.log('│ 管理员   │ admin@example.com      │ admin123     │');
    console.log('│          │ (或用户名: admin)       │              │');
    console.log('├──────────┼────────────────────────┼──────────────┤');
    console.log('│ 经理     │ manager@example.com    │ manager123   │');
    console.log('├──────────┼────────────────────────┼──────────────┤');
    console.log('│ 收银员   │ cashier@example.com    │ cashier123   │');
    console.log('└──────────┴────────────────────────┴──────────────┘');

  } catch (error) {
    console.error('\n❌ 种子数据运行失败:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

// 执行种子数据
if (require.main === module) {
  runSeeds();
}

export { runSeeds };
