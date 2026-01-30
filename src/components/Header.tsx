"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#DC2626]">Catchpac</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/sellers"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              파트너 업체
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

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-10 w-24 bg-gray-100 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-sm">
                  <span className="text-gray-500">{user.company}</span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="font-medium text-gray-700">{user.name}</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {user.userType === "BUYER" ? "구매자" : "판매자"}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="btn-secondary text-sm py-2 px-4"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm py-2 px-4"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && (
        <div className="md:hidden border-t border-gray-100 px-4 py-2">
          <div className="flex gap-4 text-sm">
            <Link href="/sellers" className="text-gray-600 hover:text-gray-900">
              파트너 업체
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
          <div className="flex gap-4 text-sm">
            <Link href="/sellers" className="text-gray-600 hover:text-gray-900">
              파트너 업체
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
