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

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    console.log("✅ Firebase Admin initialized");
  } catch (error: any) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
    process.exit(1);
  }
}

const db = getFirestore();

async function setAdmin(userEmail: string) {
  try {
    console.log(`\n🔍 사용자 검색 중: ${userEmail}`);
    
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", userEmail).get();
    
    if (snapshot.empty) {
      console.error(`\n❌ 사용자를 찾을 수 없습니다: ${userEmail}`);
      console.log("\n💡 해결 방법:");
      console.log("   1. 이메일 주소가 정확한지 확인해주세요");
      console.log("   2. 해당 이메일로 회원가입이 되어 있는지 확인해주세요");
      console.log("   3. Firebase Console에서 직접 설정:");
      console.log("      - Firestore Database → users 컬렉션");
      console.log("      - 해당 사용자 문서 찾기");
      console.log("      - isAdmin: true 필드 추가");
      return;
    }

    console.log(`✅ 사용자를 찾았습니다. (${snapshot.size}개 문서)`);
    
    for (const doc of snapshot.docs) {
      await doc.ref.update({ isAdmin: true });
      const userData = doc.data();
      console.log(`\n✅ ${userEmail}을(를) 관리자로 설정했습니다.`);
      console.log(`   문서 ID: ${doc.id}`);
      console.log(`   이름: ${userData.name || "없음"}`);
      console.log(`   회사: ${userData.company || "없음"}`);
      console.log(`   유형: ${userData.userType || "없음"}`);
    }
  } catch (error: any) {
    console.error("\n❌ 오류 발생:", error.message);
    console.error(`   오류 코드: ${error.code || "알 수 없음"}`);
    if (error.code === "NOT_FOUND") {
      console.error("\n💡 NOT_FOUND 오류 해결 방법:");
      console.error("   1. Firestore 데이터베이스가 생성되어 있는지 확인");
      console.error("   2. users 컬렉션이 존재하는지 확인");
      console.error("   3. Firebase Console에서 직접 설정하는 것을 권장합니다");
    }
    process.exit(1);
  }
}

// 사용법: npm run set-admin -- your-email@example.com
const email = process.argv[2];
if (!email) {
  console.error("❌ 이메일을 입력해주세요");
  console.log("\n사용법:");
  console.log("  npm run set-admin -- your-email@example.com");
  console.log("\n또는:");
  console.log("  npx tsx scripts/set-admin.ts your-email@example.com");
  process.exit(1);
}

setAdmin(email).then(() => {
  console.log("\n✅ 완료!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ 치명적 오류:", error);
  process.exit(1);
});
