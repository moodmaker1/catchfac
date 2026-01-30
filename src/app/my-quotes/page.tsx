"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  Firestore,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { QuoteResponse, QuoteRequest } from "@/types";

interface QuoteWithRequest extends QuoteResponse {
  request?: QuoteRequest;
}

export default function MyQuotesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteWithRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (!user || user.userType !== "SELLER") {
      if (!authLoading && user?.userType === "BUYER") {
        router.push("/requests");
      }
      return;
    }

    const fetchQuotes = async () => {
      const firestore = db as Firestore | undefined;
      if (!firestore) {
        setLoading(false);
        return;
      }

      try {
        const responsesRef = collection(firestore, "quoteResponses");
        const q = query(
          responsesRef,
          where("sellerId", "==", user.id),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const quotesData: QuoteWithRequest[] = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();

          // Fetch related request
          let request: QuoteRequest | undefined;
          try {
            const requestDoc = await getDoc(
              doc(firestore, "quoteRequests", data.requestId)
            );
            if (requestDoc.exists()) {
              const requestData = requestDoc.data();
              request = {
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
              };
            }
          } catch (err) {
            console.error("Error fetching request:", err);
          }

          quotesData.push({
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
            request,
          });
        }

        setQuotes(quotesData);
      } catch (error) {
        console.error("Error fetching quotes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.userType !== "SELLER") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">제출한 견적</h1>

      {quotes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">아직 제출한 견적이 없습니다</p>
          <Link href="/requests" className="btn-primary">
            견적 요청 보기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <Link
              key={quote.id}
              href={`/requests/${quote.requestId}`}
              className="card card-hover block"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {quote.isSelected && (
                    <span className="bg-[#DC2626] text-white text-xs px-2 py-1 rounded">
                      선택됨
                    </span>
                  )}
                  {quote.inStock && (
                    <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded">
                      재고
                    </span>
                  )}
                  {quote.request && (
                    <>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {quote.request.category}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {quote.request.maker}
                      </span>
                    </>
                  )}
                </div>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded ${
                    quote.request?.status === "OPEN"
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {quote.request?.status === "OPEN" ? "진행중" : "마감"}
                </span>
              </div>

              {quote.request && (
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {quote.request.partNumber}
                </h3>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400 block">제출 단가</span>
                  <span className="font-semibold text-gray-900">
                    ₩{quote.unitPrice.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">총 금액</span>
                  <span className="font-semibold text-gray-900">
                    ₩{quote.totalPrice.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">납기</span>
                  <span className="font-semibold text-gray-900">
                    {quote.deliveryDays}일
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">요청업체</span>
                  <span className="font-semibold text-gray-900">
                    {quote.request?.buyerCompany || "-"}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-400">
                제출일:{" "}
                {quote.createdAt.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
