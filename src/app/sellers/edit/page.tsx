"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc, Firestore } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CATEGORIES, REGIONS } from "@/types";

export default function EditSellerProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (!authLoading && user?.userType !== "SELLER") {
      router.push("/");
      return;
    }

    // 기존 데이터 로드
    if (user) {
      setPhone(user.phone || "");
      setDescription(user.description || "");
      setSelectedCategories(user.categories || []);
      setRegion(user.region || "");
    }
  }, [user, authLoading, router]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (selectedCategories.length === 0) {
      setError("취급 품목을 1개 이상 선택해주세요");
      return;
    }

    if (!region) {
      setError("지역을 선택해주세요");
      return;
    }

    const firestore = db as Firestore | undefined;
    if (!firestore || !user) {
      setError("오류가 발생했습니다");
      return;
    }

    setLoading(true);

    try {
      await updateDoc(doc(firestore, "users", user.id), {
        phone,
        description,
        categories: selectedCategories,
        region,
        profileComplete: true,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(`/sellers/${user.id}`);
      }, 1500);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("프로필 저장 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8" />
          <div className="card">
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.userType !== "SELLER") {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">업체 프로필 설정</h1>
      <p className="text-gray-500 mb-8">
        프로필을 완성하면 파트너 업체 목록에 노출됩니다
      </p>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg">
              프로필이 저장되었습니다. 잠시 후 이동합니다...
            </div>
          )}

          {/* Company Info (Read Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              회사명
            </label>
            <input
              type="text"
              value={user.company}
              disabled
              className="input-field bg-gray-50 text-gray-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              연락처
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              placeholder="02-1234-5678"
            />
          </div>

          {/* Region */}
          <div>
            <label
              htmlFor="region"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              지역 *
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="input-field"
              required
            >
              <option value="">선택하세요</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              취급 품목 * (복수 선택 가능)
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    selectedCategories.includes(category)
                      ? "border-[#DC2626] bg-red-50 text-[#DC2626]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              업체 소개
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              rows={4}
              placeholder="업체를 소개해주세요. 주요 취급 품목, 강점, 납기 등을 안내하면 좋습니다."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "저장 중..." : "프로필 저장"}
          </button>
        </form>
      </div>

      {/* Premium CTA */}
      <div className="mt-8 card bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white">
        <h2 className="text-lg font-semibold mb-2">프리미엄 파트너 되기</h2>
        <p className="text-red-100 text-sm mb-4">
          상단 노출, 우선 견적 알림 등 프리미엄 혜택을 받아보세요
        </p>
        <button className="bg-white text-[#DC2626] font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
          프리미엄 문의하기
        </button>
      </div>
    </div>
  );
}
