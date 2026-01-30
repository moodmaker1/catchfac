# Catchpac

**부품 구매 고민의 순간, Catchpac**

제조업 중소기업을 위한 구매품 견적 비교 플랫폼 + 실시간 시세 정보 서비스

## 주요 기능

### 구매자 (중소 제조업체)
- 부품 견적 요청 등록 (품목, 메이커, 품번, 수량, 희망 납기)
- 여러 대리점으로부터 견적 수신
- 가격/납기 기준 견적 비교
- 최적 견적 선택

### 판매자 (대리점/유통사)
- 열린 견적 요청 목록 조회
- 견적 제출 (단가, 납기, 재고 여부)
- 제출한 견적 관리

### 시세 정보
- 품목별 평균 단가 표시
- 전주 대비 변동률
- 평균 납기 정보

## 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend/DB**: Firebase (Authentication, Firestore)
- **Deployment**: Vercel

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 설정

Firebase Console에서 프로젝트를 생성하고, 아래 환경변수를 `.env.local` 파일에 설정하세요:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Firestore 보안 규칙 설정

Firebase Console > Firestore > Rules에서 아래 규칙을 설정하세요:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }
    
    // Quote Requests collection
    match /quoteRequests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    // Quote Responses collection
    match /quoteResponses/{responseId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

### 4. Firestore 인덱스 설정

Firebase Console > Firestore > Indexes에서 아래 복합 인덱스를 추가하세요:

**quoteRequests 컬렉션:**
- `buyerId` (Ascending) + `createdAt` (Descending)
- `status` (Ascending) + `createdAt` (Descending)

**quoteResponses 컬렉션:**
- `requestId` (Ascending) + `createdAt` (Descending)
- `sellerId` (Ascending) + `createdAt` (Descending)

### 5. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인하세요.

## Vercel 배포

1. [Vercel](https://vercel.com)에 GitHub 저장소 연결
2. Environment Variables에 Firebase 설정 추가
3. Deploy!

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx           # 메인 페이지 (시세 대시보드)
│   ├── login/             # 로그인
│   ├── register/          # 회원가입
│   ├── requests/          # 견적 요청 목록
│   │   ├── new/           # 새 견적 요청
│   │   └── [id]/          # 견적 요청 상세
│   └── my-quotes/         # 제출한 견적 (판매자)
├── components/
│   ├── Header.tsx
│   └── Footer.tsx
├── contexts/
│   └── AuthContext.tsx    # 인증 컨텍스트
├── lib/
│   └── firebase.ts        # Firebase 설정
└── types/
    └── index.ts           # 타입 정의
```

## 라이선스

MIT
