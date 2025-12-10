/**
 * 数据库连接测试脚本
 * 用于验证环境变量配置的数据库连接是否正常工作
 *
 * 使用方法:
 * npx ts-node src/database/test-connection.ts
 */

import * as mysql from 'mysql2/promise';

interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

async function testDatabaseConnection() {
  console.log('🔍 开始测试数据库连接...\n');

  try {
    // 读取环境变量
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'copyright',
    };

    console.log('📋 数据库配置信息:');
    console.log(`   主机: ${config.host}:${config.port}`);
    console.log(`   数据库: ${config.database}`);
    console.log(`   用户名: ${config.username}`);
    console.log(`   密码: ${config.password ? '******' : '(空)'}\n`);

    // 测试基础连接
    console.log('🔌 测试基础连接...');
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      connectTimeout: 10000,
    });

    console.log('✅ 基础连接成功!');

    // 尝试创建数据库（如果不存在）
    console.log('\n🏗️  尝试创建数据库...');
    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ 数据库 ${config.database} 创建成功!`);
    } catch (error: any) {
      console.log(`❌ 数据库创建失败: ${error.message}`);
    }

    // 关闭基础连接
    await connection.end();

    // 测试完整连接（直接连接到目标数据库）
    console.log('\n🔌 测试完整连接...');
    const fullConnection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      connectTimeout: 10000,
    });

    console.log('✅ 完整连接成功!');

    // 获取数据库版本信息
    const [versionRows] = await fullConnection.query('SELECT VERSION() as version, NOW() as now_time');
    const versionInfo = (versionRows as any[])[0];
    console.log(`\n📋 数据库信息:`);
    console.log(`   MySQL版本: ${versionInfo.version}`);
    console.log(`   服务器时间: ${versionInfo.now_time}`);

    // 检查字符集
    const [charsetRows] = await fullConnection.query('SELECT @@character_set_database as charset, @@collation_database as collation');
    const charsetInfo = (charsetRows as any[])[0];
    console.log(`   字符集: ${charsetInfo.charset} (${charsetInfo.collation})`);

    await fullConnection.end();

    console.log('\n🎉 数据库连接测试完成 - 全部成功!');

  } catch (error: any) {
    console.error('\n❌ 数据库连接测试失败!');
    console.error(`   错误类型: ${error.code || 'Unknown'}`);
    console.error(`   错误信息: ${error.message}`);

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 建议检查:');
      console.log('   - 用户名和密码是否正确');
      console.log('   - 用户是否具有访问权限');
      console.log('   - MySQL服务是否正常运行');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 建议检查:');
      console.log('   - MySQL服务是否启动');
      console.log('   - 主机和端口是否正确');
      console.log('   - 防火墙设置');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 建议检查:');
      console.log('   - 数据库名称是否正确');
      console.log('   - 数据库是否存在');
      console.log('   - 用户是否有访问权限');
    }

    process.exit(1);
  }
}

// 执行测试
if (require.main === module) {
  testDatabaseConnection();
}

export { testDatabaseConnection };