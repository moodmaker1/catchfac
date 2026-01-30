import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  path.join(process.cwd(), "service-account-key.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Service account key file not found!");
  console.log("Please set GOOGLE_APPLICATION_CREDENTIALS or place service-account-key.json in the project root");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

console.log(`📋 Service Account Info:`);
console.log(`   Project ID: ${serviceAccount.project_id}`);
console.log(`   Client Email: ${serviceAccount.client_email}`);
console.log(`   Key File: ${serviceAccountPath}`);
console.log(`   Key File Exists: ${fs.existsSync(serviceAccountPath)}`);
console.log(`   Key File Size: ${fs.statSync(serviceAccountPath).size} bytes\n`);

if (!getApps().length) {
  try {
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
      // 명시적으로 데이터베이스 URL 지정 (필요한 경우)
    });
    console.log("✅ Firebase Admin initialized");
    console.log(`   App name: ${app.name}`);
    console.log(`   Project ID: ${app.options.projectId}\n`);
  } catch (error: any) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
    process.exit(1);
  }
}

// Firestore 데이터베이스 초기화
// 명시적으로 기본 데이터베이스 ID 지정
// 참고: 데이터베이스 위치는 자동으로 감지됩니다
import { Firestore } from "firebase-admin/firestore";

let db: Firestore;
try {
  // 먼저 기본 데이터베이스로 시도
  db = getFirestore(undefined, "(default)");
  console.log("✅ Firestore instance created (database: (default))\n");
} catch (error: any) {
  console.error("❌ Firestore instance creation failed:", error.message);
  // 데이터베이스 ID 없이 시도
  try {
    db = getFirestore();
    console.log("✅ Firestore instance created (default database)\n");
  } catch (error2: any) {
    console.error("❌ Firestore instance creation failed:", error2.message);
    process.exit(1);
  }
}

// 데이터베이스 연결 테스트
async function testConnection() {
  try {
    console.log("🔍 Testing Firestore connection...");
    console.log(`   Project ID: ${serviceAccount.project_id}`);
    console.log(`   Service Account: ${serviceAccount.client_email}`);
    
    // 먼저 기존 컬렉션 읽기 시도 (users 컬렉션이 이미 있다고 했으므로)
    console.log("   Attempting to read existing 'users' collection...");
    const usersSnapshot = await db.collection("users").limit(1).get();
    console.log(`   ✅ Successfully read users collection (${usersSnapshot.size} documents found)\n`);
    return true;
  } catch (error: any) {
    console.error("❌ Firestore connection failed:", error.message);
    console.error(`   Error code: ${error.code}`);
    console.error(`   Error details:`, JSON.stringify(error, null, 2));
    if (error.code === 5) {
      console.error("\n💡 Possible solutions:");
      console.error("   1. Google Cloud Console > IAM에서 서비스 계정 권한 확인:");
      console.error("      → https://console.cloud.google.com/iam-admin/iam?project=catchpac");
      console.error("      → 'Firebase Admin SDK 관리 서비스 계정' 또는 'Cloud Datastore User' 역할 필요");
      console.error("   2. 권한 추가 후 5-10분 기다린 후 다시 시도 (권한 전파 시간)");
      console.error("   3. Firebase Console에서 데이터베이스 위치 확인");
      console.error("      → https://console.firebase.google.com/project/catchpac/firestore");
    }
    return false;
  }
}

