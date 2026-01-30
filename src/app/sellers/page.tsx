"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Firestore,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, CATEGORIES, REGIONS } from "@/types";

export default function SellersPage() {
  const [sellers, setSellers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  useEffect(() => {
    const fetchSellers = async () => {
      const firestore = db as Firestore | undefined;
      if (!firestore) {
        setLoading(false);
        return;
      }

      try {
        const usersRef = collection(firestore, "users");
        const q = query(
          usersRef,
          where("userType", "==", "SELLER"),
          where("profileComplete", "==", true)
        );

        const snapshot = await getDocs(q);
        const sellersData: User[] = [];

        snapshot.forEach((doc) => {
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
            premiumUntil: data.premiumUntil?.toDate(),
            profileComplete: data.profileComplete,
          });
        });

        // 프리미엄 업체 먼저, 그 다음 일반 업체
        sellersData.sort((a, b) => {
          if (a.isPremium && !b.isPremium) return -1;
          if (!a.isPremium && b.isPremium) return 1;
          return 0;
        });

        setSellers(sellersData);
      } catch (error) {
        console.error("Error fetching sellers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, []);

  const filteredSellers = sellers.filter((seller) => {
    if (selectedCategory && !seller.categories?.includes(selectedCategory)) {
      return false;
    }
    if (selectedRegion && seller.region !== selectedRegion && seller.region !== "전국") {
      return false;
    }
    return true;
  });

  // 필터링 후에도 프리미엄 먼저
  const sortedSellers = [...filteredSellers].sort((a, b) => {
    if (a.isPremium && !b.isPremium) return -1;
    if (!a.isPremium && b.isPremium) return 1;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">파트너 업체</h1>
        <p className="text-gray-500">
          검증된 부품 전문 업체들을 만나보세요
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">전체 품목</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">전체 지역</option>
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : sortedSellers.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-2">등록된 업체가 없습니다</p>
          <p className="text-sm text-gray-400">
            파트너 업체로 등록하시려면 판매자로 가입해주세요
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSellers.map((seller) => (
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

                {seller.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {seller.description}
                  </p>
                )}

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
      )}

      {/* CTA for sellers */}
      <div className="mt-16 bg-gray-50 rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          파트너 업체로 등록하세요
        </h2>
        <p className="text-gray-500 mb-6">
          Catchpac에 업체를 등록하고 새로운 고객을 만나보세요
        </p>
        <Link href="/register" className="btn-primary">
          무료로 등록하기
        </Link>
      </div>
    </div>
  );
}
