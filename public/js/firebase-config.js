// Firebase 구성 및 초기화 - gen-project-10-2829a
const firebaseConfig = {
    apiKey: "AIzaSyDnlzjJ_Fcwh9xop9Tad4NeZwks3yuCkIo",
    authDomain: "gen-project-10-2829a.firebaseapp.com",
    projectId: "gen-project-10-2829a",
    storageBucket: "gen-project-10-2829a.firebasestorage.app",
    messagingSenderId: "552991453486",
    appId: "1:552991453486:web:94bc7e2e2a60695332cabf"
};

// 개발/테스트 모드 감지
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('192.168') ||
                     window.location.hostname.includes('127.0.0.1') ||
                     window.location.port;

console.log('🔥 Firebase 연결 모드:', isDevelopment ? '🛠️ 개발/테스트' : '🚀 프로덕션');
console.log('📍 현재 호스트:', window.location.hostname);

// Firebase 초기화
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    where,
    enableNetwork,
    disableNetwork
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize Firebase with detailed error handling
let app, db;
try {
    console.log('🔥 Firebase 초기화 시작...');
    console.log('📋 Firebase Config:', firebaseConfig);
    
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    
    console.log('✅ Firebase 앱 초기화 완료');
    console.log('📊 Firestore DB 객체:', db);
} catch (error) {
    console.error('❌ Firebase 초기화 실패:', error);
    console.error('오류 상세:', {
        code: error.code,
        message: error.message,
        stack: error.stack
    });
}

// Firebase 유틸리티 함수들
class FirebaseManager {
    constructor() {
        if (!db) {
            console.error('❌ Firestore DB가 초기화되지 않았습니다');
            throw new Error('Firebase 초기화 실패');
        }
        
        this.db = db;
        this.isOnline = navigator.onLine;
        this.connectionTested = false;
        
        console.log('🔧 FirebaseManager 생성 중...');
        this.setupNetworkListeners();
        this.testConnection();
    }
    
    // Firebase 연결 테스트
    async testConnection() {
        try {
            console.log('🔍 Firebase 연결 테스트 중...');
            
            // 간단한 쿼리로 연결 테스트
            const testCollection = collection(this.db, 'attendees');
            const testQuery = query(testCollection);
            await getDocs(testQuery);
            
            console.log('✅ Firebase 연결 테스트 성공');
            this.connectionTested = true;
            this.showStatus('Firebase 연결됨', 'success');
            return true;
        } catch (error) {
            console.error('❌ Firebase 연결 테스트 실패:', error);
            console.error('오류 세부사항:', {
                code: error.code,
                message: error.message,
                customData: error.customData
            });
            
            this.connectionTested = false;
            this.showStatus(`Firebase 오류: ${error.code}`, 'error');
            
            // 구체적인 오류 메시지 제공
            if (error.code === 'permission-denied') {
                console.error('🚫 Firestore 보안 규칙 문제: 읽기/쓰기 권한이 거부되었습니다');
            } else if (error.code === 'unavailable') {
                console.error('🌐 네트워크 연결 문제: Firestore 서비스에 접근할 수 없습니다');
            } else if (error.code === 'unauthenticated') {
                console.error('🔐 인증 문제: Firebase 프로젝트 설정을 확인하세요');
            }
            
            return false;
        }
    }

