// 전역 변수
let selectedFile = null;
let disclosureTypes = null;
let analysisInfo = null; // 분석 정보 저장
let analysisHistory = []; // 분석 기록 저장
let currentAnalysisId = null; // 현재 선택된 분석 ID
// Clerk 인스턴스는 window.clerk로 접근

// DOM 요소들
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadDefault = document.getElementById('uploadDefault');
const uploadInfo = document.getElementById('uploadInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const disclosureSection = document.getElementById('disclosureSection');
const disclosureTypeSelect = document.getElementById('disclosureType');
const specificTypeSelect = document.getElementById('specificType');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultSection = document.getElementById('resultSection');
const resultContent = document.getElementById('resultContent');
const loadingSection = document.getElementById('loadingSection');

// 파일 정보 DOM 요소들
const analysisFileName = document.getElementById('analysisFileName');
const analysisDate = document.getElementById('analysisDate');
const analysisTime = document.getElementById('analysisTime');
const analysisType = document.getElementById('analysisType');

// 초기화
document.addEventListener('DOMContentLoaded', async function() {
    // 기본 로그인 버튼을 즉시 표시
    showDefaultLoginButton();
    
    // Clerk 초기화는 백그라운드에서 진행
    initializeClerkInBackground();
    
    // 초기 인증 상태 확인 및 UI 업데이트
    checkAuthAndUpdateUI();
    
    loadDisclosureTypes();
    setupEventListeners();
    
    // 분석 기록 로드는 인증 상태 확인 후에만 실행
    // loadAnalysisHistory()는 checkAuthAndUpdateUI()에서 처리됨
});

// 인증 상태 확인 및 UI 업데이트
function checkAuthAndUpdateUI() {
    if (window.clerk && window.clerk.isSignedIn) {
        // 로그인된 사용자 - 서비스 화면 표시
        showServiceContent();
        // 로그인된 사용자의 분석 기록 로드
        loadAnalysisHistory();
    } else {
        // 로그인되지 않은 사용자 - 메인 콘텐츠는 표시하되 로그인 요청 화면은 숨김
        showMainContentWithoutLoginScreen();
        // 로그인되지 않은 사용자는 분석 기록 초기화
        analysisHistory = [];
        renderAnalysisHistory();
    }
}

// 서비스 콘텐츠 표시
function showServiceContent() {
    // 메인 콘텐츠 표시
    document.querySelector('.main-content').style.display = 'block';
    // 로그인 요청 화면 숨기기
    const loginRequiredScreen = document.getElementById('loginRequiredScreen');
    if (loginRequiredScreen) {
        loginRequiredScreen.style.display = 'none';
    }
}

// 로그인하지 않은 사용자를 위한 메인 콘텐츠 표시
function showMainContentWithoutLoginScreen() {
    // 메인 콘텐츠 표시
    document.querySelector('.main-content').style.display = 'block';
    // 로그인 요청 화면 숨기기
    const loginRequiredScreen = document.getElementById('loginRequiredScreen');
    if (loginRequiredScreen) {
        loginRequiredScreen.style.display = 'none';
    }
}

// 로그인 요청 화면 표시 (파일 선택 시 호출)
function showLoginRequiredScreen() {
    // 로그인 요청 화면 생성 또는 표시
    let loginRequiredScreen = document.getElementById('loginRequiredScreen');
    if (!loginRequiredScreen) {
        loginRequiredScreen = createLoginRequiredScreen();
        document.body.appendChild(loginRequiredScreen);
    }
    loginRequiredScreen.style.display = 'flex';
    
    // ESC 키 이벤트 리스너 추가
    const handleEscKey = (e) => {
        if (e.key === 'Escape') {
            goBackToMain();
            document.removeEventListener('keydown', handleEscKey);
        }
    };
    document.addEventListener('keydown', handleEscKey);
}

// 메인 화면으로 돌아가기
function goBackToMain() {
    const loginRequiredScreen = document.getElementById('loginRequiredScreen');
    if (loginRequiredScreen) {
        loginRequiredScreen.style.display = 'none';
    }
}

// 로그인 요청 화면 생성
function createLoginRequiredScreen() {
    const screen = document.createElement('div');
    screen.id = 'loginRequiredScreen';
    screen.className = 'login-required-screen';
    screen.innerHTML = `
        <div class="login-required-container">
            <div class="login-required-card">
                <div class="login-required-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h2 class="login-required-title">로그인이 필요합니다</h2>
                <p class="login-required-description">
                    Dartify 서비스를 이용하려면 로그인이 필요합니다.<br>
                    로그인 후 공시 분석 서비스를 이용해보세요.
                </p>
                <div class="login-required-buttons">
                    <button class="login-required-btn primary" onclick="showClerkSignIn()">
                        <i class="fas fa-sign-in-alt"></i>
                        로그인하기
                    </button>
                    <button class="login-required-btn secondary" onclick="goBackToMain()">
                        <i class="fas fa-arrow-left"></i>
                        돌아가기
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 모달 외부 클릭 시 닫기
    screen.addEventListener('click', (e) => {
        if (e.target === screen) {
            goBackToMain();
        }
    });
    
    return screen;
}

// Clerk 로그인 화면 표시
function showClerkSignIn() {
    const loginRequiredScreen = document.getElementById('loginRequiredScreen');
    if (loginRequiredScreen) {
        loginRequiredScreen.innerHTML = `
            <div class="login-required-container">
                <div class="login-required-card">
                    <div class="login-required-header">
                        <button class="back-btn" onclick="showLoginRequired()">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                    </div>
                    <div id="clerk-signin-container"></div>
                </div>
            </div>
        `;
        
        // Clerk SignIn 컴포넌트 마운트
        if (window.clerk) {
            const signInContainer = document.getElementById('clerk-signin-container');
            if (signInContainer) {
                window.clerk.mountSignIn(signInContainer);
            }
        } else {
            // Clerk가 아직 로드되지 않은 경우
            const signInContainer = document.getElementById('clerk-signin-container');
            if (signInContainer) {
                signInContainer.innerHTML = `
                    <div class="loading-clerk">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>로그인 서비스를 불러오는 중...</p>
                    </div>
                `;
            }
        }
    }
}

// 로그인 요청 화면으로 돌아가기
function showLoginRequired() {
    const loginRequiredScreen = document.getElementById('loginRequiredScreen');
    if (loginRequiredScreen) {
        loginRequiredScreen.innerHTML = `
            <div class="login-required-container">
                <div class="login-required-card">
                    <div class="login-required-icon">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h2 class="login-required-title">로그인이 필요합니다</h2>
                    <p class="login-required-description">
                        Dartify 서비스를 이용하려면 로그인이 필요합니다.<br>
                        로그인 후 공시 분석 서비스를 이용해보세요.
                    </p>
                    <div class="login-required-buttons">
                        <button class="login-required-btn primary" onclick="showClerkSignIn()">
                            <i class="fas fa-sign-in-alt"></i>
                            로그인하기
                        </button>
                        <button class="login-required-btn secondary" onclick="goBackToMain()">
                            <i class="fas fa-arrow-left"></i>
                            돌아가기
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // 모달 외부 클릭 시 닫기 이벤트 다시 추가
        loginRequiredScreen.addEventListener('click', (e) => {
            if (e.target === loginRequiredScreen) {
                goBackToMain();
            }
        });
    }
}

