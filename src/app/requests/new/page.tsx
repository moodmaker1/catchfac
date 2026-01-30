"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, Firestore } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CATEGORIES, MAKERS } from "@/types";

export default function NewRequestPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [category, setCategory] = useState("");
  const [maker, setMaker] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [desiredDelivery, setDesiredDelivery] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8" />
          <div className="card">
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
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

  if (!user) {
    router.push("/login");
    return null;
  }

  if (user.userType !== "BUYER") {
    router.push("/requests");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const firestore = db as Firestore | undefined;
    if (!firestore) {
      setError("Firebase가 초기화되지 않았습니다");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(firestore, "quoteRequests"), {
        buyerId: user.id,
        buyerCompany: user.company,
        category,
        maker,
        partNumber,
        quantity: parseInt(quantity),
        desiredDelivery,
        note,
        status: "OPEN",
        createdAt: new Date(),
      });

      router.push("/requests");
    } catch (err) {
      console.error("Error creating request:", err);
      setError("견적 요청 등록 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">새 견적 요청</h1>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              품목 카테고리
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
              required
            >
              <option value="">선택하세요</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="maker"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              메이커
            </label>
            <select
              id="maker"
              value={maker}
              onChange={(e) => setMaker(e.target.value)}
              className="input-field"
              required
            >
              <option value="">선택하세요</option>
              {MAKERS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="partNumber"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              품번
            </label>
            <input
              type="text"
              id="partNumber"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              className="input-field"
              placeholder="예: HG-KR43B"
              required
            />
          </div>

          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              수량 (EA)
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input-field"
              placeholder="예: 4"
              min="1"
              required
            />
          </div>

          <div>
            <label
              htmlFor="desiredDelivery"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              희망 납기
            </label>
            <input
              type="text"
              id="desiredDelivery"
              value={desiredDelivery}
              onChange={(e) => setDesiredDelivery(e.target.value)}
              className="input-field"
              placeholder="예: 2주 이내, 급납, 협의 가능"
              required
            />
          </div>

          <div>
            <label
              htmlFor="note"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              비고 (선택)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="추가 요청사항이 있으시면 입력해주세요"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 btn-secondary"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "등록 중..." : "견적 요청"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