// 샘플 업체 데이터
const sampleSellers = [
  {
    email: "contact@seoulparts.co.kr",
    name: "김철수",
    company: "서울부품공급(주)",
    userType: "SELLER",
    phone: "02-1234-5678",
    description: "서울 지역 산업용 부품 전문 유통업체입니다. 서보모터, 실린더, 센서 등 다양한 부품을 취급하며 빠른 납기와 합리적인 가격을 제공합니다.",
    categories: ["서보모터", "실린더", "센서"] as const,
    region: "서울",
    isPremium: true,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "info@gyeonggi-automation.com",
    name: "이영희",
    company: "경기자동화부품(주)",
    userType: "SELLER",
    phone: "031-2345-6789",
    description: "경기 지역 자동화 부품 전문 유통사입니다. PLC, 인버터, 모터 등 자동화 시스템에 필요한 모든 부품을 공급합니다.",
    categories: ["PLC", "인버터", "AC/DC 모터"] as const,
    region: "경기",
    isPremium: true,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "sales@incheon-industrial.com",
    name: "박민수",
    company: "인천산업부품(주)",
    userType: "SELLER",
    phone: "032-3456-7890",
    description: "인천 지역 산업용 부품 전문 유통업체입니다. 베어링, LM가이드, 기타 부품을 취급하며 전국 배송이 가능합니다.",
    categories: ["베어링", "LM 가이드", "기타"] as const,
    region: "인천",
    isPremium: false,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "contact@busan-machinery.co.kr",
    name: "최지영",
    company: "부산기계부품(주)",
    userType: "SELLER",
    phone: "051-4567-8901",
    description: "부산 지역 기계 부품 전문 유통사입니다. 서보모터, 실린더, 센서 등 다양한 부품을 취급합니다.",
    categories: ["서보모터", "실린더", "센서"] as const,
    region: "부산",
    isPremium: false,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "info@daegu-parts.com",
    name: "정대현",
    company: "대구부품공급(주)",
    userType: "SELLER",
    phone: "053-5678-9012",
    description: "대구 지역 산업용 부품 전문 유통업체입니다. PLC, 인버터, 모터 등 자동화 부품을 전문으로 취급합니다.",
    categories: ["PLC", "인버터", "AC/DC 모터"] as const,
    region: "대구",
    isPremium: false,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "sales@daejeon-automation.co.kr",
    name: "강수진",
    company: "대전자동화부품(주)",
    userType: "SELLER",
    phone: "042-6789-0123",
    description: "대전 지역 자동화 부품 전문 유통사입니다. 베어링, LM가이드, 센서 등 정밀 부품을 취급합니다.",
    categories: ["베어링", "LM 가이드", "센서"] as const,
    region: "대전",
    isPremium: false,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "contact@gwangju-industrial.com",
    name: "윤태호",
    company: "광주산업부품(주)",
    userType: "SELLER",
    phone: "062-7890-1234",
    description: "광주 지역 산업용 부품 전문 유통업체입니다. 서보모터, 실린더, 기타 부품을 취급하며 빠른 납기를 자랑합니다.",
    categories: ["서보모터", "실린더", "기타"],
    region: "광주",
    isPremium: false,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "info@ulsan-parts.co.kr",
    name: "임동욱",
    company: "울산부품공급(주)",
    userType: "SELLER",
    phone: "052-8901-2345",
    description: "울산 지역 부품 전문 유통사입니다. PLC, 인버터, 모터 등 자동화 시스템 부품을 전문으로 취급합니다.",
    categories: ["PLC", "인버터", "AC/DC 모터"] as const,
    region: "울산",
    isPremium: false,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "sales@sejong-automation.com",
    name: "한미라",
    company: "세종자동화부품(주)",
    userType: "SELLER",
    phone: "044-9012-3456",
    description: "세종 지역 자동화 부품 전문 유통업체입니다. 베어링, LM가이드, 센서 등 정밀 부품을 취급합니다.",
    categories: ["베어링", "LM 가이드", "센서"] as const,
    region: "세종",
    isPremium: false,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "contact@gangwon-industrial.co.kr",
    name: "송재현",
    company: "강원산업부품(주)",
    userType: "SELLER",
    phone: "033-0123-4567",
    description: "강원 지역 산업용 부품 전문 유통사입니다. 서보모터, 실린더, 기타 부품을 취급하며 전국 배송이 가능합니다.",
    categories: ["서보모터", "실린더", "기타"],
    region: "강원",
    isPremium: false,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "info@chungbuk-parts.com",
    name: "오세영",
    company: "충북부품공급(주)",
    userType: "SELLER",
    phone: "043-1234-5678",
    description: "충북 지역 부품 전문 유통업체입니다. PLC, 인버터, 모터 등 자동화 부품을 전문으로 취급합니다.",
    categories: ["PLC", "인버터", "AC/DC 모터"] as const,
    region: "충북",
    isPremium: false,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "sales@chungnam-automation.co.kr",
    name: "류지혜",
    company: "충남자동화부품(주)",
    userType: "SELLER",
    phone: "041-2345-6789",
    description: "충남 지역 자동화 부품 전문 유통사입니다. 베어링, LM가이드, 센서 등 정밀 부품을 취급합니다.",
    categories: ["베어링", "LM 가이드", "센서"] as const,
    region: "충남",
    isPremium: false,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "contact@jeonbuk-industrial.com",
    name: "배성민",
    company: "전북산업부품(주)",
    userType: "SELLER",
    phone: "063-3456-7890",
    description: "전북 지역 산업용 부품 전문 유통업체입니다. 서보모터, 실린더, 기타 부품을 취급하며 빠른 납기를 제공합니다.",
    categories: ["서보모터", "실린더", "기타"],
    region: "전북",
    isPremium: false,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "info@jeonnam-parts.co.kr",
    name: "신동욱",
    company: "전남부품공급(주)",
    userType: "SELLER",
    phone: "061-4567-8901",
    description: "전남 지역 부품 전문 유통사입니다. PLC, 인버터, 모터 등 자동화 시스템 부품을 전문으로 취급합니다.",
    categories: ["PLC", "인버터", "AC/DC 모터"] as const,
    region: "전남",
    isPremium: false,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "sales@gyeongbuk-automation.com",
    name: "조은지",
    company: "경북자동화부품(주)",
    userType: "SELLER",
    phone: "054-5678-9012",
    description: "경북 지역 자동화 부품 전문 유통업체입니다. 베어링, LM가이드, 센서 등 정밀 부품을 취급합니다.",
    categories: ["베어링", "LM 가이드", "센서"] as const,
    region: "경북",
    isPremium: false,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "contact@gyeongnam-industrial.co.kr",
    name: "허준호",
    company: "경남산업부품(주)",
    userType: "SELLER",
    phone: "055-6789-0123",
    description: "경남 지역 산업용 부품 전문 유통사입니다. 서보모터, 실린더, 기타 부품을 취급하며 전국 배송이 가능합니다.",
    categories: ["서보모터", "실린더", "기타"],
    region: "경남",
    isPremium: false,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "info@jeju-parts.com",
    name: "고민수",
    company: "제주부품공급(주)",
    userType: "SELLER",
    phone: "064-7890-1234",
    description: "제주 지역 부품 전문 유통업체입니다. PLC, 인버터, 모터 등 자동화 부품을 전문으로 취급합니다.",
    categories: ["PLC", "인버터", "AC/DC 모터"] as const,
    region: "제주",
    isPremium: false,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "sales@national-automation.co.kr",
    name: "문혜진",
    company: "전국자동화부품(주)",
    userType: "SELLER",
    phone: "02-8901-2345",
    description: "전국 배송이 가능한 자동화 부품 전문 유통사입니다. 베어링, LM가이드, 센서 등 모든 자동화 부품을 취급합니다.",
    categories: ["베어링", "LM 가이드", "센서"] as const,
    region: "서울",
    isPremium: true,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "contact@premium-parts.com",
    name: "양성호",
    company: "프리미엄부품공급(주)",
    userType: "SELLER",
    phone: "02-9012-3456",
    description: "프리미엄 품질의 산업용 부품을 전문으로 취급하는 유통업체입니다. 서보모터, 실린더, 센서 등 고품질 부품을 제공합니다.",
    categories: ["서보모터", "실린더", "센서"] as const,
    region: "서울",
    isPremium: true,
    createdAt: new Date(),
    profileComplete: true,
  },
  {
    email: "info@tech-automation.co.kr",
    name: "구미영",
    company: "테크자동화부품(주)",
    userType: "SELLER",
    phone: "031-0123-4567",
    description: "최신 기술의 자동화 부품을 전문으로 취급하는 유통사입니다. PLC, 인버터, 모터 등 첨단 자동화 시스템 부품을 제공합니다.",
    categories: ["PLC", "인버터", "AC/DC 모터"] as const,
    region: "경기",
    isPremium: true,
    createdAt: new Date(),
    profileComplete: true,
  },
];