// 기본 로그인 버튼 즉시 표시
function showDefaultLoginButton() {
    document.getElementById('clerk-auth-container').innerHTML = `
        <button id="sign-in" class="nav-login-btn" onclick="openSignInModal()">
            <i class="fas fa-sign-in-alt"></i>
            로그인
        </button>
    `;
}

// Clerk 초기화를 백그라운드에서 진행
async function initializeClerkInBackground() {
    try {
        // Clerk 스크립트가 로드될 때까지 대기
        await waitForClerk();
        await initializeClerk();
    } catch (error) {
        console.error('Clerk 백그라운드 초기화 실패:', error);
        // 오류가 발생해도 기본 버튼은 계속 표시됨
    }
}

// Clerk 스크립트 로드 대기 함수
function waitForClerk() {
    return new Promise((resolve) => {
        const checkClerk = () => {
            if (typeof Clerk !== 'undefined' && window.clerkLoaded) {
                console.log('Clerk 스크립트 로드 확인됨');
                resolve();
            } else {
                console.log('Clerk 스크립트 로드 대기 중...');
                setTimeout(checkClerk, 100);
            }
        };
        checkClerk();
    });
}

// Clerk 컴포넌트들이 준비될 때까지 대기하는 함수
function waitForClerkComponents(clerk) {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 최대 10초 대기 (50 * 200ms)
        
        const checkComponents = () => {
            attempts++;
            try {
                // Clerk 컴포넌트들이 준비되었는지 확인
                if (clerk && typeof clerk.mountSignIn === 'function') {
                    // 추가로 내부 상태 확인
                    if (clerk.isReady !== false) {
                        console.log('Clerk 컴포넌트들이 준비됨 (시도 횟수:', attempts, ')');
                        resolve();
                        return;
                    }
                }
                
                if (attempts >= maxAttempts) {
                    console.log('Clerk 컴포넌트 대기 시간 초과, 강제 진행');
                    resolve();
                    return;
                }
                
                console.log('Clerk 컴포넌트들이 아직 준비되지 않음, 대기 중... (시도 횟수:', attempts, ')');
                setTimeout(checkComponents, 200);
            } catch (error) {
                console.log('Clerk 컴포넌트 확인 중 오류, 재시도... (시도 횟수:', attempts, ')');
                if (attempts >= maxAttempts) {
                    console.log('최대 시도 횟수 도달, 강제 진행');
                    resolve();
                    return;
                }
                setTimeout(checkComponents, 200);
            }
        };
        checkComponents();
    });
}

// Clerk 초기화 (이미지의 main.js 방식과 정확히 동일)
async function initializeClerk() {
    try {
        console.log('Clerk 초기화 시작...');
        
        // Clerk가 로드되었는지 확인
        if (typeof Clerk === 'undefined') {
            throw new Error('Clerk가 로드되지 않았습니다. 스크립트 로딩을 확인해주세요.');
        }
        
        console.log('Clerk 객체 확인됨:', typeof Clerk);
        
        // Clerk가 이미 자동으로 초기화되었으므로 기존 인스턴스 사용
        const clerk = window.Clerk;
        
        if (!clerk) {
            throw new Error('Clerk 인스턴스를 찾을 수 없습니다.');
        }
        
        console.log('Clerk 인스턴스 확인됨:', clerk);
        
        // 전역 변수에 저장
        window.clerk = clerk;
        
        // Clerk가 완전히 로드될 때까지 기다림
        await clerk.load();
        console.log('Clerk 로드 완료');
        
        // 추가 대기 시간 (컴포넌트들이 준비되기 위해)
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('컴포넌트 준비 대기 완료');
        
        // 인증 상태에 따른 UI 업데이트
        if (clerk.isSignedIn) {
            console.log('사용자가 로그인되어 있음 - UserButton 표시');
            document.getElementById('clerk-auth-container').innerHTML = `
                <div id="user-button"></div>
            `;
            
            // UserButton 마운트
            const userButtonDiv = document.getElementById('user-button');
            if (userButtonDiv) {
                clerk.mountUserButton(userButtonDiv);
            }
        } else {
            console.log('사용자가 로그인되지 않음 - 기존 로그인 버튼 유지');
            // 이미 표시된 로그인 버튼을 그대로 유지
        }
        
        // Clerk 초기화 완료 후 인증 상태 확인 및 UI 업데이트
        checkAuthAndUpdateUI();
        
        // 인증 상태 변경 리스너 추가
        clerk.addListener(({ user }) => {
            console.log('인증 상태 변경:', user ? '로그인' : '로그아웃');
            updateAuthUI();
            // 인증 상태 변경 시 UI 업데이트
            checkAuthAndUpdateUI();
            
            // 로그인 성공 시 모달 닫기 (안전하게)
            if (user) {
                setTimeout(() => {
                    goBackToMain();
                }, 500); // 0.5초 후 모달 닫기
                // 로그인 시 분석 기록 로드
                loadAnalysisHistory();
            } else {
                // 로그아웃 시 분석 기록 초기화
                analysisHistory = [];
                renderAnalysisHistory();
                // 결과 섹션도 숨기기
                resultSection.style.display = 'none';
                currentAnalysisId = null;
            }
        });
        
        console.log('Clerk가 성공적으로 초기화되었습니다.');
    } catch (error) {
        console.error('Clerk 초기화 실패:', error);
        // 오류 발생 시에도 기존 로그인 버튼은 유지됨
    }
}

// Clerk Publishable Key 로드 함수 (이미지의 Vite 방식과 동일)
// Vite에서는: const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
// 현재 프로젝트에서는 서버 API를 통해 동일한 효과 구현
async function loadClerkPublishableKey() {
    try {
        // 서버에서 환경 변수 가져오기 (Vite의 import.meta.env와 동일한 효과)
        const response = await fetch('/api/config/clerk-key');
        if (response.ok) {
            const data = await response.json();
            return data.clerkPublishableKey;
        }
    } catch (error) {
        console.error('환경 변수 로드 실패:', error);
    }
    
    // 폴백: 이미지에서 제공한 키 (개발용)
    return 'pk_test_dG91Z2gtb3N0cmljaC02Ni5jbGVyay5hY2NvdW50cy5kZXYk';
}

