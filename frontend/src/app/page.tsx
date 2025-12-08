export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            奶茶店销售管理系统
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            现代化的奶茶店运营管理平台
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">产品管理</h3>
              <p className="text-gray-600">管理产品信息、价格和库存</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">订单处理</h3>
              <p className="text-gray-600">快速处理客户订单和支付</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">会员管理</h3>
              <p className="text-gray-600">会员积分和等级管理</p>
            </div>
          </div>
          
          <div className="mt-12">
            <a 
              href="/login" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              开始使用
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}