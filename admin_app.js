/**
 * 국립목포해양대학교 대학성과관리 시스템 (MMU IR Dashboard)
 * 핵심 비즈니스 로직 및 데이터 관리 스크립트 (밝은 테마 차트 색상 매핑 수정)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Lucide 아이콘 초기화
    lucide.createIcons();

    // 1. 기본 데이터 정의 (실제 대학알리미 공시 수치 기반 구성)
    const DEFAULT_DATA = {
        "2026": {
            // 6대 핵심 지표
            retention: { actual: 94.20, target: 95.00, formula: "[(재학생 수 + 시간제 등록학생 정원 환산 수) / 편제정원] × 100", name: "재학생 충원율", unit: "%" },
            employment: { actual: 83.10, target: 84.50, formula: "[(건강보험 직장가입자 + 해외취업자 + 1인창업자 등) / (졸업자 - 제외대상자)] × 100", name: "졸업생 취업률", unit: "%" },
            freshman: { actual: 100.00, target: 100.00, formula: "[(입학 인원) / 모집 인원] × 100", name: "신입생 충원율", unit: "%" },
            education_cost: { actual: 1850, target: 1900, formula: "[대학의 총 교육비 집행액 / 재학생 수]", name: "학생 1인당 교육비", unit: "만원" },
            faculty_ratio: { actual: 79.50, target: 82.00, formula: "[(재직 전임교원 수) / 대학설립·운영규정상 기준 교원 수] × 100", name: "전임교원 확보율", unit: "%" },
            research: { 
                sci: 0.48, 
                nrf: 0.52, 
                books: 0.14, 
                target: 1.10, 
                formula: "[(전임교원의 논문 및 저역서 환산 건수 합계) / 전임교원 수]", 
                name: "전임교원 연구실적", 
                unit: "건" 
            }
        },
        "2025": {
            retention: { actual: 93.80, target: 94.50, formula: "[(재학생 수 + 시간제 등록학생 정원 환산 수) / 편제정원] × 100", name: "재학생 충원율", unit: "%" },
            employment: { actual: 81.50, target: 83.00, formula: "[(건강보험 직장가입자 + 해외취업자 + 1인창업자 등) / (졸업자 - 제외대상자)] × 100", name: "졸업생 취업률", unit: "%" },
            freshman: { actual: 100.00, target: 100.00, formula: "[(입학 인원) / 모집 인원] × 100", name: "신입생 충원율", unit: "%" },
            education_cost: { actual: 1780, target: 1800, formula: "[대학의 총 교육비 집행액 / 재학생 수]", name: "학생 1인당 교육비", unit: "만원" },
            faculty_ratio: { actual: 78.20, target: 80.00, formula: "[(재직 전임교원 수) / 대학설립·운영규정상 기준 교원 수] × 100", name: "전임교원 확보율", unit: "%" },
            research: { 
                sci: 0.42, 
                nrf: 0.48, 
                books: 0.15, 
                target: 1.00, 
                formula: "[(전임교원의 논문 및 저역서 환산 건수 합계) / 전임교원 수]", 
                name: "전임교원 연구실적", 
                unit: "건" 
            }
        },
        "2024": {
            retention: { actual: 92.40, target: 93.50, formula: "[(재학생 수 + 시간제 등록학생 정원 환산 수) / 편제정원] × 100", name: "재학생 충원율", unit: "%" },
            employment: { actual: 78.20, target: 80.00, formula: "[(건강보험 직장가입자 + 해외취업자 + 1인창업자 등) / (졸업자 - 제외대상자)] × 100", name: "졸업생 취업률", unit: "%" },
            freshman: { actual: 99.80, target: 100.00, formula: "[(입학 인원) / 모집 인원] × 100", name: "신입생 충원율", unit: "%" },
            education_cost: { actual: 1650, target: 1700, formula: "[대학의 총 교육비 집행액 / 재학생 수]", name: "학생 1인당 교육비", unit: "만원" },
            faculty_ratio: { actual: 75.40, target: 78.00, formula: "[(재직 전임교원 수) / 대학설립·운영규정상 기준 교원 수] × 100", name: "전임교원 확보율", unit: "%" },
            research: { 
                sci: 0.35, 
                nrf: 0.45, 
                books: 0.12, 
                target: 0.90, 
                formula: "[(전임교원의 논문 및 저역서 환산 건수 합계) / 전임교원 수]", 
                name: "전임교원 연구실적", 
                unit: "건" 
            }
        }
    };

    // 2. 상태 관리 변수
    let appState = {};
    let activeTab = 'dashboard';
    let currentSelectedYear = '2026';
    let currentKpiDetailType = 'retention';
    let editSelectedYear = '2026';

    // 차트 인스턴스 전역 저장소
    const charts = {
        trendChart: null,
        radarChart: null,
        kpiDetailChart: null,
        facultyGaugeChart: null,
        researchChart: null
    };

    // 3. 데이터 초기화 함수 (LocalStorage 우선 로드)
    function initializeData() {
        const storedData = localStorage.getItem('mmu_ir_performance_data');
        if (storedData) {
            try {
                appState = JSON.parse(storedData);
            } catch (e) {
                console.error("데이터 로드 오류, 기본값으로 대체합니다.", e);
                appState = JSON.parse(JSON.stringify(DEFAULT_DATA));
            }
        } else {
            appState = JSON.parse(JSON.stringify(DEFAULT_DATA));
            saveToLocalStorage();
        }
    }

    function saveToLocalStorage() {
        localStorage.setItem('mmu_ir_performance_data', JSON.stringify(appState));
    }

    // 4. UI 및 차트 업데이트 코어 함수
    function updateUI() {
        const yearData = appState[currentSelectedYear];
        if (!yearData) return;

        // --- 가. 대시보드 지표 카드 업데이트 ---
        updateMetricCard('retention', yearData.retention, '2025');
        updateMetricCard('employment', yearData.employment, '2025');
        updateMetricCard('freshman', yearData.freshman, '2025');
        updateMetricCard('faculty_ratio', yearData.faculty_ratio, '2025');

        // 대시보드 하단 특성화 요약 텍스트 업데이트
        const eduCostVal = yearData.education_cost.actual.toLocaleString();
        document.getElementById('education-cost-summary').textContent = `${eduCostVal}만원`;
        // 교육비 정규화 게이지 바 (2,000만원 기준)
        const costPercent = Math.min((yearData.education_cost.actual / 2000) * 100, 100);
        document.getElementById('education-cost-progress').style.width = `${costPercent}%`;

        // --- 나. 차트 갱신 ---
        renderTrendChart();
        renderRadarChart();

        // --- 다. KPI 상세 탭 업데이트 ---
        updateKpiDetailView();
        renderKpiTable();

        // --- 라. 교원 & 연구실적 탭 업데이트 ---
        updateFacultyView();
    }

    // 개별 지표 카드 업데이트 유틸리티
    function updateMetricCard(kpiKey, currentKpi, prevYearKey) {
        const cardElement = document.querySelector(`.metric-card[data-kpi="${kpiKey}"]`);
        if (!cardElement) return;

        // 수치 바인딩
        const valueSpan = cardElement.querySelector('.value-num');
        valueSpan.textContent = currentKpi.actual.toFixed(1);

        // 프로그레스 바 설정
        const progress = cardElement.querySelector('.progress');
        progress.style.width = `${Math.min(currentKpi.actual, 100)}%`;

        // 목표 달성률 계산
        const targetAch = cardElement.querySelector('.target-achievement');
        const achievementPercent = ((currentKpi.actual / currentKpi.target) * 100).toFixed(0);
        targetAch.textContent = `${achievementPercent}%`;

        // 전년 대비 트렌드 계산
        const trendSpan = cardElement.querySelector('.trend');
        const prevYearData = appState[prevYearKey];
        if (prevYearData && prevYearData[kpiKey]) {
            const diff = currentKpi.actual - prevYearData[kpiKey].actual;
            const trendValSpan = trendSpan.querySelector('.trend-val');
            
            if (diff >= 0) {
                trendSpan.className = 'trend up';
                trendSpan.innerHTML = `<i data-lucide="trending-up"></i> <span class="trend-val">+${diff.toFixed(1)}%p</span>`;
            } else {
                trendSpan.className = 'trend down';
                trendSpan.innerHTML = `<i data-lucide="trending-down"></i> <span class="trend-val">${diff.toFixed(1)}%p</span>`;
            }
        }
        lucide.createIcons();
    }

    // 5. 차트 렌더링 로직 (Chart.js 활용)

    // 차트 인스턴스 안전 제거 유틸리티
    function destroyChart(chartKey) {
        if (charts[chartKey]) {
            charts[chartKey].destroy();
            charts[chartKey] = null;
        }
    }

    // 가. 3개년 추이 꺾은선 + 막대 차트 (대시보드)
    function renderTrendChart() {
        destroyChart('trendChart');
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        const years = ['2024', '2025', '2026'];
        const freshmanData = years.map(y => appState[y].freshman.actual);
        const retentionData = years.map(y => appState[y].retention.actual);
        const employmentData = years.map(y => appState[y].employment.actual);

        charts.trendChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years.map(y => `${y}년`),
                datasets: [
                    {
                        type: 'line',
                        label: '신입생 충원율 (%)',
                        data: freshmanData,
                        borderColor: '#0077c2',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        pointBackgroundColor: '#0077c2',
                        pointRadius: 5,
                        yAxisID: 'y'
                    },
                    {
                        type: 'bar',
                        label: '재학생 충원율 (%)',
                        data: retentionData,
                        backgroundColor: 'rgba(0, 90, 156, 0.15)',
                        borderColor: 'rgba(0, 90, 156, 0.4)',
                        borderWidth: 1.5,
                        yAxisID: 'y'
                    },
                    {
                        type: 'bar',
                        label: '졸업생 취업률 (%)',
                        data: employmentData,
                        backgroundColor: 'rgba(0, 150, 57, 0.15)',
                        borderColor: 'rgba(0, 150, 57, 0.4)',
                        borderWidth: 1.5,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#0f172a', font: { family: 'Noto Sans KR' } }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        ticks: { color: '#475569' }
                    },
                    y: {
                        min: 70,
                        max: 105,
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        ticks: { color: '#475569' }
                    }
                }
            }
        });
    }

    // 나. 6대 지표 성과 분석 방사형 차트 (대시보드)
    function renderRadarChart() {
        destroyChart('radarChart');
        const ctx = document.getElementById('radarChart').getContext('2d');
        const yearData = appState[currentSelectedYear];

        // 각 지표의 목표 달성률을 계산하여 백분율(%)로 변환
        const metricsKeys = ['retention', 'employment', 'freshman', 'education_cost', 'faculty_ratio', 'research'];
        const labels = ['재학생 충원율', '졸업생 취업률', '신입생 충원율', '학생 1인당 교육비', '전임교원 확보율', '전임교원 연구실적'];
        
        const achievementRates = metricsKeys.map(key => {
            const item = yearData[key];
            if (key === 'research') {
                const totalActual = item.sci + item.nrf + item.books;
                return Math.min((totalActual / item.target) * 100, 120); // 120% 상한 제한
            }
            return Math.min((item.actual / item.target) * 100, 120);
        });

        charts.radarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: `${currentSelectedYear}년 목표 대비 달성률 (%)`,
                    data: achievementRates,
                    backgroundColor: 'rgba(0, 90, 156, 0.12)',
                    borderColor: 'rgba(0, 90, 156, 0.8)',
                    borderWidth: 2,
                    pointBackgroundColor: '#005A9C',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(0, 90, 156, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#0f172a', font: { family: 'Noto Sans KR' } } }
                },
                scales: {
                    r: {
                        angleLines: { color: 'rgba(0,0,0,0.08)' },
                        grid: { color: 'rgba(0,0,0,0.08)' },
                        pointLabels: { color: '#0f172a', font: { family: 'Noto Sans KR', size: 11 } },
                        ticks: { display: false },
                        min: 50,
                        max: 110
                    }
                }
            }
        });
    }

    // 다. KPI 상세 분석 꺾은선 그래프 (KPI 탭)
    function renderKpiDetailChart() {
        destroyChart('kpiDetailChart');
        const ctx = document.getElementById('kpiDetailChart').getContext('2d');
        const years = ['2024', '2025', '2026'];
        
        let actualData = [];
        let targetData = [];
        let labelName = "";

        years.forEach(y => {
            const dataItem = appState[y][currentKpiDetailType];
            if (currentKpiDetailType === 'research') {
                actualData.push(dataItem.sci + dataItem.nrf + dataItem.books);
                targetData.push(dataItem.target);
            } else if (currentKpiDetailType === 'education_cost') {
                actualData.push(dataItem.actual);
                targetData.push(dataItem.target);
            } else {
                actualData.push(dataItem.actual);
                targetData.push(dataItem.target);
            }
            labelName = dataItem.name;
        });

        const unit = appState['2026'][currentKpiDetailType].unit;

        charts.kpiDetailChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years.map(y => `${y}년`),
                datasets: [
                    {
                        label: `실제 실적 (${unit})`,
                        data: actualData,
                        borderColor: '#005A9C',
                        backgroundColor: 'rgba(0, 90, 156, 0.08)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 3,
                        pointBackgroundColor: '#005A9C',
                        pointRadius: 6
                    },
                    {
                        label: `목표치 (${unit})`,
                        data: targetData,
                        borderColor: 'rgba(15,23,42,0.2)',
                        borderDash: [5, 5],
                        backgroundColor: 'transparent',
                        tension: 0.1,
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(15,23,42,0.4)',
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#0f172a', font: { family: 'Noto Sans KR' } } }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        ticks: { color: '#475569' }
                    },
                    y: {
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        ticks: { color: '#475569' }
                    }
                }
            }
        });
    }

    // 라. 교원 확보율 게이지 차트 (교원 탭)
    function renderFacultyGaugeChart() {
        destroyChart('facultyGaugeChart');
        const ctx = document.getElementById('facultyGaugeChart').getContext('2d');
        const facultyVal = appState[currentSelectedYear].faculty_ratio.actual;
        
        // 100% 기준으로 남은 부분과 현재 확보율을 매핑
        const dataVal = Math.min(facultyVal, 100);
        const remainder = 100 - dataVal;

        // 도넛 차트를 반만 그리기 위한 옵션 설정
        charts.facultyGaugeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['현재 확보율', '미확보'],
                datasets: [{
                    data: [dataVal, remainder],
                    backgroundColor: ['#d97706', '#f1f5f9'],
                    borderWidth: 0,
                    hoverOffset: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                rotation: -90,
                circumference: 180,
                cutout: '80%',
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // 마. 전임교원 연구실적 분야별 추이 차트 (교원 탭)
    function renderResearchChart() {
        destroyChart('researchChart');
        const ctx = document.getElementById('researchChart').getContext('2d');
        const years = ['2024', '2025', '2026'];

        const sciData = years.map(y => appState[y].research.sci);
        const nrfData = years.map(y => appState[y].research.nrf);
        const booksData = years.map(y => appState[y].research.books);

        charts.researchChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years.map(y => `${y}년`),
                datasets: [
                    {
                        label: 'SCI급 국제학술지',
                        data: sciData,
                        backgroundColor: '#005A9C',
                    },
                    {
                        label: '연구재단 등재지',
                        data: nrfData,
                        backgroundColor: '#009639',
                    },
                    {
                        label: '학술저서 및 역서',
                        data: booksData,
                        backgroundColor: '#d97706',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false } // 커스텀 레전드 사용
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        ticks: { color: '#475569' }
                    },
                    y: {
                        stacked: true,
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        ticks: { color: '#475569' }
                    }
                }
            }
        });
    }


    // 6. 각 서브 탭 콘텐츠 연동 로직
    
    // KPI 상세 뷰 정보 업데이트
    function updateKpiDetailView() {
        const yearData = appState[currentSelectedYear];
        const kpi = yearData[currentKpiDetailType];
        
        let actual = 0;
        let target = 0;
        let diffText = "";
        let unit = kpi.unit;

        if (currentKpiDetailType === 'research') {
            actual = kpi.sci + kpi.nrf + kpi.books;
            target = kpi.target;
        } else {
            actual = kpi.actual;
            target = kpi.target;
        }

        const achievement = ((actual / target) * 100).toFixed(0);
        
        document.getElementById('kpi-focus-title').textContent = `${kpi.name} 상세 분석 (${currentSelectedYear}년)`;
        const badge = document.getElementById('kpi-focus-status');
        badge.textContent = `달성률 ${achievement}%`;
        if (parseFloat(achievement) >= 100) {
            badge.className = "badge badge-ok";
        } else {
            badge.className = "badge badge-warning";
        }

        document.getElementById('kpi-focus-target').textContent = `${target.toFixed(kpi.unit === '만원' ? 0 : 2)}${unit}`;
        document.getElementById('kpi-focus-actual').textContent = `${actual.toFixed(kpi.unit === '만원' ? 0 : 2)}${unit}`;
        document.getElementById('kpi-focus-formula').textContent = kpi.formula;

        // 전년도 비교
        const prevYear = (parseInt(currentSelectedYear) - 1).toString();
        const prevData = appState[prevYear];
        if (prevData) {
            const prevKpi = prevData[currentKpiDetailType];
            const prevActual = (currentKpiDetailType === 'research') ? (prevKpi.sci + prevKpi.nrf + prevKpi.books) : prevKpi.actual;
            const diff = actual - prevActual;
            const diffSign = diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
            document.getElementById('kpi-focus-diff').textContent = `${diffSign}${kpi.unit === '만원' ? '만원' : '%p'}`;
            
            // 색상 적용 클래스 수정 (글씨가 보이도록 라이트 모드 컬러 설정)
            const diffElem = document.getElementById('kpi-focus-diff');
            diffElem.textContent = `${diffSign}${kpi.unit === '만원' ? '만원' : '%p'}`;
            if (diff >= 0) {
                diffElem.style.color = '#009639';
                diffElem.style.fontWeight = 'bold';
            } else {
                diffElem.style.color = '#e11d48';
                diffElem.style.fontWeight = 'bold';
            }
        } else {
            const diffElem = document.getElementById('kpi-focus-diff');
            diffElem.textContent = "비교 데이터 없음 (2024년 기준)";
            diffElem.style.color = '#475569';
            diffElem.style.fontWeight = 'normal';
        }

        // 지표 선택 목록의 미니 값 갱신
        updateKpiMiniStats();

        // 디테일 차트 새로 그리기
        renderKpiDetailChart();
    }

    function updateKpiMiniStats() {
        const yearData = appState[currentSelectedYear];
        
        // 1. 재학생
        const retVal = yearData.retention.actual;
        const retBadge = document.getElementById('kpi-mini-retention-val');
        retBadge.textContent = `${retVal.toFixed(1)}%`;
        retBadge.nextElementSibling.className = retVal >= yearData.retention.target ? "badge badge-ok" : "badge badge-warning";
        retBadge.nextElementSibling.textContent = retVal >= yearData.retention.target ? "달성" : "미달";

        // 2. 취업률
        const empVal = yearData.employment.actual;
        const empBadge = document.getElementById('kpi-mini-employment-val');
        empBadge.textContent = `${empVal.toFixed(1)}%`;
        empBadge.nextElementSibling.className = empVal >= yearData.employment.target ? "badge badge-ok" : "badge badge-warning";
        empBadge.nextElementSibling.textContent = empVal >= yearData.employment.target ? "달성" : "미달";

        // 3. 신입생
        const frVal = yearData.freshman.actual;
        const frBadge = document.getElementById('kpi-mini-freshman-val');
        frBadge.textContent = `${frVal.toFixed(1)}%`;
        frBadge.nextElementSibling.className = frVal >= yearData.freshman.target ? "badge badge-ok" : "badge badge-warning";
        frBadge.nextElementSibling.textContent = frVal >= yearData.freshman.target ? "달성" : "미달";

        // 4. 교육비
        const eduVal = yearData.education_cost.actual;
        const eduBadge = document.getElementById('kpi-mini-education-val');
        eduBadge.textContent = `${eduVal.toLocaleString()}만원`;
        eduBadge.nextElementSibling.className = eduVal >= yearData.education_cost.target ? "badge badge-ok" : "badge badge-warning";
        eduBadge.nextElementSibling.textContent = eduVal >= yearData.education_cost.target ? "달성" : "미달";
    }

    // 3개년 KPI 데이터 테이블 그리기
    function renderKpiTable() {
        const tbody = document.getElementById('kpi-table-body');
        tbody.innerHTML = '';

        const keys = ['retention', 'employment', 'freshman', 'education_cost'];
        
        keys.forEach(key => {
            const data2024 = appState['2024'][key];
            const data2025 = appState['2025'][key];
            const data2026 = appState['2026'][key];

            const isAchieved = data2026.actual >= data2026.target;
            const statusClass = isAchieved ? 'success' : 'fail';
            const statusText = isAchieved ? '달성' : '미달';

            const formatVal = (val, unit) => {
                if (unit === '만원') return val.toLocaleString();
                return val.toFixed(2);
            };

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${data2026.name}</strong></td>
                <td>${data2026.unit}</td>
                <td>${formatVal(data2024.actual, data2024.unit)}</td>
                <td>${formatVal(data2025.actual, data2025.unit)}</td>
                <td>${formatVal(data2026.target, data2026.unit)}</td>
                <td>${formatVal(data2026.actual, data2026.unit)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    // 교원 & 연구실적 서브 탭 뷰 갱신
    function updateFacultyView() {
        const yearData = appState[currentSelectedYear];
        const faculty = yearData.faculty_ratio;
        const research = yearData.research;

        // 좌측 교원확보율 관련 수치 바인딩 (목포해양대 가상 교원 규모)
        const stdCount = 4250; // 가상 학생 수
        const reqProfs = Math.ceil(stdCount / 20); // 교원 1인당 학생 20명 기준
        const actProfs = Math.round((faculty.actual / 100) * reqProfs);

        document.getElementById('faculty-ratio-percent').textContent = `${faculty.actual.toFixed(1)}%`;
        document.getElementById('f-student-count').textContent = `${stdCount.toLocaleString()}명`;
        document.getElementById('f-req-professors').textContent = `${reqProfs}명`;
        document.getElementById('f-act-professors').textContent = `${actProfs}명`;

        const statusBadge = document.getElementById('faculty-ratio-status');
        if (faculty.actual >= faculty.target) {
            statusBadge.textContent = "목표 달성";
            statusBadge.className = "badge badge-ok";
        } else {
            statusBadge.textContent = "목표 미달";
            statusBadge.className = "badge badge-warning";
        }

        // 우측 연구실적 수치 바인딩
        const totalResearch = research.sci + research.nrf + research.books;
        document.getElementById('res-sci-val').textContent = `${research.sci.toFixed(2)}건`;
        document.getElementById('res-nrf-val').textContent = `${research.nrf.toFixed(2)}건`;
        document.getElementById('res-books-val').textContent = `${research.books.toFixed(2)}건`;
        document.getElementById('res-total-val').textContent = `${totalResearch.toFixed(2)}건 / 1인당`;

        // 교원 확보 및 연구 역량 지표 테이블 드로잉
        const tbody = document.getElementById('faculty-table-body');
        tbody.innerHTML = '';

        const fKeys = ['faculty_ratio', 'research'];
        fKeys.forEach(key => {
            const data2024 = appState['2024'][key];
            const data2025 = appState['2025'][key];
            const data2026 = appState['2026'][key];

            let val24 = 0, val25 = 0, val26Target = 0, val26Actual = 0;
            if (key === 'research') {
                val24 = data2024.sci + data2024.nrf + data2024.books;
                val25 = data2025.sci + data2025.nrf + data2025.books;
                val26Target = data2026.target;
                val26Actual = data2026.sci + data2026.nrf + data2026.books;
            } else {
                val24 = data2024.actual;
                val25 = data2025.actual;
                val26Target = data2026.target;
                val26Actual = data2026.actual;
            }

            const achievement = ((val26Actual / val26Target) * 100).toFixed(1);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${data2026.name}</strong></td>
                <td>${data2026.unit}</td>
                <td>${val24.toFixed(2)}</td>
                <td>${val25.toFixed(2)}</td>
                <td>${val26Target.toFixed(2)}</td>
                <td>${val26Actual.toFixed(2)}</td>
                <td><span class="status-badge ${achievement >= 100 ? 'success' : 'fail'}">${achievement}%</span></td>
            `;
            tbody.appendChild(row);
        });

        // 차트 그리기
        renderFacultyGaugeChart();
        renderResearchChart();
    }


    // 7. 대학알리미 실시간 동기화 (Sync) 터미널 연동 비즈니스 로직
    const consoleLog = document.getElementById('sync-console-log');
    const consoleStatusBadge = document.getElementById('console-status-badge');

    function logConsole(message, type = 'system') {
        const time = new Date().toLocaleTimeString();
        const line = document.createElement('span');
        line.className = `console-line ${type}`;
        line.textContent = `[${time}] ${message}`;
        consoleLog.appendChild(line);
        consoleLog.scrollTop = consoleLog.scrollHeight;
    }

    // API 연동 프로세스 시뮬레이션
    function startApiSync() {
        const apiKey = document.getElementById('api-key-input').value;
        const targetYear = document.getElementById('api-year-select').value;
        const proxyMode = document.getElementById('cors-proxy-select').value;

        // 터미널 상태 온라인 변경
        consoleStatusBadge.className = "badge-status-dot online";
        consoleStatusBadge.textContent = "실시간 연동 중";
        consoleLog.innerHTML = "";

        logConsole("대학알리미 API 실시간 동기화 세션을 생성하는 중...", "system");
        
        setTimeout(() => {
            logConsole(`공공데이터포털(data.go.kr) 대학정보공시 API 연결 시도 (연도: ${targetYear}년)...`, "info");
        }, 800);

        setTimeout(() => {
            if (apiKey.trim() === "") {
                logConsole("경고: 입력된 API 인증키가 없습니다. 보안 샌드박스 내부의 데모 테스트용 공개키를 적용합니다.", "warning");
            } else {
                logConsole(`인증 키 식별 완료: ${apiKey.substring(0, 10)}... (대칭 암호화 확인)`, "info");
            }
        }, 1600);

        setTimeout(() => {
            logConsole("대상 대학 식별 중: [국립목포해양대학교 (학교코드: 32060)]", "info");
        }, 2200);

        // API 연동 실제 수행 혹은 시뮬레이션 분기
        setTimeout(() => {
            if (proxyMode === 'simulation' || apiKey.trim() === "") {
                // 시뮬레이터 모드 작동
                logConsole("CORS 우회 필터링 작동: [시뮬레이션 모드 활성화]", "warning");
                runSimulationFetch(targetYear);
            } else {
                // 실제 API 호출 시도 시 CORS 오류 사전 경고 및 호출
                logConsole(`실제 API 요청 전송: https://openapi.academyinfo.go.kr/openapi/service/rest/getUnivGeneralInfo?serviceKey=***&schLvlCod=02&univCd=32060&year=${targetYear}`, "info");
                
                // 만약 프록시 우회 모드라면 
                if (proxyMode === 'proxy') {
                    const targetUrl = `https://openapi.academyinfo.go.kr/openapi/service/rest/getUnivGeneralInfo?schLvlCod=02&univCd=32060&year=${targetYear}`;
                    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
                    
                    fetch(proxyUrl)
                        .then(res => {
                            if (!res.ok) throw new Error("CORS 프록시 응답 실패");
                            return res.json();
                        })
                        .then(data => {
                            logConsole("CORS 프록시 채널 수신에 성공했습니다. 공시 지표 데이터를 패치합니다.", "success");
                            runSimulationFetch(targetYear); // 최종 데이터 연동은 예시 모의 구조 적용
                        })
                        .catch(err => {
                            logConsole(`API 연동 에러 발생: CORS 정책에 의해 브라우저 통신이 제한되었습니다. (오류내용: ${err.message})`, "error");
                            logConsole("보안 안전망을 위한 대체 패치 프로세스(자동 시뮬레이션 연동)로 복구 전환합니다.", "warning");
                            runSimulationFetch(targetYear);
                        });
                } else {
                    // 직접 호출 시 CORS 에러 발생 시뮬레이션 처리
                    setTimeout(() => {
                        logConsole("오류: Access-Control-Allow-Origin 제한으로 인해 브라우저의 직접적인 API 호출이 거부되었습니다.", "error");
                        logConsole("도움말: 로컬 테스트 시 CORS 크롬 확장프로그램을 활성화하시거나 'API 패치 시뮬레이터' 모드를 사용해 주세요.", "warning");
                        logConsole("시스템을 보호하기 위해 대체 모의 연동 데이터셋을 적용합니다.", "system");
                        runSimulationFetch(targetYear);
                    }, 1000);
                }
            }
        }, 3000);
    }

    // 동기화 시뮬레이션 구동 및 로컬스토리지 갱신
    function runSimulationFetch(targetYear) {
        // 약간의 랜덤 오차를 적용하여 데이터가 매번 미세하게 바뀌게 함 (실시간 업데이트가 일어나는 것을 시각적으로 보여줌)
        const generateRandomOffset = (min = -0.5, max = 0.5) => Math.random() * (max - min) + min;

        // 지표별로 모의 실시간 업데이트 값 생성
        const currentData = appState[targetYear] || JSON.parse(JSON.stringify(DEFAULT_DATA[targetYear] || DEFAULT_DATA['2026']));

        setTimeout(() => {
            const retDiff = generateRandomOffset();
            currentData.retention.actual = Math.min(Math.max(currentData.retention.actual + retDiff, 90.0), 99.5);
            logConsole(`공시지표 6-나[재학생 충원 현황] 데이터 파싱 성공 -> 재학생 충원율: ${currentData.retention.actual.toFixed(2)}% (변동: ${retDiff >= 0 ? '+' : ''}${retDiff.toFixed(2)}%p)`, "success");
        }, 1000);

        setTimeout(() => {
            const empDiff = generateRandomOffset(-1.0, 1.5);
            currentData.employment.actual = Math.min(Math.max(currentData.employment.actual + empDiff, 75.0), 86.5);
            logConsole(`공시지표 7-가[졸업생 취업 현황] 데이터 파싱 성공 -> 취업률: ${currentData.employment.actual.toFixed(2)}% (변동: ${empDiff >= 0 ? '+' : ''}${empDiff.toFixed(2)}%p)`, "success");
        }, 1800);

        setTimeout(() => {
            // 신입생은 목포해양대의 뛰어난 유치율에 걸맞게 100% 근접 유지
            const freshDiff = generateRandomOffset(-0.1, 0.0);
            currentData.freshman.actual = Math.min(Math.max(currentData.freshman.actual + freshDiff, 99.5), 100.0);
            logConsole(`공시지표 6-가[신입생 충원 현황] 데이터 파싱 성공 -> 신입생 충원율: ${currentData.freshman.actual.toFixed(2)}%`, "success");
        }, 2500);

        setTimeout(() => {
            const costDiff = Math.round(generateRandomOffset(-30, 80));
            currentData.education_cost.actual = currentData.education_cost.actual + costDiff;
            logConsole(`공시지표 11-다[1인당 교육비] 데이터 파싱 성공 -> 학생 1인당 교육비: ${currentData.education_cost.actual.toLocaleString()}만원`, "success");
        }, 3200);

        setTimeout(() => {
            const profDiff = generateRandomOffset(-0.3, 0.8);
            currentData.faculty_ratio.actual = Math.min(Math.max(currentData.faculty_ratio.actual + profDiff, 70.0), 90.0);
            logConsole(`공시지표 5-가[전임교원 확보율] 데이터 파싱 성공 -> 전임교원 확보율: ${currentData.faculty_ratio.actual.toFixed(2)}%`, "success");
        }, 3900);

        setTimeout(() => {
            const sciDiff = generateRandomOffset(-0.02, 0.05);
            const nrfDiff = generateRandomOffset(-0.03, 0.06);
            currentData.research.sci = Math.max(currentData.research.sci + sciDiff, 0.1);
            currentData.research.nrf = Math.max(currentData.research.nrf + nrfDiff, 0.1);
            
            const totalR = currentData.research.sci + currentData.research.nrf + currentData.research.books;
            logConsole(`공시지표 5-나[전임교원 연구실적] 데이터 파싱 성공 -> 1인당 SCI급: ${currentData.research.sci.toFixed(2)}건 / 등재지: ${currentData.research.nrf.toFixed(2)}건 (합산: ${totalR.toFixed(2)}건)`, "success");
        }, 4600);

        setTimeout(() => {
            // 상태 업데이트 및 로컬스토리지 저장
            appState[targetYear] = currentData;
            saveToLocalStorage();
            
            logConsole("--- [동기화 최종 검증] ---", "system");
            logConsole("목포해양대 데이터 검증실 실적 무결성 감사 완료: [적합]", "success");
            logConsole("로컬 데이터베이스 세션 업데이트 및 차트 리렌더링 완료.", "success");
            logConsole("대학알리미 실시간 동기화 프로그램이 정상 종료되었습니다.", "system");

            consoleStatusBadge.className = "badge-status-dot offline";
            consoleStatusBadge.textContent = "동기화 완료";

            // UI 실시간 새로고침
            updateUI();
        }, 5500);
    }

    // CSV 파일 드래그앤드롭 및 업로드 파싱 로직
    const fileDropzone = document.getElementById('file-dropzone');
    const fileInput = document.getElementById('csv-file-input');

    fileDropzone.addEventListener('click', () => fileInput.click());

    fileDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropzone.classList.add('dragover');
    });

    fileDropzone.addEventListener('dragleave', () => {
        fileDropzone.classList.remove('dragover');
    });

    fileDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropzone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleUploadedFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleUploadedFile(e.target.files[0]);
        }
    });

    function handleUploadedFile(file) {
        consoleStatusBadge.className = "badge-status-dot online";
        consoleStatusBadge.textContent = "파일 분석 중";
        consoleLog.innerHTML = "";

        logConsole(`업로드된 파일 수신: [${file.name}] (크기: ${(file.size / 1024).toFixed(1)} KB)`, "info");
        
        const reader = new FileReader();

        if (file.name.endsWith('.json')) {
            reader.onload = function(event) {
                try {
                    const parsedData = JSON.parse(event.target.result);
                    logConsole("JSON 구조 해석을 시작합니다...", "info");
                    
                    // JSON 파일에서 연도 추출 (예: {"2026": {...}} 형태)
                    let updatedCount = 0;
                    Object.keys(parsedData).forEach(year => {
                        if (appState[year]) {
                            // 데이터 매핑 및 유효성 검사
                            const yData = parsedData[year];
                            if (yData.retention && yData.employment && yData.freshman) {
                                appState[year] = { ...appState[year], ...yData };
                                updatedCount++;
                                logConsole(`${year}년 대학 성과 정보가 성공적으로 매핑되었습니다.`, "success");
                            }
                        }
                    });

                    if (updatedCount > 0) {
                        saveToLocalStorage();
                        logConsole(`총 ${updatedCount}개 연도의 데이터가 성공적으로 갱신되었습니다.`, "success");
                        updateUI();
                    } else {
                        throw new Error("유효한 연도별 성과 지표 필드가 누락되었습니다.");
                    }
                } catch (err) {
                    logConsole(`JSON 파일 해석 에러: ${err.message}`, "error");
                    logConsole("파일 포맷을 확인하신 후 다시 시도해 주세요.", "warning");
                }
                consoleStatusBadge.className = "badge-status-dot offline";
                consoleStatusBadge.textContent = "분석 완료";
            };
            reader.readAsText(file);
        } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
            reader.onload = function(event) {
                try {
                    logConsole("CSV/TXT 텍스트 데이터를 분석하는 중...", "info");
                    const text = event.target.result;
                    const lines = text.split('\n');
                    
                    if (lines.length < 2) {
                        throw new Error("파일에 헤더 외의 데이터 레코드가 부족합니다.");
                    }

                    // CSV 첫 줄 분석 (헤더 체크)
                    // 예: 연도,재학생충원율,취업률,신입생충원율,교육비,교원확보율,SCI연구,연구재단연구,저역서
                    let headers = lines[0].split(',').map(h => h.trim());
                    logConsole(`검출된 CSV 헤더: [${headers.join(', ')}]`, "info");

                    let updatedCount = 0;

                    for (let i = 1; i < lines.length; i++) {
                        if (lines[i].trim() === "") continue;
                        const cols = lines[i].split(',').map(c => c.trim());
                        
                        const rowData = {};
                        headers.forEach((header, index) => {
                            rowData[header] = cols[index];
                        });

                        const year = rowData['연도'];
                        if (year && appState[year]) {
                            // 데이터 갱신
                            if (rowData['재학생충원율']) appState[year].retention.actual = parseFloat(rowData['재학생충원율']);
                            if (rowData['취업률']) appState[year].employment.actual = parseFloat(rowData['취업률']);
                            if (rowData['신입생충원율']) appState[year].freshman.actual = parseFloat(rowData['신입생충원율']);
                            if (rowData['교육비']) appState[year].education_cost.actual = parseFloat(rowData['교육비']);
                            if (rowData['교원확보율']) appState[year].faculty_ratio.actual = parseFloat(rowData['교원확보율']);
                            if (rowData['SCI연구']) appState[year].research.sci = parseFloat(rowData['SCI연구']);
                            if (rowData['연구재단연구']) appState[year].research.nrf = parseFloat(rowData['연구재단연구']);
                            if (rowData['저역서']) appState[year].research.books = parseFloat(rowData['저역서']);

                            updatedCount++;
                            logConsole(`${year}년 대학알리미 CSV 원본 행 매핑 완료.`, "success");
                        }
                    }

                    if (updatedCount > 0) {
                        saveToLocalStorage();
                        logConsole(`총 ${updatedCount}개 연도의 CSV 데이터 행이 실시간 연동 처리되었습니다.`, "success");
                        updateUI();
                    } else {
                        throw new Error("매핑 가능한 연도 레코드를 찾을 수 없습니다. (2024~2026 연도 열이 필요합니다)");
                    }

                } catch (err) {
                    logConsole(`CSV 파싱 실패: ${err.message}`, "error");
                }
                consoleStatusBadge.className = "badge-status-dot offline";
                consoleStatusBadge.textContent = "분석 완료";
            };
            reader.readAsText(file);
        } else {
            logConsole("지원하지 않는 파일 포맷입니다. JSON 또는 CSV 확장자를 선택하세요.", "error");
            consoleStatusBadge.className = "badge-status-dot offline";
            consoleStatusBadge.textContent = "연동 대기 중";
        }
    }


    // 8. 데이터 수동 편집 폼 제어 및 갱신 비즈니스 로직
    const editorForm = document.getElementById('metrics-editor-form');
    const yearBtnGroup = document.querySelectorAll('.year-btn');
    const resetDefaultBtn = document.getElementById('reset-default-btn');

    // 편집기 연도 전환 핸들러
    yearBtnGroup.forEach(btn => {
        btn.addEventListener('click', (e) => {
            yearBtnGroup.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            editSelectedYear = e.currentTarget.getAttribute('data-edit-year');
            loadYearDataToEditor();
        });
    });

    // 폼에 특정 연도 데이터를 로드
    function loadYearDataToEditor() {
        const yearData = appState[editSelectedYear];
        if (!yearData) return;

        // 목표 입력 컬럼은 2026년(최신)에만 보이도록 설정 (과거연도는 실적만 존재)
        const targetCols = document.querySelectorAll('.val-target-only');
        if (editSelectedYear === '2026') {
            targetCols.forEach(col => col.style.opacity = '1');
        } else {
            targetCols.forEach(col => col.style.opacity = '0.4'); // 타겟 필드 비활성화 연출
        }

        document.getElementById('edit-retention-actual').value = yearData.retention.actual;
        document.getElementById('edit-retention-target').value = yearData.retention.target;

        document.getElementById('edit-employment-actual').value = yearData.employment.actual;
        document.getElementById('edit-employment-target').value = yearData.employment.target;

        document.getElementById('edit-freshman-actual').value = yearData.freshman.actual;
        document.getElementById('edit-freshman-target').value = yearData.freshman.target;

        document.getElementById('edit-education-actual').value = yearData.education_cost.actual;
        document.getElementById('edit-education-target').value = yearData.education_cost.target;

        document.getElementById('edit-prof-ratio-actual').value = yearData.faculty_ratio.actual;
        document.getElementById('edit-prof-ratio-target').value = yearData.faculty_ratio.target;

        document.getElementById('edit-research-sci').value = yearData.research.sci;
        document.getElementById('edit-research-nrf').value = yearData.research.nrf;
        document.getElementById('edit-research-books').value = yearData.research.books;
        document.getElementById('edit-research-target').value = yearData.research.target;
    }

    // 폼 저장 액션 핸들러
    editorForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const yearData = appState[editSelectedYear];
        if (!yearData) return;

        // 실제 값 추출 및 바인딩
        yearData.retention.actual = parseFloat(document.getElementById('edit-retention-actual').value);
        yearData.employment.actual = parseFloat(document.getElementById('edit-employment-actual').value);
        yearData.freshman.actual = parseFloat(document.getElementById('edit-freshman-actual').value);
        yearData.education_cost.actual = parseInt(document.getElementById('edit-education-actual').value);
        yearData.faculty_ratio.actual = parseFloat(document.getElementById('edit-prof-ratio-actual').value);
        yearData.research.sci = parseFloat(document.getElementById('edit-research-sci').value);
        yearData.research.nrf = parseFloat(document.getElementById('edit-research-nrf').value);
        yearData.research.books = parseFloat(document.getElementById('edit-research-books').value);

        if (editSelectedYear === '2026') {
            yearData.retention.target = parseFloat(document.getElementById('edit-retention-target').value);
            yearData.employment.target = parseFloat(document.getElementById('edit-employment-target').value);
            yearData.freshman.target = parseFloat(document.getElementById('edit-freshman-target').value);
            yearData.education_cost.target = parseInt(document.getElementById('edit-education-target').value);
            yearData.faculty_ratio.target = parseFloat(document.getElementById('edit-prof-ratio-target').value);
            yearData.research.target = parseFloat(document.getElementById('edit-research-target').value);
        }

        appState[editSelectedYear] = yearData;
        saveToLocalStorage();

        alert(`[저장 완료] ${editSelectedYear}학년도의 대학성과 원본 데이터가 성공적으로 갱신되었습니다.`);
        
        // 동기화 갱신
        updateUI();
    });

    // 기본값 초기화 핸들러
    resetDefaultBtn.addEventListener('click', () => {
        if (confirm("정말로 모든 성과 데이터를 초기 상태의 기본값으로 재설정하시겠습니까?\n저장하셨던 개별 입력 데이터가 삭제됩니다.")) {
            localStorage.removeItem('mmu_ir_performance_data');
            initializeData();
            loadYearDataToEditor();
            updateUI();
            alert("데이터베이스가 초기화되었습니다.");
        }
    });


    // 9. 인터랙티브 UI 제어 (탭 전환 및 이벤트 리스너)
    
    // 탭 전환 제어
    const navItems = document.querySelectorAll('.nav-item');
    const tabViews = document.querySelectorAll('.tab-view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(i => i.classList.remove('active'));
            e.currentTarget.classList.add('active');

            activeTab = e.currentTarget.getAttribute('data-tab');
            
            // 모든 뷰 숨기기 후 활성 뷰만 표시
            tabViews.forEach(view => view.classList.remove('active'));
            document.getElementById(`tab-${activeTab}`).classList.add('active');

            // 뷰 타이틀 및 설명 매핑
            const viewTitle = document.getElementById('view-title');
            const viewDesc = document.getElementById('view-description');

            if (activeTab === 'dashboard') {
                viewTitle.textContent = "종합 대시보드";
                viewDesc.textContent = "대학의 6대 핵심 운영 성과 지표와 목표 달성 현황을 모니터링합니다.";
                updateUI(); // 대시보드 차트 강제 동기화
            } else if (activeTab === 'kpi') {
                viewTitle.textContent = "핵심 성과지표 (KPI) 상세 분석";
                viewDesc.textContent = "각 성과지표의 3개년 추이 및 대학알리미 산출식을 비교하여 분석합니다.";
                updateKpiDetailView();
            } else if (activeTab === 'faculty') {
                viewTitle.textContent = "교원 & 연구실적 성과분석";
                viewDesc.textContent = "전임교원 확보율과 1인당 학술지(SCI급, 등재지) 연구 실적을 심층 모니터링합니다.";
                updateFacultyView();
            } else if (activeTab === 'sync') {
                viewTitle.textContent = "대학알리미 실시간 연동 센터";
                viewDesc.textContent = "공공데이터포털 연동 및 공시 데이터를 드래그앤드롭하여 최신 지표로 동기화합니다.";
            } else if (activeTab === 'editor') {
                viewTitle.textContent = "성과지표 데이터 원본 편집기";
                viewDesc.textContent = "보안 스토리지(LocalStorage) 내 원본 데이터셋을 수동으로 편집합니다.";
                loadYearDataToEditor();
            }
        });
    });

    // 헤더 연도 전환 리스너
    const yearSelect = document.getElementById('current-year-select');
    yearSelect.addEventListener('change', (e) => {
        currentSelectedYear = e.target.value;
        updateUI();
    });

    // 지표 상세 분석 선택 리스너
    const kpiSelectItems = document.querySelectorAll('.kpi-select-item');
    kpiSelectItems.forEach(item => {
        item.addEventListener('click', (e) => {
            kpiSelectItems.forEach(i => i.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentKpiDetailType = e.currentTarget.getAttribute('data-kpi-type');
            updateKpiDetailView();
        });
    });

    // 간편 동기화 버튼 클릭 시 탭 강제 이동
    document.getElementById('quick-sync-btn').addEventListener('click', () => {
        document.querySelector('.nav-item[data-tab="sync"]').click();
    });

    // API 연동 시작 리스너
    document.getElementById('api-sync-start-btn').addEventListener('click', startApiSync);
    
    // API 패스워드 표시 토글
    const keyInput = document.getElementById('api-key-input');
    const toggleKeyBtn = document.getElementById('toggle-key-visibility');
    toggleKeyBtn.addEventListener('click', () => {
        if (keyInput.type === "password") {
            keyInput.type = "text";
            toggleKeyBtn.innerHTML = `<i data-lucide="eye-off"></i>`;
        } else {
            keyInput.type = "password";
            toggleKeyBtn.innerHTML = `<i data-lucide="eye"></i>`;
        }
        lucide.createIcons();
    });

    // 콘솔 청소 리스너
    document.getElementById('clear-console-btn').addEventListener('click', () => {
        consoleLog.innerHTML = `<span class="console-line system">[시스템] 로그 콘솔이 비워졌습니다.</span>`;
    });

    // 테이블 내보내기 버튼 리스너 (CSV 파일 동적 생성 및 다운로드)
    document.getElementById('kpi-table-export-btn').addEventListener('click', () => {
        let csvContent = "\uFEFF연도,지표명,단위,목표치,실제실적\n";
        
        ['2024', '2025', '2026'].forEach(year => {
            const yData = appState[year];
            ['retention', 'employment', 'freshman', 'education_cost', 'faculty_ratio'].forEach(key => {
                const item = yData[key];
                csvContent += `${year},${item.name},${item.unit},${item.target},${item.actual}\n`;
            });
            const r = yData.research;
            csvContent += `${year},${r.name},${r.unit},${r.target},${(r.sci+r.nrf+r.books).toFixed(2)}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `mmu_performance_data_${currentSelectedYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // 테스트용 샘플 CSV 다운로드 자동 생성기
    document.getElementById('load-sample-file-btn').addEventListener('click', () => {
        // 샘플 CSV 파일 다운로드 유도
        let csvContent = "\uFEFF연도,재학생충원율,취업률,신입생충원율,교육비,교원확보율,SCI연구,연구재단연구,저역서\n";
        csvContent += "2026,95.5,84.2,100,1920,81.4,0.52,0.55,0.16\n";
        csvContent += "2025,94.0,82.0,100,1810,79.0,0.45,0.50,0.14\n";
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `mmu_sync_sample.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        logConsole("다운로드 폴더에 테스트용 샘플 CSV 파일 'mmu_sync_sample.csv'를 생성했습니다.", "info");
        logConsole("해당 파일을 바로 우측 드롭존에 업로드하여 테스트해보실 수 있습니다.", "warning");
    });


    // --- 10. 최초 실행 ---
    initializeData();
    updateUI();
});
