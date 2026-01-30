"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { collection, getDocs, Firestore } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PriceData, CATEGORIES } from "@/types";

export default function Home() {
  const { user } = useAuth();
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPriceData = async () => {
      const firestore = db as Firestore | undefined;
      if (!firestore) {
        setLoading(false);
        return;
      }

      try {
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
      } catch (error) {
        console.error("Error fetching price data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
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
            <Link href="/register" className="btn-primary text-lg px-8 py-4">
              무료로 시작하기
            </Link>
          )}
        </div>
      </section>

      {/* Price Dashboard Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              오늘의 시세를 캐치하세요
            </h2>
            <p className="text-gray-500">
              실시간 견적 데이터 기반 품목별 평균가
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-10 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : priceData.length > 0 ? (
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
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="mb-2">아직 시세 데이터가 없습니다</p>
              <p className="text-sm">견적 요청과 응답이 쌓이면 시세 정보가 표시됩니다</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Catchpac이 해결합니다
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
                견적 자동 수집
              </h3>
              <p className="text-gray-500">
                여러 대리점에서 견적이 도착합니다
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
