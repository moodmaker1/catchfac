export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#DC2626]">Catchpac</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-500">
              제조업 구매품 견적 비교 플랫폼
            </span>
          </div>
          <div className="text-sm text-gray-400">
            © 2026 Catchpac. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
