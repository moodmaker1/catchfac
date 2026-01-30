"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  orderBy,
  Firestore,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { QuoteRequest, QuoteResponse } from "@/types";

export default function RequestDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [responses, setResponses] = useState<QuoteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"price" | "delivery">("price");

  // Seller quote form
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [unitPrice, setUnitPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [inStock, setInStock] = useState(false);
  const [quoteNote, setQuoteNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (!user || !requestId) return;

    const fetchData = async () => {
      const firestore = db as Firestore | undefined;
      if (!firestore) {
        setLoading(false);
        return;
      }

      try {
        // Fetch request
        const requestDoc = await getDoc(doc(firestore, "quoteRequests", requestId));
        if (!requestDoc.exists()) {
          router.push("/requests");
          return;
        }

        const requestData = requestDoc.data();
        setRequest({
          id: requestDoc.id,
          buyerId: requestData.buyerId,
          buyerCompany: requestData.buyerCompany,
          category: requestData.category,
          maker: requestData.maker,
          partNumber: requestData.partNumber,
          quantity: requestData.quantity,
          desiredDelivery: requestData.desiredDelivery,
          note: requestData.note,
          status: requestData.status,
          createdAt: requestData.createdAt?.toDate() || new Date(),
          isAnonymous: requestData.isAnonymous || false,
        });

        // Fetch responses
        const responsesRef = collection(firestore, "quoteResponses");
        const responsesQuery = query(
          responsesRef,
          where("requestId", "==", requestId),
          orderBy("createdAt", "desc")
        );
        const responsesSnap = await getDocs(responsesQuery);

        const responsesData: QuoteResponse[] = [];
        responsesSnap.forEach((docSnap) => {
          const data = docSnap.data();
          responsesData.push({
            id: docSnap.id,
            requestId: data.requestId,
            sellerId: data.sellerId,
            sellerCompany: data.sellerCompany,
            unitPrice: data.unitPrice,
            totalPrice: data.totalPrice,
            deliveryDays: data.deliveryDays,
            inStock: data.inStock,
            note: data.note,
            isSelected: data.isSelected,
            createdAt: data.createdAt?.toDate() || new Date(),
          });

          // Check if current seller has already submitted
          if (user.userType === "SELLER" && data.sellerId === user.id) {
            setHasSubmitted(true);
          }
        });

        setResponses(responsesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, requestId, router]);

  const sortedResponses = [...responses].sort((a, b) => {
    if (sortBy === "price") {
      return a.unitPrice - b.unitPrice;
    }
    return a.deliveryDays - b.deliveryDays;
  });

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const firestore = db as Firestore | undefined;
    if (!user || !request || !firestore) return;

    setSubmitting(true);

    try {
      const totalPrice = parseInt(unitPrice) * request.quantity;

      await addDoc(collection(firestore, "quoteResponses"), {
        requestId: request.id,
        sellerId: user.id,
        sellerCompany: user.company,
        unitPrice: parseInt(unitPrice),
        totalPrice,
        deliveryDays: parseInt(deliveryDays),
        inStock,
        note: quoteNote,
        isSelected: false,
        createdAt: new Date(),
      });

      // Refresh data
      setHasSubmitted(true);
      setShowQuoteForm(false);
      
      // Refetch responses
      const responsesRef = collection(firestore, "quoteResponses");
      const responsesQuery = query(
        responsesRef,
        where("requestId", "==", requestId),
        orderBy("createdAt", "desc")
      );
      const responsesSnap = await getDocs(responsesQuery);

      const responsesData: QuoteResponse[] = [];
      responsesSnap.forEach((docSnap) => {
        const data = docSnap.data();
        responsesData.push({
          id: docSnap.id,
          requestId: data.requestId,
          sellerId: data.sellerId,
          sellerCompany: data.sellerCompany,
          unitPrice: data.unitPrice,
          totalPrice: data.totalPrice,
          deliveryDays: data.deliveryDays,
          inStock: data.inStock,
          note: data.note,
          isSelected: data.isSelected,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      setResponses(responsesData);
    } catch (error) {
      console.error("Error submitting quote:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectQuote = async (responseId: string) => {
    const firestore = db as Firestore | undefined;
    if (!user || user.userType !== "BUYER" || !request || !firestore) return;

    try {
      // Update the selected response
      await updateDoc(doc(firestore, "quoteResponses", responseId), {
        isSelected: true,
      });

      // Update request status
      await updateDoc(doc(firestore, "quoteRequests", request.id), {
        status: "CLOSED",
      });

      // Update local state
      setResponses(
        responses.map((r) =>
          r.id === responseId ? { ...r, isSelected: true } : r
        )
      );
      setRequest({ ...request, status: "CLOSED" });
    } catch (error) {
      console.error("Error selecting quote:", error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8" />
          <div className="card mb-6">
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

  if (!user || !request) return null;

  const isBuyer = user.userType === "BUYER";
  const isOwner = user.id === request.buyerId;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Request Info */}
      <div className="card mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded mr-2">
              {request.category}
            </span>
            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
              {request.maker}
            </span>
          </div>
          <span
            className={`text-sm font-medium px-3 py-1 rounded ${
              request.status === "OPEN"
                ? "bg-green-50 text-green-600"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {request.status === "OPEN" ? "진행중" : "마감"}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {request.partNumber}
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400 block">수량</span>
            <span className="font-medium text-gray-900">{request.quantity} EA</span>
          </div>
          <div>
            <span className="text-gray-400 block">희망 납기</span>
            <span className="font-medium text-gray-900">{request.desiredDelivery}</span>
          </div>
          <div>
            <span className="text-gray-400 block">요청업체</span>
            <span className="font-medium text-gray-900">
              {request.isAnonymous ? "익명" : request.buyerCompany}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">등록일</span>
            <span className="font-medium text-gray-900">
              {request.createdAt.toLocaleDateString("ko-KR")}
            </span>
          </div>
        </div>

        {request.note && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-gray-400 text-sm block mb-1">비고</span>
            <p className="text-gray-700">{request.note}</p>
          </div>
        )}
      </div>

      {/* Seller Quote Form */}
      {!isBuyer && request.status === "OPEN" && !hasSubmitted && (
        <div className="mb-8">
          {!showQuoteForm ? (
            <button
              onClick={() => setShowQuoteForm(true)}
              className="w-full btn-primary"
            >
              견적 제출하기
            </button>
          ) : (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                견적 제출
              </h2>
              <form onSubmit={handleSubmitQuote} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      단가 (원)
                    </label>
                    <input
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className="input-field"
                      placeholder="예: 450000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      납기 (일)
                    </label>
                    <input
                      type="number"
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(e.target.value)}
                      className="input-field"
                      placeholder="예: 14"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="inStock"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="w-4 h-4 text-[#DC2626] rounded"
                  />
                  <label htmlFor="inStock" className="text-sm text-gray-700">
                    재고 보유
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비고 (선택)
                  </label>
                  <textarea
                    value={quoteNote}
                    onChange={(e) => setQuoteNote(e.target.value)}
                    className="input-field"
                    rows={2}
                    placeholder="추가 안내사항"
                  />
                </div>

                {unitPrice && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-500">총 금액: </span>
                    <span className="font-semibold text-gray-900">
                      ₩{(parseInt(unitPrice) * request.quantity).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowQuoteForm(false)}
                    className="flex-1 btn-secondary"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 btn-primary disabled:opacity-50"
                  >
                    {submitting ? "제출 중..." : "제출"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {!isBuyer && hasSubmitted && (
        <div className="mb-8 bg-green-50 text-green-700 p-4 rounded-lg text-center">
          이미 견적을 제출하셨습니다
        </div>
      )}

      {/* Responses List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            받은 견적 ({responses.length}건)
          </h2>
          {responses.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("price")}
                className={`text-sm px-3 py-1 rounded ${
                  sortBy === "price"
                    ? "bg-[#DC2626] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                가격순
              </button>
              <button
                onClick={() => setSortBy("delivery")}
                className={`text-sm px-3 py-1 rounded ${
                  sortBy === "delivery"
                    ? "bg-[#DC2626] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                납기순
              </button>
            </div>
          )}
        </div>

        {responses.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            아직 받은 견적이 없습니다
          </div>
        ) : (
          <div className="space-y-4">
            {sortedResponses.map((response, index) => (
              <div
                key={response.id}
                className={`card ${
                  response.isSelected
                    ? "border-2 border-[#DC2626] bg-red-50"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {sortBy === "price" && index === 0 && (
                      <span className="bg-[#DC2626] text-white text-xs px-2 py-1 rounded">
                        최저가
                      </span>
                    )}
                    {sortBy === "delivery" && index === 0 && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        최단납기
                      </span>
                    )}
                    {response.inStock && (
                      <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded">
                        재고
                      </span>
                    )}
                    {response.isSelected && (
                      <span className="bg-[#DC2626] text-white text-xs px-2 py-1 rounded">
                        선택됨
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">
                    {response.sellerCompany}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <span className="text-gray-400 text-sm block">단가</span>
                    <span className="text-xl font-bold text-gray-900">
                      ₩{response.unitPrice.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm block">총 금액</span>
                    <span className="text-xl font-bold text-gray-900">
                      ₩{response.totalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm block">납기</span>
                    <span className="text-xl font-bold text-gray-900">
                      {response.deliveryDays}일
                    </span>
                  </div>
                </div>

                {response.note && (
                  <p className="text-sm text-gray-500 mb-3">{response.note}</p>
                )}

                {isOwner && request.status === "OPEN" && !response.isSelected && (
                  <button
                    onClick={() => handleSelectQuote(response.id)}
                    className="w-full btn-primary mt-2"
                  >
                    이 견적 선택하기
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