// 인증 UI 업데이트 (이미지의 main.js 방식과 동일)
function updateAuthUI() {
    if (!window.clerk) {
        console.log('Clerk가 초기화되지 않음 - 기본 로그인 버튼 유지');
        return;
    }
    
    if (window.clerk.isSignedIn) {
        // 로그인된 상태 - UserButton 표시
        document.getElementById('clerk-auth-container').innerHTML = `
            <div id="user-button"></div>
        `;
        
        const userButtonDiv = document.getElementById('user-button');
        if (userButtonDiv) {
            window.clerk.mountUserButton(userButtonDiv);
        }
        
        // 서비스 콘텐츠 표시
        showServiceContent();
    } else {
        // 로그인되지 않은 상태 - SignIn 버튼 표시
        document.getElementById('clerk-auth-container').innerHTML = `
            <button id="sign-in" class="nav-login-btn" onclick="openSignInModal()">
                <i class="fas fa-sign-in-alt"></i>
                로그인
            </button>
        `;
        
        // 메인 콘텐츠는 표시하되 로그인 요청 화면은 숨김
        showMainContentWithoutLoginScreen();
    }
}

// 로그인 모달 열기 함수
function openSignInModal() {
    if (window.clerk) {
        window.clerk.openSignIn();
    } else {
        showNotification('로그인 서비스에 연결할 수 없습니다.', 'error');
    }
}

// 로그인 오류 표시 함수
function showLoginError() {
    showNotification('로그인 서비스 초기화에 실패했습니다. 페이지를 새로고침해주세요.', 'error');
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 파일 선택 이벤트
    fileInput.addEventListener('change', handleFileSelect);
    
    // 드래그 앤 드롭 이벤트
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // 업로드 영역 클릭 이벤트 (파일 선택 버튼 제외)
    uploadArea.addEventListener('click', (e) => {
        // 파일 선택 버튼이 클릭된 경우가 아닐 때만 파일 선택 다이얼로그 열기
        if (!e.target.closest('.upload-btn')) {
            // Clerk 초기화 완료 대기
            if (!window.clerk) {
                return;
            }
            
            // 인증 체크
            if (!window.clerk.isSignedIn) {
                showLoginRequiredScreen();
                return;
            }
            fileInput.click();
        }
    });
    
    // 공시 유형 변경 이벤트
    disclosureTypeSelect.addEventListener('change', updateSpecificTypes);
    specificTypeSelect.addEventListener('change', updateAnalyzeButton);
}

// 공시 유형 로드
async function loadDisclosureTypes() {
    try {
        const response = await fetch('/api/analysis/disclosure-types');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            disclosureTypes = data.types;
            populateDisclosureTypes();
        } else {
            throw new Error(data.error || '공시 유형을 불러올 수 없습니다.');
        }
    } catch (error) {
        console.error('공시 유형 로드 실패:', error);
        showNotification('공시 유형을 불러올 수 없습니다. 페이지를 새로고침해주세요.', 'error');
    }
}

// 공시 유형 드롭다운 채우기
function populateDisclosureTypes() {
    disclosureTypeSelect.innerHTML = '<option value="">유형을 선택하세요</option>';
    
    Object.keys(disclosureTypes).forEach(key => {
        const type = disclosureTypes[key];
        const option = document.createElement('option');
        option.value = key;
        option.textContent = type.name;
        disclosureTypeSelect.appendChild(option);
    });
}

