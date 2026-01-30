"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, getDocs, updateDoc, doc, Firestore } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, QuoteRequest } from "@/types";
import { isAdmin } from "@/lib/admin";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalBuyers: 0,
    totalRequests: 0,
    premiumSellers: 0,
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentRequests, setRecentRequests] = useState<QuoteRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin(user))) {
      router.push("/");
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && isAdmin(user)) {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    const firestore = db as Firestore | undefined;
    if (!firestore) return;

    setRefreshing(true);
    try {
      // 통계 데이터 가져오기
      const usersSnapshot = await getDocs(collection(firestore, "users"));
      const requestsSnapshot = await getDocs(collection(firestore, "quoteRequests"));

      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as User[];

      const requests = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as QuoteRequest[];

      const sellers = users.filter(u => u.userType === "SELLER");
      const buyers = users.filter(u => u.userType === "BUYER");

      setStats({
        totalUsers: users.length,
        totalSellers: sellers.length,
        totalBuyers: buyers.length,
        totalRequests: requests.length,
        premiumSellers: sellers.filter(s => s.isPremium).length,
      });

      setRecentUsers(users.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      ).slice(0, 10));
      setRecentRequests(requests.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      ).slice(0, 10));
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const togglePremium = async (userId: string, currentStatus: boolean) => {
    const firestore = db as Firestore | undefined;
    if (!firestore) {
      alert("Firebase가 초기화되지 않았습니다");
      return;
    }

    if (!user || !isAdmin(user)) {
      alert("관리자 권한이 필요합니다");
      return;
    }
    
    try {
      await updateDoc(doc(firestore, "users", userId), {
        isPremium: !currentStatus,
      });
      // 성공 메시지
      alert(`프리미엄 상태가 ${!currentStatus ? '설정' : '해제'}되었습니다.`);
      fetchAdminData(); // 데이터 새로고침
    } catch (error: any) {
      console.error("Error updating premium status:", error);
      let errorMessage = "프리미엄 상태 변경 중 오류가 발생했습니다";
      
      if (error.code === "permission-denied") {
        errorMessage = "권한이 없습니다. 관리자 권한을 확인해주세요.";
      } else if (error.message) {
        errorMessage = `오류: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  if (loading || refreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC2626] mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin(user)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <button
            onClick={fetchAdminData}
            className="px-4 py-2 bg-[#DC2626] text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            새로고침
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">전체 사용자</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">판매자</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalSellers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">구매자</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalBuyers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">견적 요청</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalRequests}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">프리미엄 판매자</p>
            <p className="text-3xl font-bold text-gray-900">{stats.premiumSellers}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 최근 사용자 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">최근 가입 사용자</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">회사</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">프리미엄</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        사용자 데이터가 없습니다
                      </td>
                    </tr>
                  ) : (
                    recentUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{u.company}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            u.userType === "SELLER" 
                              ? "bg-blue-100 text-blue-800" 
                              : "bg-green-100 text-green-800"
                          }`}>
                            {u.userType === "SELLER" ? "판매자" : "구매자"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {u.isPremium ? (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">프리미엄</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {u.userType === "SELLER" && (
                            <button
                              onClick={() => togglePremium(u.id, u.isPremium || false)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                u.isPremium
                                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              }`}
                            >
                              {u.isPremium ? "해제" : "설정"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 최근 견적 요청 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">최근 견적 요청</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청업체</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">메이커</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">수량</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        견적 요청 데이터가 없습니다
                      </td>
                    </tr>
                  ) : (
                    recentRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{req.buyerCompany}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{req.category}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{req.maker}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{req.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            req.status === "OPEN" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {req.status === "OPEN" ? "진행중" : "완료"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
