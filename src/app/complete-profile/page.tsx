"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserType } from "@/types";

export default function CompleteProfilePage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [userType, setUserType] = useState<UserType>("BUYER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { firebaseUser, user, needsProfile, completeProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // sessionStorage에서 사용자 유형 가져오기
  useEffect(() => {
    const pendingUserType = sessionStorage.getItem("pendingUserType") as UserType;
    if (pendingUserType && (pendingUserType === "BUYER" || pendingUserType === "SELLER")) {
      setUserType(pendingUserType);
    }
  }, []);

  useEffect(() => {
    // 이미 프로필이 완성된 경우 메인으로
    if (!authLoading && user) {
      router.push("/");
      return;
    }
    
    // 로그인되지 않은 경우 로그인 페이지로
    if (!authLoading && !firebaseUser && !needsProfile) {
      router.push("/login");
      return;
    }
  }, [user, firebaseUser, needsProfile, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("담당자명을 입력해주세요");
      return;
    }

    if (!company.trim()) {
      setError("회사명을 입력해주세요");
      return;
    }

    setLoading(true);

    try {
      await completeProfile(name, company, userType);
      // 프로필 완성 후 sessionStorage 정리
      sessionStorage.removeItem("pendingUserType");
      router.push("/");
    } catch (err) {
      console.error("Error completing profile:", err);
      setError("프로필 저장 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">프로필 완성</h1>
          <p className="text-gray-500">서비스 이용을 위해 추가 정보를 입력해주세요</p>
        </div>

        <div className="card">
          {/* 구글 계정 정보 표시 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-6">
            {firebaseUser.photoURL ? (
              <img
                src={firebaseUser.photoURL}
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
                {firebaseUser.email?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">
                {firebaseUser.displayName || "사용자"}
              </p>
              <p className="text-sm text-gray-500">{firebaseUser.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                사용자 유형
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType("BUYER")}
                  className={`p-4 rounded-lg border-2 text-center transition-colors ${
                    userType === "BUYER"
                      ? "border-[#DC2626] bg-red-50 text-[#DC2626]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold mb-1">구매자</div>
                  <div className="text-xs opacity-70">견적 요청</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("SELLER")}
                  className={`p-4 rounded-lg border-2 text-center transition-colors ${
                    userType === "SELLER"
                      ? "border-[#DC2626] bg-red-50 text-[#DC2626]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold mb-1">판매자</div>
                  <div className="text-xs opacity-70">견적 제출</div>
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                회사명
              </label>
              <input
                type="text"
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="input-field"
                placeholder="(주)회사명"
                required
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                담당자명
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="홍길동"
                defaultValue={firebaseUser.displayName || ""}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "저장 중..." : "시작하기"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