    // 네트워크 상태 모니터링
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            enableNetwork(this.db);
            this.showStatus('연결됨', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showStatus('오프라인', 'warning');
        });
    }

    // 상태 메시지 표시
    showStatus(message, type = 'info') {
        // 상태 표시 UI 구현 (나중에 각 페이지에서 구현)
        console.log(`Firebase Status: ${message} (${type})`);
    }

    // 참석자 추가
    async addAttendee(attendeeData) {
        try {
            const docRef = await addDoc(collection(this.db, 'attendees'), {
                ...attendeeData,
                timestamp: new Date(),
                checkedIn: true
            });
            this.showStatus('체크인 완료!', 'success');
            return docRef.id;
        } catch (error) {
            console.error('Error adding attendee:', error);
            this.showStatus('체크인 실패. 다시 시도해주세요.', 'error');
            throw error;
        }
    }

    // 참석자 목록 가져오기
    async getAttendees() {
        try {
            const q = query(collection(this.db, 'attendees'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            const attendees = [];
            querySnapshot.forEach((doc) => {
                attendees.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return attendees;
        } catch (error) {
            console.error('Error getting attendees:', error);
            throw error;
        }
    }

    // 실시간 참석자 목록 리스너
    onAttendeesUpdate(callback) {
        const q = query(collection(this.db, 'attendees'), orderBy('timestamp', 'desc'));
        return onSnapshot(q, (querySnapshot) => {
            const attendees = [];
            querySnapshot.forEach((doc) => {
                attendees.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(attendees);
        }, (error) => {
            console.error('Error in real-time listener:', error);
            this.showStatus('실시간 동기화 오류', 'error');
        });
    }

    // 참석자 정보 업데이트
    async updateAttendee(id, updates) {
        try {
            const attendeeRef = doc(this.db, 'attendees', id);
            await updateDoc(attendeeRef, {
                ...updates,
                lastUpdated: new Date()
            });
            this.showStatus('정보 업데이트 완료', 'success');
        } catch (error) {
            console.error('Error updating attendee:', error);
            this.showStatus('업데이트 실패', 'error');
            throw error;
        }
    }

    // 참석자 삭제
    async deleteAttendee(id) {
        try {
            await deleteDoc(doc(this.db, 'attendees', id));
            this.showStatus('참석자 삭제 완료', 'success');
        } catch (error) {
            console.error('Error deleting attendee:', error);
            this.showStatus('삭제 실패', 'error');
            throw error;
        }
    }

    // 중복 체크인 확인
    async checkDuplicate(name, phone) {
        try {
            const q = query(
                collection(this.db, 'attendees'), 
                where('name', '==', name),
                where('phone', '==', phone)
            );
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Error checking duplicate:', error);
            return false;
        }
    }

    // 통계 데이터 가져오기
    async getStats() {
        try {
            const attendees = await this.getAttendees();
            return {
                totalCount: attendees.length,
                todayCount: attendees.filter(a => {
                    const today = new Date().toDateString();
                    const attendeeDate = a.timestamp?.toDate?.()?.toDateString() || new Date(a.timestamp).toDateString();
                    return attendeeDate === today;
                }).length,
                companionCount: attendees.reduce((sum, a) => sum + (parseInt(a.companions) || 0), 0)
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return { totalCount: 0, todayCount: 0, companionCount: 0 };
        }
    }
}

// Firebase 매니저 인스턴스 생성 및 전역 설정
let firebaseManager;
try {
    firebaseManager = new FirebaseManager();
    window.firebaseManager = firebaseManager;
    console.log('✅ FirebaseManager 전역 설정 완료');
} catch (error) {
    console.error('❌ FirebaseManager 생성 실패:', error);
    firebaseManager = null;
}

// 백워드 호환성을 위한 localStorage 마이그레이션
class DataMigration {
    static async migrateFromLocalStorage() {
        const existingData = localStorage.getItem('attendees');
        const migrationFlag = localStorage.getItem('firebase_migrated');
        
        // 안전 체크: 이미 마이그레이션했거나 명시적으로 삭제된 경우 복구 안함
        if (migrationFlag === 'true') {
            console.log('🚫 마이그레이션 이미 완료됨 - 자동 복구 방지');
            return;
        }
        
        if (existingData && existingData !== '[]') {
            try {
                const attendees = JSON.parse(existingData);
                console.log('🔄 localStorage에서', attendees.length, '명 마이그레이션 시작');
                
                // 사용자 확인 (관리자 페이지에서만)
                if (window.location.pathname.includes('admin')) {
                    const confirm = window.confirm(`localStorage에 ${attendees.length}명의 데이터가 있습니다.\nFirebase로 마이그레이션하시겠습니까?`);
                    if (!confirm) {
                        localStorage.setItem('firebase_migrated', 'true');
                        return;
                    }
                }
                
                for (const attendee of attendees) {
                    await window.firebaseManager.addAttendee(attendee);
                }
                
                // 마이그레이션 완료 후 안전하게 정리
                localStorage.setItem('attendees_backup', existingData);
                localStorage.setItem('attendees', '[]');
                localStorage.setItem('firebase_migrated', 'true');
                
                if (window.location.pathname.includes('admin')) {
                    alert(`✅ ${attendees.length}명의 기존 데이터를 Firebase로 이전했습니다.`);
                }
            } catch (error) {
                console.error('❌ 마이그레이션 실패:', error);
            }
        }
    }
}

// 페이지 로드 시 마이그레이션 실행 (한 번만, 엄격한 안전 체크)
document.addEventListener('DOMContentLoaded', () => {
    const migrated = localStorage.getItem('firebase_migrated');
    const hasBackup = localStorage.getItem('attendees');
    const dataClearedAt = localStorage.getItem('data_cleared_at');
    
    // 엄격한 마이그레이션 체크
    if (migrated === 'true') {
        console.log('✅ 마이그레이션 완료됨 - 자동 복구 차단');
        return;
    }
    
    // 자동 복구 방지 플래그 체크
    const preventRestore = localStorage.getItem('prevent_auto_restore');
    if (preventRestore === 'true') {
        console.log('🚫 자동 복구 차단 플래그 활성화됨');
        localStorage.setItem('firebase_migrated', 'true');
        return;
    }
    
    if (dataClearedAt) {
        const clearedTime = new Date(dataClearedAt);
        const now = new Date();
        const timeDiff = (now - clearedTime) / 1000 / 60; // 분 단위
        
        if (timeDiff < 180) { // 3시간 내 삭제된 경우 (더 긴 시간으로 확장)
            console.log(`🚫 최근 ${Math.round(timeDiff)}분 전 데이터 삭제됨 - 자동 복구 차단`);
            localStorage.setItem('firebase_migrated', 'true');
            localStorage.setItem('prevent_auto_restore', 'true');
            return;
        }
    }
    
    // 마이그레이션 안전 체크: 명시적으로 삭제된 경우 복구하지 않음
    if (!migrated && hasBackup && hasBackup !== '[]') {
        console.log('🔄 localStorage에서 Firebase로 데이터 마이그레이션 시작');
        DataMigration.migrateFromLocalStorage().then(() => {
            localStorage.setItem('firebase_migrated', 'true');
        });
    }
});

// ES6 모듈 호환성을 위한 export (선택적)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseManager };
}

// 전역 접근을 위한 설정 완료 이벤트
document.addEventListener('DOMContentLoaded', () => {
    if (window.firebaseManager) {
        console.log('🎯 Firebase 설정 완료 - 사용 가능');
        window.dispatchEvent(new CustomEvent('firebaseReady', { 
            detail: { firebaseManager: window.firebaseManager } 
        }));
    }
});