// 세부 유형 업데이트
function updateSpecificTypes() {
    const selectedType = disclosureTypeSelect.value;
    specificTypeSelect.innerHTML = '<option value="">세부 유형을 선택하세요</option>';
    
    if (selectedType && disclosureTypes[selectedType]) {
        Object.keys(disclosureTypes[selectedType].types).forEach(key => {
            const specificType = disclosureTypes[selectedType].types[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = specificType.name;
            specificTypeSelect.appendChild(option);
        });
    }
    
    updateAnalyzeButton();
}

// 분석 버튼 상태 업데이트
function updateAnalyzeButton() {
    const hasFile = selectedFile !== null;
    const hasDisclosureType = disclosureTypeSelect.value !== '';
    const hasSpecificType = specificTypeSelect.value !== '';
    
    analyzeBtn.disabled = !(hasFile && hasDisclosureType && hasSpecificType);
}

// 파일 선택 처리
function handleFileSelect(event) {
    console.log('파일 선택 이벤트 발생');
    const file = event.target.files[0];
    if (file) {
        console.log('선택된 파일:', file.name, file.size, file.type);
        handleFile(file);
        // 파일 선택 후 input 초기화 (같은 파일을 다시 선택할 수 있도록)
        event.target.value = '';
    } else {
        console.log('파일이 선택되지 않았습니다.');
    }
}

// 드래그 오버 처리
function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

// 드래그 리브 처리
function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

// 드롭 처리
function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    // Clerk 초기화 완료 대기
    if (!window.clerk) {
        return;
    }
    
    // 인증 체크
    if (!window.clerk.isSignedIn) {
        showLoginRequiredScreen();
        return;
    }
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// 파일 처리
function handleFile(file) {
    // 인증 체크
    if (!window.clerk || !window.clerk.isSignedIn) {
        showNotification('로그인이 필요합니다. 먼저 로그인해주세요.', 'error');
        openSignInModal();
        return;
    }
    
    try {
        // 파일 유효성 검사
        if (!file) {
            showNotification('파일을 선택해주세요.', 'error');
            return;
        }
        
        if (!file.type.includes('pdf')) {
            showNotification('PDF 파일만 업로드 가능합니다.', 'error');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB
            showNotification('파일 크기가 10MB를 초과합니다.', 'error');
            return;
        }
        
        // 파일 정보 저장
        selectedFile = file;
        
        // 파일 정보 표시
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        
        // 업로드 영역 변경
        uploadDefault.style.display = 'none';
        uploadInfo.style.display = 'block';
        
        showNotification(`파일이 선택되었습니다: ${file.name}`, 'success');
        disclosureSection.style.display = 'block';
        updateAnalyzeButton();
        
        console.log('파일이 성공적으로 처리되었습니다:', file.name);
    } catch (error) {
        console.error('파일 처리 오류:', error);
        showNotification('파일 처리 중 오류가 발생했습니다.', 'error');
    }
}

// 파일 크기 포맷팅
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 파일 입력 트리거
function triggerFileInput() {
    // Clerk 초기화 완료 대기
    if (!window.clerk) {
        return;
    }
    
    // 인증 체크
    if (!window.clerk.isSignedIn) {
        showLoginRequiredScreen();
        return;
    }
    
    fileInput.click();
}

// 파일 업로드 초기화
function resetFileUpload() {
    selectedFile = null;
    fileInput.value = '';
    uploadDefault.style.display = 'block';
    uploadInfo.style.display = 'none';
    disclosureSection.style.display = 'none';
    updateAnalyzeButton();
    
    // 홈화면 다시 표시
    const mainHeader = document.querySelector('.main-header');
    const uploadSection = document.querySelector('.upload-section');
    
    if (mainHeader) mainHeader.style.display = 'block';
    if (uploadSection) uploadSection.style.display = 'block';
    
    // 결과 섹션 숨기기
    resultSection.style.display = 'none';
}

// 문서 분석
async function analyzeDocument() {
    // 인증 체크
    if (!window.clerk || !window.clerk.isSignedIn) {
        showNotification('로그인이 필요합니다. 먼저 로그인해주세요.', 'error');
        openSignInModal();
        return;
    }
    
    if (!selectedFile || !disclosureTypeSelect.value || !specificTypeSelect.value) {
        showNotification('모든 필드를 선택해주세요.', 'error');
        return;
    }
    
    // 분석 정보 저장
    const now = new Date();
    analysisInfo = {
        fileName: selectedFile.name,
        fileSize: formatFileSize(selectedFile.size),
        analysisDate: now.toLocaleDateString('ko-KR'),
        analysisTime: now.toLocaleTimeString('ko-KR'),
        disclosureType: disclosureTypeSelect.options[disclosureTypeSelect.selectedIndex].text,
        specificType: specificTypeSelect.options[specificTypeSelect.selectedIndex].text
    };
    
    // 로딩 화면 표시
    showLoading();
    
    try {
        const formData = new FormData();
        formData.append('document', selectedFile);
        formData.append('disclosureType', disclosureTypeSelect.value);
        formData.append('specificType', specificTypeSelect.value);
        
        // 타임아웃 설정 (3분)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000);
        
        const response = await fetch('/api/analysis/analyze', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
            headers: {
                // Clerk 사용자 정보를 헤더에 포함
                'X-Clerk-User': window.clerk?.user ? JSON.stringify(window.clerk.user) : ''
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayResult(data.result);
            showNotification('분석이 완료되었습니다!', 'success');
            
            // 분석 기록 리스트 업데이트
            loadAnalysisHistory();
        } else {
            throw new Error(data.error || '분석 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('분석 오류:', error);
        
        let errorMessage = '분석 중 오류가 발생했습니다.';
        
        if (error.name === 'AbortError') {
            errorMessage = '분석 시간이 초과되었습니다. 파일 크기를 줄이거나 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('API 키')) {
            errorMessage = 'AI 서비스 연결에 문제가 있습니다. 관리자에게 문의해주세요.';
        } else if (error.message.includes('PDF')) {
            errorMessage = 'PDF 파일을 읽을 수 없습니다. 파일을 확인해주세요.';
        } else if (error.message.includes('네트워크')) {
            errorMessage = '네트워크 연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('텍스트를 추출할 수 없')) {
            errorMessage = 'PDF에서 텍스트를 추출할 수 없습니다. 스캔된 이미지가 아닌 텍스트가 포함된 PDF를 업로드해주세요.';
        } else {
            errorMessage = error.message;
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

// 로딩 화면 표시
// 로딩 단계 관리
let currentStep = 0;
const steps = [
    { title: '문서 읽기', desc: 'PDF 내용 추출 중' },
    { title: 'Dartify 분석', desc: '인사이트 도출 중' },
    { title: '결과 생성', desc: '분석 결과 정리 중' }
];

function showLoading() {
    loadingSection.style.display = 'block';
    resultSection.style.display = 'none';
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = '분석 중...';
    
    // 로딩 단계 초기화
    currentStep = 0;
    updateLoadingStep();
    updateProgress();
    
    // 단계별 진행 시뮬레이션
    simulateLoadingProgress();
}

// 로딩 화면 숨기기
function hideLoading() {
    loadingSection.style.display = 'none';
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = '분석 시작';
    updateAnalyzeButton();
    
    // 로딩 상태 초기화
    currentStep = 0;
    updateLoadingStep();
}

// 로딩 단계 업데이트
function updateLoadingStep() {
    const stepItems = document.querySelectorAll('.step-item');
    const progressPercentage = document.querySelector('.progress-percentage');
    
    stepItems.forEach((item, index) => {
        // 모든 active 클래스 제거
        item.classList.remove('active');
        
        if (index <= currentStep) {
            // 현재 단계까지 활성화
            item.classList.add('active');
        }
        // index > currentStep인 경우는 기본 상태 유지
    });
    
    // 진행률 업데이트
    const percentage = Math.round(((currentStep + 1) / steps.length) * 100);
    if (progressPercentage) {
        progressPercentage.textContent = `${percentage}%`;
    }
}

// 진행률 업데이트
function updateProgress() {
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        const percentage = ((currentStep + 1) / steps.length) * 100;
        progressFill.style.width = `${percentage}%`;
    }
}

// 로딩 진행 시뮬레이션
function simulateLoadingProgress() {
    const stepDuration = 3000; // 각 단계당 3초
    
    // 첫 번째 단계는 이미 활성화되어 있음 (currentStep = 0)
    
    // 첫 번째 단계 완료 (문서 읽기)
    setTimeout(() => {
        currentStep = 1;
        updateLoadingStep();
        updateProgress();
    }, stepDuration);
    
    // 두 번째 단계 완료 (Dartify 분석)
    setTimeout(() => {
        currentStep = 2;
        updateLoadingStep();
        updateProgress();
    }, stepDuration * 2);
}

// 마크다운을 트렌디한 HTML로 변환 (완전히 새로운 노션 스타일)
function convertMarkdownToTrendyHTML(markdown) {
    // 마크다운을 파싱하여 구조화된 데이터로 변환
    const parsedContent = parseMarkdown(markdown);
    
    // 구조화된 데이터를 노션 스타일 HTML로 변환
    return generateNotionStyleHTML(parsedContent);
}

// 마크다운 파싱 함수
function parseMarkdown(markdown) {
    const lines = markdown.split('\n');
    const blocks = [];
    let currentBlock = null;
    let currentList = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
            // 빈 줄 처리
            if (currentBlock && currentBlock.type !== 'list') {
                blocks.push(currentBlock);
                currentBlock = null;
            }
            continue;
        }
        
        // 제목 처리 (#, ##, ###, ####, #####, ######)
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            if (currentBlock) blocks.push(currentBlock);
            if (currentList) {
                blocks.push(currentList);
                currentList = null;
            }
            
            const level = headingMatch[1].length;
            const title = headingMatch[2];
            currentBlock = {
                type: 'heading',
                level: level,
                content: title,
                children: []
            };
            continue;
        }
        
        // 구분선 처리 (---, ***, ___)
        if (line.match(/^[-*_]{3,}$/)) {
            if (currentBlock) blocks.push(currentBlock);
            if (currentList) {
                blocks.push(currentList);
                currentList = null;
            }
            currentBlock = {
                type: 'divider',
                content: ''
            };
            continue;
        }
        
        // 순서가 있는 리스트 처리 (1. 2. 3.)
        const orderedListMatch = line.match(/^(\d+)\.\s+(.+)$/);
        if (orderedListMatch) {
            if (currentBlock && currentBlock.type !== 'list') {
                blocks.push(currentBlock);
                currentBlock = null;
            }
            
            if (!currentList || currentList.type !== 'ordered-list') {
                if (currentList) blocks.push(currentList);
                currentList = {
                    type: 'ordered-list',
                    items: []
                };
            }
            
            currentList.items.push({
                number: parseInt(orderedListMatch[1]),
                content: orderedListMatch[2]
            });
            continue;
        }
        
        // 순서가 없는 리스트 처리 (-, *, +)
        const unorderedListMatch = line.match(/^[-*+]\s+(.+)$/);
        if (unorderedListMatch) {
            if (currentBlock && currentBlock.type !== 'list') {
                blocks.push(currentBlock);
                currentBlock = null;
            }
            
            if (!currentList || currentList.type !== 'unordered-list') {
                if (currentList) blocks.push(currentList);
                currentList = {
                    type: 'unordered-list',
                    items: []
                };
            }
            
            currentList.items.push({
                content: unorderedListMatch[1]
            });
            continue;
        }
        
        // 코드 블록 처리 (```)
        if (line.startsWith('```')) {
            if (currentBlock) blocks.push(currentBlock);
            if (currentList) {
                blocks.push(currentList);
                currentList = null;
            }
            
            const codeLines = [];
            i++; // 다음 줄부터 시작
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            
            currentBlock = {
                type: 'code-block',
                content: codeLines.join('\n')
            };
            continue;
        }
        
        // 표 처리 (|로 시작하는 줄)
        if (line.startsWith('|') && line.endsWith('|')) {
            if (currentBlock && currentBlock.type !== 'table') {
                blocks.push(currentBlock);
            }
            
            if (!currentBlock || currentBlock.type !== 'table') {
                currentBlock = {
                    type: 'table',
                    headers: [],
                    rows: []
                };
            }
            
            // 표 헤더 또는 행 파싱
            const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
            
            if (currentBlock.headers.length === 0) {
                // 첫 번째 줄은 헤더
                currentBlock.headers = cells;
            } else if (line.includes('---')) {
                // 구분선 무시
                continue;
            } else {
                // 데이터 행
                currentBlock.rows.push(cells);
            }
            continue;
        }
        
        // 인라인 코드 처리 (`)
        if (line.includes('`')) {
            if (currentBlock && currentBlock.type !== 'paragraph') {
                blocks.push(currentBlock);
            }
            
            if (!currentBlock || currentBlock.type !== 'paragraph') {
                currentBlock = {
                    type: 'paragraph',
                    content: ''
                };
            }
            
            currentBlock.content += (currentBlock.content ? '\n' : '') + line;
            continue;
        }
        
        // 일반 텍스트 (단락)
        if (currentBlock && currentBlock.type === 'paragraph') {
            currentBlock.content += '\n' + line;
        } else {
            if (currentBlock) blocks.push(currentBlock);
            if (currentList) {
                blocks.push(currentList);
                currentList = null;
            }
            currentBlock = {
                type: 'paragraph',
                content: line
            };
        }
    }
    
    // 마지막 블록들 처리
    if (currentBlock) blocks.push(currentBlock);
    if (currentList) blocks.push(currentList);
    
    return blocks;
}

// 노션 스타일 HTML 생성 함수
function generateNotionStyleHTML(blocks) {
    let html = '<div class="notion-container">';
    
    blocks.forEach(block => {
        switch (block.type) {
            case 'heading':
                html += generateHeadingHTML(block);
                break;
            case 'paragraph':
                html += generateParagraphHTML(block);
                break;
            case 'ordered-list':
                html += generateOrderedListHTML(block);
                break;
            case 'unordered-list':
                html += generateUnorderedListHTML(block);
                break;
            case 'code-block':
                html += generateCodeBlockHTML(block);
                break;
            case 'divider':
                html += generateDividerHTML(block);
                break;
            case 'table':
                html += generateTableHTML(block);
                break;
        }
    });
    
    html += '</div>';
    return html;
}

// 제목 HTML 생성
function generateHeadingHTML(block) {
    const headingClass = getHeadingClass(block.level);
    const processedContent = processInlineMarkdown(block.content);
    
    return `
        <div class="notion-block notion-heading ${headingClass}">
            <div class="notion-heading-content">
                <h${block.level} class="notion-heading-text">${processedContent}</h${block.level}>
            </div>
        </div>
    `;
}

// 단락 HTML 생성
function generateParagraphHTML(block) {
    const processedContent = processInlineMarkdown(block.content);
    
    return `
        <div class="notion-block notion-paragraph">
            <div class="notion-paragraph-content">
                <p>${processedContent}</p>
            </div>
        </div>
    `;
}

// 순서가 있는 리스트 HTML 생성
function generateOrderedListHTML(block) {
    let html = '<div class="notion-block notion-ordered-list">';
    
    block.items.forEach((item, index) => {
        const processedContent = processInlineMarkdown(item.content);
        html += `
            <div class="notion-list-item notion-ordered-item">
                <div class="notion-list-item-content">
                    <div class="notion-list-item-number">${index + 1}</div>
                    <div class="notion-list-item-text">${processedContent}</div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// 순서가 없는 리스트 HTML 생성
function generateUnorderedListHTML(block) {
    let html = '<div class="notion-block notion-unordered-list">';
    
    block.items.forEach(item => {
        const processedContent = processInlineMarkdown(item.content);
        html += `
            <div class="notion-list-item notion-unordered-item">
                <div class="notion-list-item-content">
                    <div class="notion-list-item-bullet"></div>
                    <div class="notion-list-item-text">${processedContent}</div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// 코드 블록 HTML 생성
function generateCodeBlockHTML(block) {
    return `
        <div class="notion-block notion-code-block">
            <div class="notion-code-block-content">
                <pre><code>${escapeHtml(block.content)}</code></pre>
            </div>
        </div>
    `;
}

// 구분선 HTML 생성
function generateDividerHTML(block) {
    return `
        <div class="notion-block notion-divider">
            <div class="notion-divider-line"></div>
        </div>
    `;
}

// 표 HTML 생성
function generateTableHTML(block) {
    let html = '<div class="notion-block notion-table">';
    html += '<div class="notion-table-container">';
    html += '<table class="notion-table">';
    
    // 헤더 생성
    if (block.headers.length > 0) {
        html += '<thead><tr>';
        block.headers.forEach(header => {
            html += `<th>${processInlineMarkdown(header)}</th>`;
        });
        html += '</tr></thead>';
    }
    
    // 데이터 행 생성
    if (block.rows.length > 0) {
        html += '<tbody>';
        block.rows.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                html += `<td>${processInlineMarkdown(cell)}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody>';
    }
    
    html += '</table>';
    html += '</div>';
    html += '</div>';
    
    return html;
}

// 인라인 마크다운 처리 (강조, 링크, 인라인 코드)
function processInlineMarkdown(text) {
    return text
        // 강조 처리 (**bold**, *italic*)
        .replace(/\*\*(.+?)\*\*/g, '<strong class="notion-bold">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em class="notion-italic">$1</em>')
        // 링크 처리 [text](url)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="notion-link" target="_blank" rel="noopener">$1</a>')
        // 인라인 코드 처리 (`code`)
        .replace(/`([^`]+)`/g, '<code class="notion-inline-code">$1</code>');
}

// 제목 레벨에 따른 클래스 결정 (마크다운 # 기반)
function getHeadingClass(level) {
    switch (level) {
        case 1: return 'notion-heading-1 main-section';
        case 2: return 'notion-heading-2 sub-section';
        case 3: return 'notion-heading-3 detail-section';
        case 4: return 'notion-heading-4 detail-section';
        case 5: return 'notion-heading-5 detail-section';
        case 6: return 'notion-heading-6 detail-section';
        default: return 'notion-heading-3 detail-section';
    }
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 결과 표시 (개선된 버전)
function displayResult(result) {
    // 홈화면 요소들 숨기기
    const mainHeader = document.querySelector('.main-header');
    const uploadSection = document.querySelector('.upload-section');
    const disclosureSection = document.querySelector('.disclosure-section');
    
    if (mainHeader) mainHeader.style.display = 'none';
    if (uploadSection) uploadSection.style.display = 'none';
    if (disclosureSection) disclosureSection.style.display = 'none';
    
    // 파일 정보 표시
    if (analysisInfo) {
        analysisFileName.textContent = analysisInfo.fileName;
        analysisDate.textContent = analysisInfo.analysisDate;
        analysisTime.textContent = analysisInfo.analysisTime;
        analysisType.textContent = `${analysisInfo.disclosureType} - ${analysisInfo.specificType}`;
    }
    
    // 마크다운을 트렌디한 HTML로 변환
    const trendyHTML = convertMarkdownToTrendyHTML(result);
    
    // 기존 내용 제거 후 새로운 결과 표시
    resultContent.innerHTML = trendyHTML;
    resultSection.style.display = 'block';
    
    // 부드러운 애니메이션 효과 추가
    resultSection.style.opacity = '0';
    resultSection.style.transform = 'translateY(15px)';
    
    setTimeout(() => {
        resultSection.style.transition = 'all 0.4s ease';
        resultSection.style.opacity = '1';
        resultSection.style.transform = 'translateY(0)';
        
        // 스크롤이 제대로 작동하도록 추가 설정
        resultContent.style.overflowY = 'auto';
        resultContent.style.webkitOverflowScrolling = 'touch';
        
        // 결과 섹션으로 부드럽게 스크롤
        resultSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 50);
}

// 결과 복사 (개선된 버전)
function copyResult() {
    // HTML에서 텍스트만 추출
    const textContent = resultContent.innerText || resultContent.textContent;
    navigator.clipboard.writeText(textContent).then(() => {
        showNotification('결과가 클립보드에 복사되었습니다.', 'success');
    }).catch(() => {
        showNotification('복사에 실패했습니다.', 'error');
    });
}

// 결과 다운로드 (텍스트 파일 버전)
function downloadResult() {
    const textContent = resultContent.innerText || resultContent.textContent;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dartify-analysis-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('결과가 다운로드되었습니다.', 'success');
}

// 알림 표시
function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 스타일 추가
    const getBackground = (type) => {
        switch(type) {
            case 'success':
                return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            case 'error':
                return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
            default:
                return 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)';
        }
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getBackground(type)};
        color: white;
        padding: 18px 24px;
        border-radius: 15px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        max-width: 400px;
        word-wrap: break-word;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    document.body.appendChild(notification);
    
    // 5초 후 자동 제거 (에러는 더 오래 표시)
    const displayTime = type === 'error' ? 8000 : 3000;
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, displayTime);
    
    // 알림 요소 반환
    return notification;
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { 
            transform: translateX(100%) scale(0.8); 
            opacity: 0; 
        }
        to { 
            transform: translateX(0) scale(1); 
            opacity: 1; 
        }
    }
    
    @keyframes slideOut {
        from { 
            transform: translateX(0) scale(1); 
            opacity: 1; 
        }
        to { 
            transform: translateX(100%) scale(0.8); 
            opacity: 0; 
        }
    }
    
    .notification {
        transition: all 0.3s ease;
    }
    
    .notification:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(0,0,0,0.25) !important;
    }
    
    /* 스크롤바 스타일 개선 */
    .result-content::-webkit-scrollbar {
        width: 10px;
    }
    
    .result-content::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 6px;
    }
    
    .result-content::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 6px;
        border: 2px solid #f1f1f1;
    }
    
    .result-content::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #5a6fd8, #6a4c93);
    }
`;
document.head.appendChild(style); 

// 사이드바 토글 (ChatGPT 스타일)
function toggleSidebar() {
    const sidebar = document.getElementById('analysisSidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    
    if (sidebar.classList.contains('closed')) {
        // 사이드바 열기
        sidebar.classList.remove('closed');
        toggleBtn.classList.remove('closed');
        toggleBtn.classList.add('open');
    } else {
        // 사이드바 닫기
        sidebar.classList.add('closed');
        toggleBtn.classList.add('closed');
        toggleBtn.classList.remove('open');
    }
}

// 분석 기록 로드
async function loadAnalysisHistory() {
    // 로그인 상태 확인
    if (!window.clerk || !window.clerk.isSignedIn) {
        console.log('로그인되지 않은 사용자 - 분석 기록 로드 건너뜀');
        analysisHistory = [];
        renderAnalysisHistory();
        return;
    }
    
    try {
        const response = await fetch('/api/analysis/history', {
            headers: {
                'X-Clerk-User': window.clerk?.user ? JSON.stringify(window.clerk.user) : ''
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                analysisHistory = data.history || [];
                renderAnalysisHistory();
            }
        }
    } catch (error) {
        console.error('분석 기록 로드 실패:', error);
        // 오류 발생 시 빈 배열로 초기화
        analysisHistory = [];
        renderAnalysisHistory();
    }
}

// 분석 기록 렌더링
function renderAnalysisHistory() {
    const analysisList = document.getElementById('analysisList');
    const emptyState = document.getElementById('emptyState');
    
    if (analysisHistory.length === 0) {
        analysisList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    analysisList.style.display = 'block';
    emptyState.style.display = 'none';
    
    analysisList.innerHTML = analysisHistory.map(analysis => {
        // 파일명 처리 - UTF-8 인코딩 문제 해결
        let displayFilename = analysis.filename;
        
        // 깨진 문자 패턴 감지
        const isCorrupted = displayFilename.includes('á') || displayFilename.includes('µ') || 
            displayFilename.includes('¥') || displayFilename.includes('³') || 
            displayFilename.includes('®') || displayFilename.includes('¼');
        
        if (isCorrupted) {
            // 깨진 파일명인 경우 의미있는 기본 파일명 생성
            const date = new Date(analysis.created_at);
            const dateStr = date.toISOString().slice(0, 10);
            const typeStr = analysis.disclosure_type || '분석';
            const specificStr = analysis.specific_type || '문서';
            
            // 더 의미있는 파일명 생성
            displayFilename = `${typeStr}_${specificStr}_${dateStr}.pdf`;
            console.log('깨진 파일명 감지, 기본값 생성:', displayFilename);
        } else {
            try {
                // URL 디코딩 시도
                displayFilename = decodeURIComponent(displayFilename);
            } catch (e) {
                // 디코딩 실패 시 원본 사용
                displayFilename = displayFilename;
            }
            
            // 원본 파일명을 그대로 사용 (특수문자 제거하지 않음)
            displayFilename = displayFilename.trim();
        }
        
        // 파일명이 비어있거나 너무 짧은 경우 기본값 사용
        if (!displayFilename || displayFilename.length < 3) {
            const date = new Date(analysis.created_at);
            const typeStr = analysis.disclosure_type || '분석';
            const specificStr = analysis.specific_type || '문서';
            displayFilename = `${typeStr}_${specificStr}_${date.toISOString().slice(0, 10)}.pdf`;
        }
        
        return `
            <div class="analysis-item" data-id="${analysis.id}">
                <div class="analysis-item-content" onclick="selectAnalysis(${analysis.id})">
                    <div class="analysis-item-header">
                        <div class="analysis-item-icon">
                            <i class="fas fa-file-pdf"></i>
                        </div>
                        <div class="analysis-item-title">${displayFilename}</div>
                    </div>
                    <div class="analysis-item-meta">
                        <div class="analysis-item-type">${analysis.disclosure_type} - ${analysis.specific_type}</div>
                        <div class="analysis-item-date">${formatDate(analysis.created_at)}</div>
                    </div>
                </div>
                <div class="analysis-item-actions">
                    <button class="delete-btn" onclick="deleteAnalysis(${analysis.id}, event)" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 분석 기록 삭제
async function deleteAnalysis(analysisId, event) {
    // 이벤트 버블링 방지
    event.stopPropagation();
    
    // 삭제 확인 모달 표시
    const confirmed = await showDeleteConfirmModal();
    
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await fetch(`/api/analysis/result/${analysisId}`, {
            method: 'DELETE',
            headers: {
                'X-Clerk-User': window.clerk?.user ? JSON.stringify(window.clerk.user) : ''
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showNotification('분석 기록이 삭제되었습니다.', 'success');
                
                // 현재 선택된 분석이 삭제된 경우 결과 섹션 숨기기
                if (currentAnalysisId === analysisId) {
                    resultSection.style.display = 'none';
                    currentAnalysisId = null;
                }
                
                // 분석 기록 리스트 새로고침
                loadAnalysisHistory();
            } else {
                throw new Error(data.message || '삭제에 실패했습니다.');
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('분석 기록 삭제 실패:', error);
        showNotification('분석 기록 삭제에 실패했습니다.', 'error');
    }
}

// 모든 분석 기록 삭제
async function deleteAllAnalysis() {
    // 삭제 확인 모달 표시 (모든 기록 삭제용)
    const confirmed = await showDeleteAllConfirmModal();
    
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await fetch('/api/analysis/history', {
            method: 'DELETE',
            headers: {
                'X-Clerk-User': window.clerk?.user ? JSON.stringify(window.clerk.user) : ''
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showNotification('모든 분석 기록이 삭제되었습니다.', 'success');
                
                // 결과 섹션 숨기기
                resultSection.style.display = 'none';
                currentAnalysisId = null;
                
                // 분석 기록 리스트 새로고침
                loadAnalysisHistory();
            } else {
                throw new Error(data.message || '삭제에 실패했습니다.');
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('모든 분석 기록 삭제 실패:', error);
        showNotification('모든 분석 기록 삭제에 실패했습니다.', 'error');
    }
}

// 모든 기록 삭제 확인 모달 표시
function showDeleteAllConfirmModal() {
    return new Promise((resolve) => {
        // 기존 모달이 있다면 제거
        const existingModal = document.getElementById('deleteAllConfirmModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 모달 생성
        const modal = document.createElement('div');
        modal.id = 'deleteAllConfirmModal';
        modal.className = 'delete-confirm-modal';
        modal.innerHTML = `
            <div class="delete-confirm-overlay">
                <div class="delete-confirm-container">
                    <div class="delete-confirm-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 class="delete-confirm-title">모든 분석 기록 삭제</h3>
                    <p class="delete-confirm-message">
                        모든 분석 기록을 삭제하시겠습니까?<br>
                        이 작업은 되돌릴 수 없으며, 모든 분석 결과가 영구적으로 삭제됩니다.
                    </p>
                    <div class="delete-confirm-buttons">
                        <button class="delete-confirm-btn cancel" onclick="closeDeleteAllModal(false)">
                            <i class="fas fa-times"></i>
                            취소
                        </button>
                        <button class="delete-confirm-btn confirm" onclick="closeDeleteAllModal(true)">
                            <i class="fas fa-trash"></i>
                            모든 기록 삭제
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // 모달을 body에 추가
        document.body.appendChild(modal);
        
        // ESC 키 이벤트 리스너 추가
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                closeDeleteAllModal(false);
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);
        
        // 모달 외부 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeDeleteAllModal(false);
            }
        });
        
        // 모달 표시 애니메이션
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.delete-confirm-container').style.transform = 'scale(1)';
        }, 10);
        
        // 전역 함수로 모달 닫기 함수 등록
        window.closeDeleteAllModal = (confirmed) => {
            modal.style.opacity = '0';
            modal.querySelector('.delete-confirm-container').style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                modal.remove();
                resolve(confirmed);
            }, 200);
        };
    });
}

// 삭제 확인 모달 표시 (개별 삭제용)
function showDeleteConfirmModal() {
    return new Promise((resolve) => {
        // 기존 모달이 있다면 제거
        const existingModal = document.getElementById('deleteConfirmModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 모달 생성
        const modal = document.createElement('div');
        modal.id = 'deleteConfirmModal';
        modal.className = 'delete-confirm-modal';
        modal.innerHTML = `
            <div class="delete-confirm-overlay">
                <div class="delete-confirm-container">
                    <div class="delete-confirm-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 class="delete-confirm-title">분석 기록 삭제</h3>
                    <p class="delete-confirm-message">
                        이 분석 기록을 삭제하시겠습니까?<br>
                        삭제된 기록은 복구할 수 없습니다.
                    </p>
                    <div class="delete-confirm-buttons">
                        <button class="delete-confirm-btn cancel" onclick="closeDeleteModal(false)">
                            <i class="fas fa-times"></i>
                            취소
                        </button>
                        <button class="delete-confirm-btn confirm" onclick="closeDeleteModal(true)">
                            <i class="fas fa-trash"></i>
                            삭제
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // 모달을 body에 추가
        document.body.appendChild(modal);
        
        // ESC 키 이벤트 리스너 추가
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                closeDeleteModal(false);
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);
        
        // 모달 외부 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeDeleteModal(false);
            }
        });
        
        // 모달 표시 애니메이션
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.delete-confirm-container').style.transform = 'scale(1)';
        }, 10);
        
        // 전역 함수로 모달 닫기 함수 등록
        window.closeDeleteModal = (confirmed) => {
            modal.style.opacity = '0';
            modal.querySelector('.delete-confirm-container').style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                modal.remove();
                resolve(confirmed);
            }, 200);
        };
    });
}

