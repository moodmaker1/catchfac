"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConsultationModal from "./ConsultationModal";

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="catchfac"
              width={350}
              height={87}
              className="h-16 md:h-20 w-auto"
              priority
              unoptimized
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/sellers"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              파트너 업체
            </Link>
            <Link
              href="/guide"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              이용 안내
            </Link>
            <Link
              href="/partner"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              파트너 되기
            </Link>
            <Link
              href="/support"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              고객센터
            </Link>
            <Link
              href="/notice"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              공지사항
            </Link>
            {user && user.userType === "BUYER" && (
              <Link
                href="/requests"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                내 견적 요청
              </Link>
            )}
            {user && user.userType === "SELLER" && (
              <>
                <Link
                  href="/requests"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  견적 요청
                </Link>
                <Link
                  href="/sellers/edit"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  내 프로필
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-10 w-24 bg-gray-100 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-sm">
                  <span className="text-gray-500">{user.company}</span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="font-medium text-gray-700">{user.name}</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {user.userType === "BUYER" ? "구매자" : "판매자"}
                  </span>
                </div>
                <button
                  onClick={() => setShowConsultationModal(true)}
                  className="h-10 px-4 text-sm font-medium rounded-lg bg-[#1e3a8a] text-white hover:bg-blue-900 transition-colors"
                >
                  판매자 등록 문의
                </button>
                <button
                  onClick={handleSignOut}
                  className="h-10 px-4 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowConsultationModal(true)}
                  className="hidden md:block h-10 px-4 text-sm font-medium rounded-lg bg-[#1e3a8a] text-white hover:bg-blue-900 transition-colors"
                >
                  판매자 등록 문의
                </button>
                <Link
                  href="/login"
                  className="h-10 px-4 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="h-10 px-4 text-sm font-medium rounded-lg bg-[#DC2626] text-white hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && (
        <div className="md:hidden border-t border-gray-100 px-4 py-2">
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/sellers" className="text-gray-600 hover:text-gray-900">
              파트너 업체
            </Link>
            <Link href="/guide" className="text-gray-600 hover:text-gray-900">
              이용 안내
            </Link>
            <Link href="/partner" className="text-gray-600 hover:text-gray-900">
              파트너 되기
            </Link>
            <Link href="/support" className="text-gray-600 hover:text-gray-900">
              고객센터
            </Link>
            <Link href="/notice" className="text-gray-600 hover:text-gray-900">
              공지사항
            </Link>
            {user.userType === "BUYER" && (
              <Link href="/requests" className="text-gray-600 hover:text-gray-900">
                내 견적 요청
              </Link>
            )}
            {user.userType === "SELLER" && (
              <>
                <Link href="/requests" className="text-gray-600 hover:text-gray-900">
                  견적 요청
                </Link>
                <Link href="/sellers/edit" className="text-gray-600 hover:text-gray-900">
                  내 프로필
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Navigation for non-logged in */}
      {!user && !loading && (
        <div className="md:hidden border-t border-gray-100 px-4 py-2">
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/sellers" className="text-gray-600 hover:text-gray-900">
              파트너 업체
            </Link>
            <Link href="/guide" className="text-gray-600 hover:text-gray-900">
              이용 안내
            </Link>
            <Link href="/partner" className="text-gray-600 hover:text-gray-900">
              파트너 되기
            </Link>
            <Link href="/support" className="text-gray-600 hover:text-gray-900">
              고객센터
            </Link>
            <Link href="/notice" className="text-gray-600 hover:text-gray-900">
              공지사항
            </Link>
            <button
              onClick={() => setShowConsultationModal(true)}
              className="text-[#1e3a8a] hover:text-blue-900 font-medium"
            >
              판매자 등록 문의
            </button>
          </div>
        </div>
      )}

      {/* 상담 신청 모달 */}
      <ConsultationModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
      />
    </header>
  );
}
