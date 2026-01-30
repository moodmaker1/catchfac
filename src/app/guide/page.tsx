"use client";

import Link from "next/link";

export default function GuidePage() {
  return (
    <div className="min-h-[calc(100vh-200px)] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">이용 안내</h1>
          <p className="text-xl text-gray-600">
            catchfac과 함께 더 스마트한 구매를 시작하세요
          </p>
        </div>

        <div className="space-y-8">
          {/* 구매자 안내 */}
          <section className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">구매자 이용 안내</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#DC2626] text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">회원가입</h3>
                  <p className="text-gray-600">
                    무료로 회원가입하고 구매자 계정을 만드세요. 회사명과 담당자 정보만 입력하면 됩니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#DC2626] text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">견적 요청 등록</h3>
                  <p className="text-gray-600">
                    필요한 부품 정보(품목, 메이커, 품번, 수량, 희망 납기)를 입력하여 견적을 요청하세요.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#DC2626] text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">견적 수신 및 비교</h3>
                  <p className="text-gray-600">
                    등록된 파트너 업체들로부터 여러 견적을 받아 가격과 납기를 비교하세요.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#DC2626] text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">최적 견적 선택</h3>
                  <p className="text-gray-600">
                    비교한 견적 중 가장 적합한 업체를 선택하고 주문을 진행하세요.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/register" className="btn-primary">
                견적받기
              </Link>
            </div>
          </section>

          {/* 판매자 안내 */}
          <section className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">판매자 이용 안내</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#1e3a8a] text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">파트너 등록</h3>
                  <p className="text-gray-600">
                    판매자 계정으로 회원가입하고 업체 정보를 등록하세요. 취급 품목과 지역을 선택할 수 있습니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#1e3a8a] text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">견적 요청 알림</h3>
                  <p className="text-gray-600">
                    구매자들의 견적 요청을 실시간으로 알림 받고, 본인 업체와 관련된 요청을 확인하세요.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#1e3a8a] text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">견적 제출</h3>
                  <p className="text-gray-600">
                    단가, 납기, 재고 여부 등을 입력하여 견적을 제출하세요.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#1e3a8a] text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">구매자 연결</h3>
                  <p className="text-gray-600">
                    선택된 견적의 경우 구매자와 직접 연결되어 주문을 진행할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/register" className="btn-primary">
                파트너 등록하기
              </Link>
            </div>
          </section>

          {/* 주요 기능 */}
          <section className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">주요 기능</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">✓ 실시간 견적 알림</h3>
                <p className="text-gray-600 text-sm">
                  새로운 견적 요청이 등록되면 즉시 알림을 받을 수 있습니다.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">✓ 견적 비교 기능</h3>
                <p className="text-gray-600 text-sm">
                  여러 업체의 견적을 한눈에 비교하여 최적의 선택을 할 수 있습니다.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">✓ 파트너 프로필</h3>
                <p className="text-gray-600 text-sm">
                  판매자는 자세한 업체 정보와 취급 품목을 프로필에 등록할 수 있습니다.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">✓ 프리미엄 서비스</h3>
                <p className="text-gray-600 text-sm">
                  프리미엄 파트너는 상단 노출과 우선 알림 등의 혜택을 받을 수 있습니다.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
