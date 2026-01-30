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
  getCountFromServer,
  Firestore,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { QuoteRequest } from "@/types";

export default function RequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<(QuoteRequest & { responseCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (!user) return;

    const fetchRequests = async () => {
      const firestore = db as Firestore | undefined;
      if (!firestore) {
        setLoading(false);
        return;
      }

      try {
        const requestsRef = collection(firestore, "quoteRequests");
        let q;

        if (user.userType === "BUYER") {
          q = query(
            requestsRef,
            where("buyerId", "==", user.id),
            orderBy("createdAt", "desc")
          );
        } else {
          q = query(
            requestsRef,
            where("status", "==", "OPEN"),
            orderBy("createdAt", "desc")
          );
        }

        const snapshot = await getDocs(q);
        const requestsData: (QuoteRequest & { responseCount: number })[] = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          
          const responsesRef = collection(firestore, "quoteResponses");
          const responsesQuery = query(responsesRef, where("requestId", "==", docSnap.id));
          const responsesCount = await getCountFromServer(responsesQuery);

          requestsData.push({
            id: docSnap.id,
            buyerId: data.buyerId,
            buyerCompany: data.buyerCompany,
            category: data.category,
            maker: data.maker,
            partNumber: data.partNumber,
            quantity: data.quantity,
            desiredDelivery: data.desiredDelivery,
            note: data.note,
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date(),
            responseCount: responsesCount.data().count,
          });
        }

        setRequests(requestsData);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
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

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {user.userType === "BUYER" ? "내 견적 요청" : "견적 요청 목록"}
        </h1>
        {user.userType === "BUYER" && (
          <Link href="/requests/new" className="btn-primary">
            새 견적 요청
          </Link>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">
            {user.userType === "BUYER"
              ? "아직 등록한 견적 요청이 없습니다"
              : "현재 열린 견적 요청이 없습니다"}
          </p>
          {user.userType === "BUYER" && (
            <Link href="/requests/new" className="btn-primary">
              첫 견적 요청하기
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Link
              key={request.id}
              href={`/requests/${request.id}`}
              className="card card-hover block"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded mr-2">
                    {request.category}
                  </span>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                    {request.maker}
                  </span>
                </div>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded ${
                    request.status === "OPEN"
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {request.status === "OPEN" ? "진행중" : "마감"}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {request.partNumber}
              </h3>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>수량: {request.quantity}EA</span>
                <span>희망 납기: {request.desiredDelivery}</span>
                <span>받은 견적: {request.responseCount}건</span>
                {user.userType === "SELLER" && (
                  <span>요청업체: {request.buyerCompany}</span>
                )}
              </div>

              <div className="mt-3 text-xs text-gray-400">
                {request.createdAt.toLocaleDateString("ko-KR", {
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
