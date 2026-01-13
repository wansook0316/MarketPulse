export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-12">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            📊 MarketPulse
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            시장의 맥박을 실시간으로 체크하세요
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 bg-blue-50 rounded-xl hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">📈</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">실시간 분석</h3>
              <p className="text-gray-600 text-sm">
                시장 데이터를 실시간으로 분석하고 인사이트를 제공합니다
              </p>
            </div>

            <div className="p-6 bg-green-50 rounded-xl hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">💹</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">트렌드 추적</h3>
              <p className="text-gray-600 text-sm">
                주요 시장 트렌드를 추적하고 예측합니다
              </p>
            </div>

            <div className="p-6 bg-purple-50 rounded-xl hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">스마트 알림</h3>
              <p className="text-gray-600 text-sm">
                중요한 시장 변화를 놓치지 않도록 알려드립니다
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Deployed on <span className="font-semibold text-gray-700">Vercel</span> ⚡
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
