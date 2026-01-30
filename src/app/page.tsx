"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, where, Firestore } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PriceData, CATEGORIES, User } from "@/types";
import ConsultationModal from "@/components/ConsultationModal";

// Hero Section with Video
function HeroSection() {
  const { user } = useAuth();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videos = [
    "/images/hero-video/hero-video-1.mp4",
    "/images/hero-video/hero-video-2.mp4",
    "/images/hero-video/hero-video-3.mp4",
    "/images/hero-video/hero-video-4.mp4",
    "/images/hero-video/hero-video-5.mp4",
  ];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      // 다음 동영상으로 전환 (순환)
      setCurrentVideoIndex((prev) => {
        const nextIndex = (prev + 1) % videos.length;
        return nextIndex;
      });
    };

    video.addEventListener("ended", handleEnded);
    
    return () => {
      video.removeEventListener("ended", handleEnded);
    };
  }, [videos.length]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    let isMounted = true;
    let playPromise: Promise<void> | null = null;
    
    // 동영상 소스 변경 시 로드
    video.load();
    
    // 로드 완료 후 재생 시도
    const handleLoadedData = () => {
      if (!isMounted) return;
      // 이전 재생 요청이 있으면 취소
      if (playPromise) {
        playPromise.catch(() => {});
      }
      playPromise = video.play();
      playPromise.catch((err) => {
        if (isMounted && err.name !== 'AbortError') {
          console.error("Video play error:", err);
          // 재생 실패 시 재시도
          setTimeout(() => {
            if (isMounted && video.paused) {
              playPromise = video.play();
              playPromise?.catch(console.error);
            }
          }, 200);
        }
      });
    };

    const handleCanPlay = () => {
      if (!isMounted) return;
      // 동영상이 재생 가능해지면 자동 재생
      if (video.paused) {
        // 이전 재생 요청이 있으면 취소
        if (playPromise) {
          playPromise.catch(() => {});
        }
        playPromise = video.play();
        playPromise.catch((err) => {
          if (isMounted && err.name !== 'AbortError') {
            console.error("Video play error:", err);
          }
        });
      }
    };

    // 동영상이 끝나면 다음으로 전환 (추가 보장)
    const handleEnded = () => {
      if (!isMounted) return;
      setCurrentVideoIndex((prev) => {
        const nextIndex = (prev + 1) % videos.length;
        return nextIndex;
      });
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("ended", handleEnded);
    
    return () => {
      isMounted = false;
      // 정리 시 이전 재생 요청 취소
      if (playPromise) {
        playPromise.catch(() => {});
      }
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("ended", handleEnded);
    };
  }, [currentVideoIndex, videos.length]);

  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white min-h-[85vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-70">
        <video
          ref={videoRef}
          key={currentVideoIndex}
          className="w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        >
          <source src={videos[currentVideoIndex]} type="video/mp4" />
        </video>
      </div>
      {/* 어두운 오버레이 추가로 텍스트 가독성 향상 */}
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 py-32">
        <p className="text-white text-2xl mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] font-medium">부품 구매 고민의 순간</p>
        <h1 className="text-7xl md:text-8xl font-bold text-white mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          catchfac
        </h1>
        <p className="text-2xl md:text-3xl text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] font-medium">
          흩어진 견적, 한 번에 잡다
        </p>
        <div className="text-xl md:text-2xl text-white/90 mb-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] max-w-2xl mx-auto space-y-2">
          <p>제조업 중소기업을 위한 구매품 견적 비교 플랫폼.</p>
          <p>여러 업체의 견적을 한 번에 비교하고 최적의 가격과 납기를 선택하세요.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {user ? (
            user.userType === "BUYER" ? (
              <Link href="/requests/new" className="btn-primary text-2xl md:text-3xl px-40 py-18 font-bold">
                견적 요청하기
              </Link>
            ) : (
              <Link href="/requests" className="btn-primary text-2xl md:text-3xl px-40 py-18 font-bold">
                견적 요청 보기
              </Link>
            )
          ) : (
            <Link href="/register" className="bg-[#DC2626] hover:bg-red-700 text-white text-xl md:text-2xl px-20 py-9 rounded-lg font-bold whitespace-nowrap transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              지금 견적받기
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [sellers, setSellers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConsultationModal, setShowConsultationModal] = useState(false);

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

        // 에러 처리 추가
        let requestsSnap;
        try {
          requestsSnap = await getDocs(requestsRef);
        } catch (error: any) {
          console.error("Error fetching requests:", error);
          // 권한 에러인 경우 빈 결과로 처리
          if (error.code === 'permission-denied') {
            requestsSnap = { forEach: () => {} } as any;
          } else {
            throw error;
          }
        }
        
        const requestMap = new Map<string, string>();
        requestsSnap.forEach((doc: any) => {
          requestMap.set(doc.id, doc.data().category);
        });

        // 에러 처리 추가
        let responsesSnap;
        try {
          responsesSnap = await getDocs(responsesRef);
        } catch (error: any) {
          console.error("Error fetching responses:", error);
          // 권한 에러인 경우 빈 결과로 처리
          if (error.code === 'permission-denied') {
            responsesSnap = { forEach: () => {} } as any;
          } else {
            throw error;
          }
        }
        
        const categoryData: Record<string, { prices: number[]; deliveryDays: number[]; lastWeekPrices: number[] }> = {};
        
        CATEGORIES.forEach((cat) => {
          categoryData[cat] = { prices: [], deliveryDays: [], lastWeekPrices: [] };
        });

        responsesSnap.forEach((doc: any) => {
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
          where("userType", "==", "SELLER")
        );
        // 에러 처리 추가
        let sellersSnap;
        try {
          sellersSnap = await getDocs(sellersQuery);
        } catch (error: any) {
          console.error("Error fetching sellers:", error);
          // 권한 에러인 경우 빈 결과로 처리
          if (error.code === 'permission-denied') {
            sellersSnap = { forEach: () => {} } as any;
          } else {
            throw error;
          }
        }
        
        const sellersData: User[] = [];
        sellersSnap.forEach((doc: any) => {
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
      <HeroSection />

      {/* catchfac이란? 섹션 */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            catchfac이란?
          </h2>
          <div className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto space-y-2">
            <p>catchfac은 제조업 중소기업과 부품 유통업체를 연결하는 B2B 견적 비교 플랫폼입니다.</p>
            <p>여러 업체의 견적을 한 번에 받아 비교하고, 최적의 가격과 납기로 구매할 수 있습니다.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="card text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#DC2626] rounded-lg flex items-center justify-center text-white font-bold">
                  구
                </div>
                <h3 className="text-xl font-semibold text-gray-900">구매자에게</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                여러 업체에 직접 연락할 필요 없이 한 번의 요청으로 여러 견적을 받을 수 있습니다. 
                가격과 납기를 한눈에 비교하여 최적의 선택을 하세요.
              </p>
            </div>
            <div className="card text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#1e3a8a] rounded-lg flex items-center justify-center text-white font-bold">
                  판
                </div>
                <h3 className="text-xl font-semibold text-gray-900">판매자에게</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                새로운 고객을 만나고, 실시간 견적 요청 알림을 받아 빠르게 대응할 수 있습니다. 
                프리미엄 파트너가 되면 상단 노출과 우선 알림 혜택을 받을 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 신뢰 통계 섹션 */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#1e3a8a] mb-2">100+</div>
              <div className="text-gray-600">등록 업체</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#1e3a8a] mb-2">1,000+</div>
              <div className="text-gray-600">견적 요청</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#1e3a8a] mb-2">평균 2시간</div>
              <div className="text-gray-600">견적 수신 시간</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#1e3a8a] mb-2">30%</div>
              <div className="text-gray-600">평균 비용 절감</div>
            </div>
          </div>
        </div>
      </section>


      {/* 문제 해결 섹션 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              부품 구매 고민, catchfac이 해결합니다
            </h2>
            <p className="text-gray-500">
              복잡한 견적 요청, 저희와 함께라면 쉽게 해결됩니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="text-5xl mb-4">📞</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                여러 업체에 전화하는 번거로움
              </h3>
              <p className="text-gray-600 mb-4">
                업체마다 전화하고 이메일 보내는 번거로움,
              </p>
              <p className="text-[#DC2626] font-semibold">
                한 번의 등록으로 여러 업체 견적을 한 번에!
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                가격 비교의 어려움
              </h3>
              <p className="text-gray-600 mb-4">
                각 업체마다 다른 조건과 가격,
              </p>
              <p className="text-[#DC2626] font-semibold">
                한눈에 비교하고 최적의 조건 선택!
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                시세 정보 부족
              </h3>
              <p className="text-gray-600 mb-4">
                적정 가격인지 알 수 없는 불안감,
              </p>
              <p className="text-[#DC2626] font-semibold">
                실시간 시세 정보로 합리적 구매!
              </p>
            </div>
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

      {/* How It Works Section - 강화 버전 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              복잡한 견적 요청, catchfac과 함께라면 쉽게 해결됩니다
            </h2>
            <p className="text-gray-500">
              전화 돌리지 마세요. 견적이 찾아옵니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-8 shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <div className="w-32 h-32 mx-auto mb-4 relative">
                <Image
                  src="/images/process-1-register.png"
                  alt="부품 정보 등록"
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                부품 정보 등록
              </h3>
              <p className="text-gray-600 mb-4">
                품번, 수량, 희망 납기만 입력하세요
              </p>
              <ul className="text-sm text-gray-500 space-y-1 text-left max-w-xs mx-auto">
                <li>✓ 1분이면 완료</li>
                <li>✓ 복잡한 서류 불필요</li>
                <li>✓ 간단한 정보만 입력</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <div className="w-32 h-32 mx-auto mb-4 relative">
                <Image
                  src="/images/process-2-notify.png"
                  alt="업체에서 연락"
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                업체에서 연락
              </h3>
              <p className="text-gray-600 mb-4">
                등록된 파트너 업체들이 견적을 보내드립니다
              </p>
              <ul className="text-sm text-gray-500 space-y-1 text-left max-w-xs mx-auto">
                <li>✓ 평균 2시간 내 견적 수신</li>
                <li>✓ 여러 업체 동시 비교</li>
                <li>✓ 실시간 알림 제공</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <div className="w-32 h-32 mx-auto mb-4 relative">
                <Image
                  src="/images/process-3-compare.png"
                  alt="비교 후 선택"
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                비교 후 선택
              </h3>
              <p className="text-gray-600 mb-4">
                가격, 납기 비교하고 최적의 조건 선택
              </p>
              <ul className="text-sm text-gray-500 space-y-1 text-left max-w-xs mx-auto">
                <li>✓ 한눈에 비교 가능</li>
                <li>✓ 시세 정보 제공</li>
                <li>✓ 최적 조건 선택</li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/requests/new" className="btn-primary text-lg px-8 py-4">
              지금 견적 요청하기
            </Link>
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
              {priceData.map((item) => {
                const categoryImageMap: Record<string, string> = {
                  "서보 모터": "/images/category-servo-motor.jpg",
                  "실린더": "/images/category-cylinder.jpg",
                  "모터": "/images/category-motor.jpg",
                  "베어링": "/images/category-bearing.jpg",
                  "LM 가이드": "/images/category-lm-guide.jpg",
                  "센서": "/images/category-sensor.jpg",
                  "PLC": "/images/category-plc.jpg",
                  "인버터": "/images/category-inverter.jpg",
                  "기타": "/images/category-other.jpg",
                };
                const imagePath = categoryImageMap[item.category] || "/images/category-other.jpg";
                
                return (
                <div key={item.category} className="card card-hover">
                  <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
            <Image
                      src={imagePath}
                      alt={item.category}
                      fill
                      className="object-cover"
                    />
                  </div>
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
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 성공 사례 섹션 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              실제 사용 사례
            </h2>
            <p className="text-gray-500">
              catchfac으로 더 스마트하게 구매하는 기업들
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 사례 1 */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-sm text-gray-500">A 제조업체</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                평균 30% 비용 절감, 납기 단축
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                기존에는 업체마다 전화하고 이메일 보내느라 하루 종일 걸렸는데,
                catchfac으로 한 번 등록하니 5개 업체에서 견적이 왔어요.
                가격 비교도 쉽고 평균 30%나 절감했습니다.
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>• 서보모터 구매</span>
                <span>• 5개 업체 견적</span>
                <span>• 30% 절감</span>
              </div>
            </div>

            {/* 사례 2 */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-sm text-gray-500">B 자동화 기업</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                2시간 만에 최적 견적 확보
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                급하게 필요한 실린더 부품이었는데, catchfac에 등록하니
                2시간 만에 7개 업체에서 견적이 왔습니다. 가격도 합리적이고
                납기도 빠른 업체를 바로 선택할 수 있어서 정말 편했어요.
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>• 실린더 구매</span>
                <span>• 7개 업체 견적</span>
                <span>• 2시간 내 확보</span>
              </div>
            </div>

            {/* 사례 3 */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-sm text-gray-500">C 중소 제조업체</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                시세 정보로 합리적 구매 결정
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                베어링 구매할 때 적정 가격인지 몰라서 고민이 많았는데,
                catchfac의 시세 정보를 보니 평균 가격을 알 수 있어서
                합리적으로 결정할 수 있었습니다.
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>• 베어링 구매</span>
                <span>• 시세 정보 활용</span>
                <span>• 합리적 결정</span>
              </div>
            </div>

            {/* 사례 4 */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-sm text-gray-500">D 기계 제작사</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                시간 절약으로 업무 효율 향상
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                매번 업체마다 전화하고 견적 받느라 시간이 너무 많이 걸렸는데,
                이제는 catchfac에 한 번만 등록하면 끝이에요.
                시간 절약이 정말 크고 업무 효율이 많이 좋아졌습니다.
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>• LM 가이드 구매</span>
                <span>• 시간 80% 절약</span>
                <span>• 효율 향상</span>
              </div>
            </div>

            {/* 사례 5 */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-sm text-gray-500">E 전자부품 제조사</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                여러 업체 비교로 최적 조건 발견
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                센서 구매할 때 8개 업체 견적을 한눈에 비교할 수 있어서
                가격뿐만 아니라 납기, 품질까지 종합적으로 고려해서
                정말 좋은 업체를 찾을 수 있었습니다.
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>• 센서 구매</span>
                <span>• 8개 업체 비교</span>
                <span>• 최적 조건</span>
              </div>
            </div>

            {/* 사례 6 */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-sm text-gray-500">F 자동화 솔루션</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                프리미엄 업체 우선 알림으로 빠른 대응
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                긴급하게 필요한 PLC였는데, 프리미엄 업체에서
                가장 먼저 견적이 와서 빠르게 결정할 수 있었어요.
                품질도 좋고 서비스도 훌륭했습니다.
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>• PLC 구매</span>
                <span>• 프리미엄 업체</span>
                <span>• 빠른 대응</span>
              </div>
            </div>

            {/* 사례 7 */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-sm text-gray-500">G 정밀기계 제작</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                인버터 대량 구매로 추가 할인 혜택
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                인버터를 대량으로 구매해야 했는데, 여러 업체 견적을 받아보니
                수량에 따른 추가 할인까지 받을 수 있어서 예상보다
                훨씬 저렴하게 구매했습니다.
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>• 인버터 대량 구매</span>
                <span>• 추가 할인</span>
                <span>• 비용 절감</span>
              </div>
            </div>

            {/* 사례 8 */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-sm text-gray-500">H 로봇 제조업체</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                신규 업체 발견으로 협력 관계 구축
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                catchfac을 통해 처음 알게 된 업체인데, 가격도 좋고
                서비스도 훌륭해서 지금은 주요 협력 업체가 되었어요.
                좋은 업체를 발견할 수 있는 기회가 되었습니다.
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>• 모터 구매</span>
                <span>• 신규 업체 발견</span>
                <span>• 장기 협력</span>
              </div>
            </div>

            {/* 사례 9 */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-sm text-gray-500">I 반도체 장비 제조</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                정기 구매로 자동화된 프로세스 구축
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                매월 반복 구매하는 부품들을 catchfac으로 관리하니
                프로세스가 자동화되어 정말 편해졌어요.
                구매 담당자 업무 부담이 크게 줄었습니다.
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>• 정기 구매</span>
                <span>• 프로세스 자동화</span>
                <span>• 업무 효율</span>
              </div>
            </div>

            {/* 사례 10 */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-sm text-gray-500">J 배터리 제조사</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                지역별 업체 비교로 납기 최적화
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                지역별로 업체를 비교할 수 있어서 납기를 최적화할 수 있었어요.
                가까운 지역 업체를 선택하니 배송비도 절감하고
                납기도 훨씬 빨랐습니다.
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>• 지역별 비교</span>
                <span>• 납기 최적화</span>
                <span>• 배송비 절감</span>
              </div>
            </div>

            {/* 사례 11 */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-sm text-gray-500">K 화학 장비 제작</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                복합 부품 구매로 일괄 협상 성공
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                여러 종류의 부품을 한 번에 구매해야 했는데,
                catchfac으로 여러 업체 견적을 받아서 일괄 협상할 수 있었어요.
                단가도 좋아지고 관리도 편해졌습니다.
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>• 복합 부품 구매</span>
                <span>• 일괄 협상</span>
                <span>• 단가 개선</span>
              </div>
            </div>

            {/* 사례 12 */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-sm text-gray-500">L 의료기기 제조</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                품질 인증 업체 필터링으로 안전성 확보
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                의료기기용 부품이라 품질이 중요한데, catchfac의
                인증된 업체 정보를 통해 신뢰할 수 있는 업체를
                쉽게 찾을 수 있어서 안심하고 구매했습니다.
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>• 품질 인증 업체</span>
                <span>• 안전성 확보</span>
                <span>• 신뢰 구매</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/sellers" className="text-[#DC2626] font-medium hover:underline">
              더 많은 사례 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* 통합 CTA 섹션 - 파트너 + 최종 CTA */}
      <section className="relative py-24 overflow-hidden">
        {/* 배경 이미지 */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/images/hero-desktop.jpg')] bg-cover bg-center"></div>
        </div>
        {/* 어두운 오버레이 */}
        <div className="absolute inset-0 bg-black/70"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* 왼쪽: 파트너 섹션 */}
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">
                부품 업체이신가요?
              </h2>
              <p className="text-lg text-gray-200 mb-6 drop-shadow-md leading-relaxed">
                catchfac에 파트너로 등록하고 새로운 고객을 만나보세요.<br />
                프리미엄 파트너가 되면 상단 노출, 우선 알림 등<br />
                다양한 혜택을 받을 수 있습니다.
              </p>
              
              {/* 파트너 혜택 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">파트너 혜택</h3>
                <ul className="space-y-3 text-gray-200">
                  <li className="flex items-start gap-3">
                    <span className="text-[#DC2626] mt-1 font-bold">✓</span>
                    <span>신규 견적 요청 실시간 알림</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#DC2626] mt-1 font-bold">✓</span>
                    <span>업체 프로필 페이지 제공</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#DC2626] mt-1 font-bold">✓</span>
                    <span>구매자 직접 연결</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-400 mt-1 font-bold">★</span>
                    <span className="text-yellow-400">프리미엄: 상단 노출 + 우선 알림</span>
                  </li>
                </ul>
              </div>

              {/* 버튼 */}
              <Link
                href="/register"
                className="inline-block bg-white text-[#DC2626] font-bold text-lg px-8 py-4 rounded-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                무료로 등록하기
              </Link>
            </div>

            {/* 오른쪽: 통계 및 최종 CTA */}
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                  제조업 구매의 새로운 기준
                </h2>
                <p className="text-xl text-gray-200 mb-2 drop-shadow-md">
                  catchfac과 함께 더 스마트한 구매를 시작하세요
                </p>
                <p className="text-lg text-gray-300 mb-6 drop-shadow-md">
                  흩어진 견적, 한 번에 잡다
                </p>
              </div>

              {/* 통계 카드 */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg text-center">
                  <div className="text-3xl font-bold text-[#1e3a8a] mb-1">100+</div>
                  <div className="text-sm text-gray-700">등록 업체</div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg text-center">
                  <div className="text-3xl font-bold text-[#1e3a8a] mb-1">1,000+</div>
                  <div className="text-sm text-gray-700">견적 요청</div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg text-center">
                  <div className="text-3xl font-bold text-[#1e3a8a] mb-1">30%</div>
                  <div className="text-sm text-gray-700">평균 비용 절감</div>
                </div>
              </div>

              {/* CTA 버튼 */}
              <div className="flex justify-center">
                {!user ? (
                  <Link
                    href="/register"
                    className="inline-block bg-[#DC2626] text-white font-bold text-xl md:text-2xl px-14 py-7 rounded-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 whitespace-nowrap"
                  >
                    지금 견적받기
                  </Link>
                ) : (
                  <Link
                    href={user.userType === "BUYER" ? "/requests/new" : "/requests"}
                    className="inline-block bg-[#DC2626] text-white font-bold text-lg px-10 py-5 rounded-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    {user.userType === "BUYER" ? "견적 요청하기" : "견적 요청 보기"}
                  </Link>
                )}
              </div>

              {/* 추가 메시지 */}
              <div className="mt-6 text-center">
                <p className="text-white/90 text-sm drop-shadow-md">
                  ✓ 무료 회원가입  ✓ 즉시 이용 가능  ✓ 별도 계약 없음
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 플로팅 상담 신청 버튼 */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowConsultationModal(true)}
          className="bg-[#DC2626] text-white px-6 py-4 rounded-full shadow-lg hover:bg-red-700 transition-all transform hover:scale-105 flex items-center gap-2 font-bold"
        >
          <span>📞</span>
          <span className="hidden sm:inline">판매자 등록 문의</span>
          <span className="sm:hidden">문의</span>
        </button>
      </div>

      {/* 상담 신청 모달 */}
      <ConsultationModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
      />
    </div>
  );
}
