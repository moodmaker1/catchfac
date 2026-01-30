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

export const CATEGORIES = [
  "서보모터",
  "실린더",
  "AC/DC 모터",
  "베어링",
  "LM 가이드",
  "센서",
  "PLC",
  "인버터",
  "기타",
] as const;

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
