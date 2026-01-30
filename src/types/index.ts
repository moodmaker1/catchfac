export type UserType = "BUYER" | "SELLER";

export interface User {
  id: string;
  email: string;
  name: string;
  company: string;
  userType: UserType;
  createdAt: Date;
  // 판매자 전용 필드
  phone?: string;
  description?: string;
  categories?: string[];
  region?: string;
  isPremium?: boolean;
  premiumUntil?: Date;
  profileComplete?: boolean;
  // 관리자 필드
  isAdmin?: boolean;
}

export type RequestStatus = "OPEN" | "CLOSED";

export interface QuoteRequest {
  id: string;
  buyerId: string;
  buyerCompany: string;
  category: string;
  maker: string;
  partNumber: string;
  quantity: number;
  desiredDelivery: string;
  note: string;
  status: RequestStatus;
  createdAt: Date;
  isAnonymous?: boolean; // 익명 요청 여부
}

export interface QuoteResponse {
  id: string;
  requestId: string;
  sellerId: string;
  sellerCompany: string;
  unitPrice: number;
  totalPrice: number;
  deliveryDays: number;
  inStock: boolean;
  note: string;
  isSelected: boolean;
  createdAt: Date;
}

export interface PriceData {
  category: string;
  avgPrice: number;
  changePercent: number;
  avgDeliveryDays: number;
  sampleCount: number;
}

// 대분류 카테고리
export const MAIN_CATEGORIES = [
  "모터/구동부품",
  "자동화 부품",
  "전기/전자 부품",
  "기계 부품",
  "제어/계측",
  "유압/공압",
  "냉각/환기",
  "케이블/연결",
  "기타",
] as const;

// 중분류 카테고리 (대분류별)
export const SUB_CATEGORIES: Record<string, readonly string[]> = {
  "모터/구동부품": [
    "서보모터",
    "스텝모터",
    "AC/DC 모터",
    "리니어 모터",
    "감속기",
    "브레이크",
    "커플링",
  ],
  "자동화 부품": [
    "실린더",
    "LM 가이드",
    "리니어 액추에이터",
    "볼 스크류",
    "리드 스크류",
    "슬라이드 유닛",
    "로봇 부품",
  ],
  "전기/전자 부품": [
    "PLC",
    "HMI",
    "터치스크린",
    "인버터",
    "서보 드라이브",
    "전원공급장치",
    "릴레이/컨택터",
    "스위치/버튼",
    "퓨즈/차단기",
    "트랜스포머",
  ],
  "기계 부품": [
    "베어링",
    "기어",
    "체인/스프로킷",
    "벨트/풀리",
    "볼트/너트",
    "와셔",
    "핀",
    "스프링",
    "시트",
    "부싱",
  ],
  "제어/계측": [
    "센서",
    "인코더",
    "리미트 스위치",
    "프로세스 센서",
    "온도 센서",
    "압력 센서",
    "위치 센서",
    "속도 센서",
  ],
  "유압/공압": [
    "프로세스 밸브",
    "필터",
    "레귤레이터",
    "실린더 (유압/공압)",
    "펌프",
    "호스/피팅",
  ],
  "냉각/환기": [
    "히트싱크",
    "팬/블로워",
    "냉각기",
    "냉각팬",
    "방열판",
  ],
  "케이블/연결": [
    "케이블/커넥터",
    "배선 부품",
    "터미널",
    "캐리어",
  ],
  "기타": [
    "기타",
  ],
} as const;

// 모든 중분류를 평탄화한 배열 (하위 호환성용)
export const CATEGORIES = Object.values(SUB_CATEGORIES).flat() as readonly string[];

export const MAKERS = [
  "미쓰비시",
  "파나소닉",
  "야스카와",
  "오므론",
  "키엔스",
  "SMC",
  "THK",
  "NSK",
  "시멘스",
  "LS산전",
  "기타",
] as const;

export const REGIONS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
  "전국",
] as const;
