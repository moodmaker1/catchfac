"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, Firestore } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PriceData, CATEGORIES, User } from "@/types";

export default function Home() {
  const { user } = useAuth();
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [sellers, setSellers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const firestore = db as Firestore | undefined;
      if (!firestore) {
        setLoading(false);
        return;
      }

      try {
        // Fetch price data
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const responsesRef = collection(firestore, "quoteResponses");
        const requestsRef = collection(firestore, "quoteRequests");

        const requestsSnap = await getDocs(requestsRef);
        const requestMap = new Map<string, string>();
        requestsSnap.forEach((doc) => {
          requestMap.set(doc.id, doc.data().category);
        });

        const responsesSnap = await getDocs(responsesRef);
        
        const categoryData: Record<string, { prices: number[]; deliveryDays: number[]; lastWeekPrices: number[] }> = {};
        
        CATEGORIES.forEach((cat) => {
          categoryData[cat] = { prices: [], deliveryDays: [], lastWeekPrices: [] };
        });

        responsesSnap.forEach((doc) => {
          const data = doc.data();
          const category = requestMap.get(data.requestId);
          if (category && categoryData[category]) {
            const createdAt = data.createdAt?.toDate() || new Date();
            
            if (createdAt >= oneWeekAgo) {
              categoryData[category].prices.push(data.unitPrice);
              categoryData[category].deliveryDays.push(data.deliveryDays);
            } else if (createdAt >= twoWeeksAgo) {
              categoryData[category].lastWeekPrices.push(data.unitPrice);
            }
          }
        });

        const priceDataArray: PriceData[] = CATEGORIES.map((category) => {
          const data = categoryData[category];
          const avgPrice = data.prices.length > 0 
            ? Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length)
            : 0;
          const lastWeekAvg = data.lastWeekPrices.length > 0
            ? data.lastWeekPrices.reduce((a, b) => a + b, 0) / data.lastWeekPrices.length
            : avgPrice;
          const changePercent = lastWeekAvg > 0 
            ? Math.round(((avgPrice - lastWeekAvg) / lastWeekAvg) * 100)
            : 0;
          const avgDeliveryDays = data.deliveryDays.length > 0
            ? Math.round(data.deliveryDays.reduce((a, b) => a + b, 0) / data.deliveryDays.length)
            : 0;

          return {
            category,
            avgPrice,
            changePercent,
            avgDeliveryDays,
            sampleCount: data.prices.length,
          };
        }).filter((d) => d.sampleCount > 0);

        setPriceData(priceDataArray);

        // Fetch featured sellers (premium first, then recent)
        const usersRef = collection(firestore, "users");
        const sellersQuery = query(
          usersRef,
          where("userType", "==", "SELLER"),
          where("profileComplete", "==", true)
        );
        const sellersSnap = await getDocs(sellersQuery);
        
        const sellersData: User[] = [];
        sellersSnap.forEach((doc) => {
          const data = doc.data();
          sellersData.push({
            id: doc.id,
            email: data.email,
            name: data.name,
            company: data.company,
            userType: data.userType,
            createdAt: data.createdAt?.toDate() || new Date(),
            phone: data.phone,
            description: data.description,
            categories: data.categories || [],
            region: data.region,
            isPremium: data.isPremium || false,
          });
        });

        // Sort: premium first, then by date
        sellersData.sort((a, b) => {
          if (a.isPremium && !b.isPremium) return -1;
          if (!a.isPremium && b.isPremium) return 1;
          return 0;
        });

        setSellers(sellersData.slice(0, 6)); // Show top 6
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 text-lg mb-2">부품 구매 고민의 순간</p>
          <h1 className="text-5xl md:text-6xl font-bold text-[#DC2626] mb-6">
            Catchpac
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            흩어진 견적, 한 번에 잡다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              user.userType === "BUYER" ? (
                <Link href="/requests/new" className="btn-primary text-lg px-8 py-4">
                  견적 요청하기
                </Link>
              ) : (
                <Link href="/requests" className="btn-primary text-lg px-8 py-4">
                  견적 요청 보기
                </Link>
              )
            ) : (
              <>
                <Link href="/register" className="btn-primary text-lg px-8 py-4">
                  무료로 시작하기
                </Link>
                <Link href="/sellers" className="btn-secondary text-lg px-8 py-4">
                  파트너 업체 보기
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Featured Sellers Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                파트너 업체
              </h2>
              <p className="text-gray-500">
                검증된 부품 전문 업체들을 만나보세요
              </p>
            </div>
            <Link
              href="/sellers"
              className="text-[#DC2626] font-medium hover:underline hidden sm:block"
            >
              전체 보기 →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : sellers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sellers.map((seller) => (
                <Link
                  key={seller.id}
                  href={`/sellers/${seller.id}`}
                  className={`card card-hover block relative ${
                    seller.isPremium ? "border-2 border-[#DC2626]" : ""
                  }`}
                >
                  {seller.isPremium && (
                    <div className="absolute -top-3 left-4 bg-[#DC2626] text-white text-xs font-semibold px-3 py-1 rounded-full">
                      프리미엄
                    </div>
                  )}

                  <div className="pt-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {seller.company}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {seller.region} · {seller.name}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {seller.categories?.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                        >
                          {cat}
                        </span>
                      ))}
                      {seller.categories && seller.categories.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-400 rounded">
                          +{seller.categories.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-500 mb-4">아직 등록된 파트너 업체가 없습니다</p>
              <Link href="/register" className="btn-primary">
                첫 번째 파트너가 되어보세요
              </Link>
            </div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/sellers"
              className="text-[#DC2626] font-medium hover:underline"
            >
              전체 업체 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              이용 방법
            </h2>
            <p className="text-gray-500">
              전화 돌리지 마세요. 견적이 찾아옵니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#DC2626] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                부품 정보 등록
              </h3>
              <p className="text-gray-500">
                품번, 수량, 희망 납기만 입력하세요
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#DC2626] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                업체에서 연락
              </h3>
              <p className="text-gray-500">
                등록된 파트너 업체들이 견적을 보내드립니다
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#DC2626] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                비교 후 선택
              </h3>
              <p className="text-gray-500">
                가격, 납기 비교하고 최적의 조건 선택
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Price Data Section */}
      {priceData.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                시세 정보
              </h2>
              <p className="text-gray-500">
                최근 거래 기반 품목별 평균가
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {priceData.map((item) => (
                <div key={item.category} className="card card-hover">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-700">
                      {item.category}
                    </h3>
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        item.changePercent > 0
                          ? "bg-red-50 text-red-600"
                          : item.changePercent < 0
                          ? "bg-blue-50 text-blue-600"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {item.changePercent > 0 ? "+" : ""}
                      {item.changePercent}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    ₩{item.avgPrice.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">
                    평균 납기 {item.avgDeliveryDays}일 · {item.sampleCount}건 기준
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA for Sellers */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">
                부품 업체이신가요?
              </h2>
              <p className="text-gray-400 mb-6">
                Catchpac에 파트너로 등록하고 새로운 고객을 만나보세요.
                프리미엄 파트너가 되면 상단 노출, 우선 알림 등 다양한 혜택을 받을 수 있습니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="btn-primary text-center"
                >
                  무료로 등록하기
                </Link>
                <Link
                  href="/sellers"
                  className="btn-secondary text-center"
                >
                  파트너 업체 보기
                </Link>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-white mb-4">파트너 혜택</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-[#DC2626] mt-1">✓</span>
                  <span>신규 견적 요청 실시간 알림</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#DC2626] mt-1">✓</span>
                  <span>업체 프로필 페이지 제공</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#DC2626] mt-1">✓</span>
                  <span>구매자 직접 연결</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-500 mt-1">★</span>
                  <span className="text-yellow-500">프리미엄: 상단 노출 + 우선 알림</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#DC2626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-red-100 mb-8">
            제조업 구매의 새로운 기준, Catchpac
          </p>
          {!user && (
            <Link
              href="/register"
              className="inline-block bg-white text-[#DC2626] font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors"
            >
              무료 회원가입
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