// 분석 결과 선택
async function selectAnalysis(analysisId) {
    try {
        // 기존 선택 해제
        document.querySelectorAll('.analysis-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 현재 항목 선택
        const selectedItem = document.querySelector(`[data-id="${analysisId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
        
        currentAnalysisId = analysisId;
        
        // 분석 결과 로드
        const response = await fetch(`/api/analysis/result/${analysisId}`, {
            headers: {
                'X-Clerk-User': window.clerk?.user ? JSON.stringify(window.clerk.user) : ''
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayAnalysisResult(data.result);
            }
        }
    } catch (error) {
        console.error('분석 결과 로드 실패:', error);
        showNotification('분석 결과를 불러올 수 없습니다.', 'error');
    }
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return '오늘';
    } else if (diffDays === 2) {
        return '어제';
    } else if (diffDays <= 7) {
        return `${diffDays - 1}일 전`;
    } else {
        return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
        });
    }
}

// 분석 결과 표시 (기존 함수 수정)
function displayAnalysisResult(result) {
    // 홈화면 요소들 숨기기
    const mainHeader = document.querySelector('.main-header');
    const uploadSection = document.querySelector('.upload-section');
    const disclosureSection = document.querySelector('.disclosure-section');
    
    if (mainHeader) mainHeader.style.display = 'none';
    if (uploadSection) uploadSection.style.display = 'none';
    if (disclosureSection) disclosureSection.style.display = 'none';
    
    // 파일명 처리 - UTF-8 인코딩 문제 해결
    let displayFilename = result.filename;
    
    // 깨진 문자 패턴 감지
    const isCorrupted = displayFilename.includes('á') || displayFilename.includes('µ') || 
        displayFilename.includes('¥') || displayFilename.includes('³') || 
        displayFilename.includes('®') || displayFilename.includes('¼');
    
    if (isCorrupted) {
        // UTF-8 복구 시도
        try {
            // Latin-1 바이트를 UTF-8로 변환
            const latin1Bytes = new Uint8Array(displayFilename.length);
            for (let i = 0; i < displayFilename.length; i++) {
                latin1Bytes[i] = displayFilename.charCodeAt(i);
            }
            const utf8String = new TextDecoder('utf-8').decode(latin1Bytes);
            
            // 변환된 문자열이 유효한지 확인
            if (utf8String && utf8String.length > 0 && !utf8String.includes('')) {
                displayFilename = utf8String;
            }
        } catch (e) {
            console.log('UTF-8 변환 실패:', e);
        }
    } else {
        try {
            // URL 디코딩 시도
            displayFilename = decodeURIComponent(displayFilename);
        } catch (e) {
            // 디코딩 실패 시 원본 사용
            displayFilename = displayFilename;
        }
        
        // 원본 파일명을 그대로 사용 (특수문자 제거하지 않음)
        displayFilename = displayFilename.trim();
    }
    
    // 파일명이 비어있거나 너무 짧은 경우 기본값 사용
    if (!displayFilename || displayFilename.length < 3) {
        const date = new Date(result.created_at);
        displayFilename = `분석문서_${date.toISOString().slice(0, 10)}_${result.id}.pdf`;
    }
    
    // 파일 정보 표시
    if (result.filename) {
        analysisFileName.textContent = displayFilename; // 처리된 파일명 사용
        analysisDate.textContent = formatDate(result.created_at);
        analysisTime.textContent = new Date(result.created_at).toLocaleTimeString('ko-KR');
        analysisType.textContent = `${result.disclosure_type} - ${result.specific_type}`;
    }
    
    // 마크다운을 트렌디한 HTML로 변환
    const trendyHTML = convertMarkdownToTrendyHTML(result.analysis_result);
    
    // 기존 내용 제거 후 새로운 결과 표시
    resultContent.innerHTML = trendyHTML;
    resultSection.style.display = 'block';
    
    // 부드러운 애니메이션 효과 추가
    resultSection.style.opacity = '0';
    resultSection.style.transform = 'translateY(15px)';
    
    setTimeout(() => {
        resultSection.style.transition = 'all 0.4s ease';
        resultSection.style.opacity = '1';
        resultSection.style.transform = 'translateY(0)';
        
        // 스크롤이 제대로 작동하도록 추가 설정
        resultContent.style.overflowY = 'auto';
        resultContent.style.webkitOverflowScrolling = 'touch';
        
        // 결과 섹션으로 부드럽게 스크롤
        resultSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 50);
} 

// 홈 화면으로 돌아가는 함수
function goToHome() {
    // 모든 섹션을 초기 상태로 리셋
    resetToHomeState();
    
    // 홈 화면 요소들 표시
    const mainHeader = document.querySelector('.main-header');
    const uploadSection = document.querySelector('.upload-section');
    const disclosureSection = document.querySelector('.disclosure-section');
    
    if (mainHeader) mainHeader.style.display = 'block';
    if (uploadSection) uploadSection.style.display = 'block';
    if (disclosureSection) disclosureSection.style.display = 'none';
    
    // 결과 섹션과 로딩 섹션 숨기기
    if (resultSection) resultSection.style.display = 'none';
    if (loadingSection) loadingSection.style.display = 'none';
    
    // 파일 업로드 상태 리셋
    resetFileUpload();
    
    // 홈 화면으로 부드럽게 스크롤
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // 사이드바에서 활성 상태 제거
    const activeItems = document.querySelectorAll('.analysis-item.active');
    activeItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // 현재 분석 ID 리셋
    currentAnalysisId = null;
    
    console.log('홈 화면으로 이동했습니다.');
}

// 홈 상태로 리셋하는 함수
function resetToHomeState() {
    // 파일 선택 상태 리셋
    selectedFile = null;
    
    // 공시 유형 선택 리셋
    if (disclosureTypeSelect) disclosureTypeSelect.value = '';
    if (specificTypeSelect) specificTypeSelect.value = '';
    
    // 분석 버튼 비활성화
    if (analyzeBtn) analyzeBtn.disabled = true;
    
    // 결과 내용 초기화
    if (resultContent) resultContent.innerHTML = '';
    
    // 파일 정보 초기화
    if (analysisFileName) analysisFileName.textContent = '파일명';
    if (analysisDate) analysisDate.textContent = '분석 날짜';
    if (analysisTime) analysisTime.textContent = '분석 시간';
    if (analysisType) analysisType.textContent = '분석 유형';
} 

// 개발자에게 문의하는 함수
function contactDeveloper() {
    // 연락처 팝업 열기
    const popup = document.getElementById('contactPopup');
    popup.classList.add('show');
    
    // ESC 키로 팝업 닫기
    const handleEscKey = (e) => {
        if (e.key === 'Escape') {
            closeContactPopup();
            document.removeEventListener('keydown', handleEscKey);
        }
    };
    document.addEventListener('keydown', handleEscKey);
    
    console.log('연락처 팝업을 열었습니다.');
}

// 연락처 팝업 닫기 함수
function closeContactPopup() {
    const popup = document.getElementById('contactPopup');
    popup.classList.remove('show');
}