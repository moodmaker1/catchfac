"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, Firestore } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function SellerDetailPage() {
  const params = useParams();
  const sellerId = params.id as string;
  const { user } = useAuth();

  const [seller, setSeller] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeller = async () => {
      const firestore = db as Firestore | undefined;
      if (!firestore || !sellerId) {
        setLoading(false);
        return;
      }

      try {
        const sellerDoc = await getDoc(doc(firestore, "users", sellerId));
        if (sellerDoc.exists()) {
          const data = sellerDoc.data();
          setSeller({
            id: sellerDoc.id,
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
        }
      } catch (error) {
        console.error("Error fetching seller:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeller();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="card">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 bg-gray-200 rounded w-1/2" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-400 mb-4">업체를 찾을 수 없습니다</p>
        <Link href="/sellers" className="btn-primary">
          업체 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {seller.isPremium && (
            <span className="bg-[#DC2626] text-white text-xs font-semibold px-3 py-1 rounded-full">
              프리미엄 파트너
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {seller.company}
        </h1>
        <p className="text-gray-500">
          {seller.region} · {seller.name} 담당
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {seller.description && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                업체 소개
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {seller.description}
              </p>
            </div>
          )}

          {/* Categories */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              취급 품목
            </h2>
            <div className="flex flex-wrap gap-2">
              {seller.categories?.map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Card */}
        <div className="lg:col-span-1">
          <div className={`card sticky top-24 ${seller.isPremium ? "border-2 border-[#DC2626]" : ""}`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              연락처
            </h2>

            <div className="space-y-3 mb-6">
              <div>
                <span className="text-sm text-gray-400 block">담당자</span>
                <span className="text-gray-900">{seller.name}</span>
              </div>
              {seller.phone && (
                <div>
                  <span className="text-sm text-gray-400 block">전화번호</span>
                  <a
                    href={`tel:${seller.phone}`}
                    className="text-[#DC2626] font-medium hover:underline"
                  >
                    {seller.phone}
                  </a>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-400 block">이메일</span>
                <a
                  href={`mailto:${seller.email}`}
                  className="text-[#DC2626] font-medium hover:underline"
                >
                  {seller.email}
                </a>
              </div>
              <div>
                <span className="text-sm text-gray-400 block">지역</span>
                <span className="text-gray-900">{seller.region}</span>
              </div>
            </div>

            {user?.userType === "BUYER" && (
              <Link
                href="/requests/new"
                className="w-full btn-primary block text-center"
              >
                견적 요청하기
              </Link>
            )}

            {!user && (
              <Link
                href="/register"
                className="w-full btn-primary block text-center"
              >
                회원가입 후 연락하기
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Back Link */}
      <div className="mt-8">
        <Link
          href="/sellers"
          className="text-gray-500 hover:text-gray-700"
        >
          ← 업체 목록으로
        </Link>
      </div>
    </div>
  );
}