async function createSampleSellers() {
  console.log("🚀 Starting to create sample sellers...\n");

  // 연결 테스트는 건너뛰고 직접 데이터 생성 시도
  console.log("⚠️  Skipping connection test, attempting direct write...\n");

  try {
    // 먼저 하나의 문서만 시도해서 연결 확인
    const testSeller = sampleSellers[0];
    const testUserId = testSeller.email.replace(/[@.]/g, "_");
    
    console.log(`📝 Testing with first seller: ${testSeller.company}`);
    await db.collection("users").doc(testUserId).set(testSeller);
    console.log(`✅ Test write successful! Proceeding with all sellers...\n`);
    
    // 나머지 업체들 생성
    for (let i = 1; i < sampleSellers.length; i++) {
      const seller = sampleSellers[i];
      
      // 고유 ID 생성 (이메일 기반)
      const userId = seller.email.replace(/[@.]/g, "_");
      
      console.log(`📝 Creating seller ${i + 1}/${sampleSellers.length}: ${seller.company}`);
      
      // Firestore에 사용자 생성
      await db.collection("users").doc(userId).set(seller);
      
      console.log(`✅ Created: ${seller.company} (${seller.region})`);
      
      // API rate limit 방지
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`\n✨ Successfully created ${sampleSellers.length} sample sellers!`);
    console.log("\n📋 Summary:");
    const premiumCount = sampleSellers.filter(s => s.isPremium).length;
    const freeCount = sampleSellers.length - premiumCount;
    console.log(`   - Premium sellers: ${premiumCount}`);
    console.log(`   - Free sellers: ${freeCount}`);
    console.log(`   - Total: ${sampleSellers.length}`);
  } catch (error: any) {
    console.error("❌ Error creating sample sellers:", error);
    console.error(`   Error code: ${error.code}`);
    console.error(`   Error message: ${error.message}`);
    
    if (error.code === 5) {
      console.error("\n🔍 NOT_FOUND 에러 해결 방법:");
      console.error("   1. Google Cloud Console에서 Firestore 데이터베이스 위치 확인:");
      console.error("      → https://console.firebase.google.com/project/catchpac/firestore");
      console.error("   2. Cloud Firestore Admin API 활성화 확인:");
      console.error("      → https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=catchpac");
      console.error("   3. 서비스 계정이 올바른 프로젝트에 속해 있는지 확인:");
      console.error("      → https://console.cloud.google.com/iam-admin/iam?project=catchpac");
      console.error("   4. 데이터베이스가 Native 모드로 생성되었는지 확인");
      console.error("\n💡 대안: Firebase Console에서 수동으로 데이터 추가");
      console.error("   → https://console.firebase.google.com/project/catchpac/firestore/data");
    }
    
    process.exit(1);
  }
}

createSampleSellers().then(() => {
  console.log("\n✅ Done!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
