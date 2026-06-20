/**
 * 국립목포해양대학교 대학 경쟁력 비교분석기 (MMU Comparator)
 * 모바일 비즈니스 로직, 데이터셋 및 차트/시뮬레이터 제어 스크립트
 */

document.addEventListener('DOMContentLoaded', () => {
    // Lucide 아이콘 초기화
    lucide.createIcons();

    // 1. 6대 국립대학 비교 통계 데이터셋 (2025/2026 대학알리미 표준화 자료)
    const UNIV_DATA = {
        mmu: {
            name: "국립목포해양대학교",
            short: "목포해양대",
            facultyCount: 125,
            researchFunding: 8500,     // 1인당 연구비 (만원)
            sciPapers: 0.48,           // 1인당 SCI급 논문 (건)
            nrfPapers: 0.52,           // 1인당 국내등재지 논문 (건)
            books: 0.14,               // 1인당 저서 및 역서 (건)
            employment: 83.10,         // 졸업생 취업률 (%)
            educationCost: 1850,       // 학생 1인당 교육비 (만원)
            freshmanRatio: 100.00,     // 신입생 충원율 (%)
            retentionRatio: 94.20,     // 재학생 충원율 (%)
            color: "rgba(0, 90, 156, 1)",
            colorLight: "rgba(0, 90, 156, 0.2)"
        },
        kmou: {
            name: "국립한국해양대학교",
            short: "한국해양대",
            facultyCount: 310,
            researchFunding: 12400,
            sciPapers: 0.58,
            nrfPapers: 0.62,
            books: 0.16,
            employment: 72.50,
            educationCost: 1980,
            freshmanRatio: 99.80,
            retentionRatio: 93.50,
            color: "rgba(0, 31, 63, 1)",
            colorLight: "rgba(0, 31, 63, 0.2)"
        },
        kit: {
            name: "국립금오공과대학교",
            short: "금오공대",
            facultyCount: 260,
            researchFunding: 9800,
            sciPapers: 0.62,
            nrfPapers: 0.50,
            books: 0.11,
            employment: 70.80,
            educationCost: 1790,
            freshmanRatio: 100.00,
            retentionRatio: 92.80,
            color: "rgba(217, 119, 6, 1)",
            colorLight: "rgba(217, 119, 6, 0.2)"
        },
        mnu: {
            name: "국립목포대학교",
            short: "목포대",
            facultyCount: 520,
            researchFunding: 6800,
            sciPapers: 0.38,
            nrfPapers: 0.58,
            books: 0.13,
            employment: 61.20,
            educationCost: 1620,
            freshmanRatio: 99.50,
            retentionRatio: 90.80,
            color: "rgba(0, 150, 57, 1)",
            colorLight: "rgba(0, 150, 57, 0.2)"
        },
        scnu: {
            name: "국립순천대학교",
            short: "순천대",
            facultyCount: 450,
            researchFunding: 7500,
            sciPapers: 0.44,
            nrfPapers: 0.60,
            books: 0.12,
            employment: 63.80,
            educationCost: 1680,
            freshmanRatio: 99.70,
            retentionRatio: 91.50,
            color: "rgba(99, 102, 241, 1)",
            colorLight: "rgba(99, 102, 241, 0.2)"
        },
        ksnu: {
            name: "국립군산대학교",
            short: "군산대",
            facultyCount: 340,
            researchFunding: 7100,
            sciPapers: 0.41,
            nrfPapers: 0.54,
            books: 0.15,
            employment: 62.40,
            educationCost: 1590,
            freshmanRatio: 99.10,
            retentionRatio: 91.20,
            color: "rgba(13, 148, 136, 1)",
            colorLight: "rgba(13, 148, 136, 0.2)"
        }
    };

    // 2. 상태 관리 변수
    let activeTab = 'home';
    let homeSelectedUniv = 'mmu';
    let researchFilter = 'funding';
    let matchUnivB = 'kmou';

    // 모의 시뮬레이터 실시간 수치 (목포해양대 전용)
    let simFunding = UNIV_DATA.mmu.researchFunding;
    let simSci = UNIV_DATA.mmu.sciPapers;

    // 차트 인스턴스 저장소
    const charts = {
        homeOverviewChart: null,
        researchCompareChart: null,
        matchupRadarChart: null
    };

    // 3. 차트 안전 파괴 유틸리티
    function destroyChart(chartKey) {
        if (charts[chartKey]) {
            charts[chartKey].destroy();
            charts[chartKey] = null;
        }
    }

    // 4. 탭 네비게이션 제어
    const tabItems = document.querySelectorAll('.app-tab-bar .tab-item');
    const tabViews = document.querySelectorAll('.tab-view');

    tabItems.forEach(item => {
        item.addEventListener('click', (e) => {
            tabItems.forEach(i => i.classList.remove('active'));
            e.currentTarget.classList.add('active');

            activeTab = e.currentTarget.getAttribute('data-tab');
            
            tabViews.forEach(v => v.classList.remove('active'));
            document.getElementById(`tab-${activeTab}`).classList.add('active');

            // 활성 탭 전환 시 차트 리드로잉 및 뷰 갱신
            if (activeTab === 'home') {
                renderHomeOverviewChart();
            } else if (activeTab === 'research') {
                renderResearchCompareChart();
                renderResearchTable();
            } else if (activeTab === 'matchup') {
                renderMatchupView();
            } else if (activeTab === 'simulator') {
                updateSimulatorView();
            }
        });
    });

    // 5. 홈 탭 (Home) 비즈니스 로직
    const univQuickCards = document.querySelectorAll('.univ-quick-card');
    
    univQuickCards.forEach(card => {
        card.addEventListener('click', (e) => {
            univQuickCards.forEach(c => c.classList.remove('active'));
            e.currentTarget.classList.add('active');

            homeSelectedUniv = e.currentTarget.getAttribute('data-univ');
            updateHomeStatsCard();
        });
    });

    // 퀵 선택 시 카드 텍스트 업데이트
    function updateHomeStatsCard() {
        const u = UNIV_DATA[homeSelectedUniv];
        if (!u) return;

        // 선택된 대학 지표 연동
        document.getElementById('home-stat-funding').textContent = `${u.researchFunding.toLocaleString()}만원`;
        document.getElementById('home-stat-sci').textContent = `${u.sciPapers.toFixed(2)}건`;
        document.getElementById('home-stat-employment').textContent = `${u.employment.toFixed(1)}%`;
        document.getElementById('home-stat-education').textContent = `${u.educationCost.toLocaleString()}만원`;

        // 6개 대학 간 순위 매기기
        updateHomeRankBadges();
    }

    function updateHomeRankBadges() {
        const univKeys = Object.keys(UNIV_DATA);
        const u = UNIV_DATA[homeSelectedUniv];

        const getRank = (key, valExtractor) => {
            const sorted = [...univKeys].sort((a, b) => valExtractor(UNIV_DATA[b]) - valExtractor(UNIV_DATA[a]));
            return sorted.indexOf(key) + 1;
        };

        const fundingRank = getRank(homeSelectedUniv, d => d.researchFunding);
        const sciRank = getRank(homeSelectedUniv, d => d.sciPapers);
        const empRank = getRank(homeSelectedUniv, d => d.employment);
        const eduRank = getRank(homeSelectedUniv, d => d.educationCost);

        const applyRankBadge = (elementId, rank) => {
            const elem = document.getElementById(elementId).nextElementSibling;
            elem.textContent = `국립대 ${rank}위`;
            elem.className = `rank-badge rank-${rank <= 2 ? rank : '3'}`;
        };

        applyRankBadge('home-stat-funding', fundingRank);
        applyRankBadge('home-stat-sci', sciRank);
        applyRankBadge('home-stat-employment', empRank);
        applyRankBadge('home-stat-education', eduRank);
    }

    // 홈화면 1인당 연구비 가로 막대 차트
    function renderHomeOverviewChart() {
        destroyChart('homeOverviewChart');
        const ctx = document.getElementById('homeOverviewChart').getContext('2d');

        const keys = ['mmu', 'kmou', 'kit', 'mnu', 'scnu', 'ksnu'];
        const labels = keys.map(k => UNIV_DATA[k].short);
        const data = keys.map(k => UNIV_DATA[k].researchFunding);
        const colors = keys.map(k => UNIV_DATA[k].color);

        charts.homeOverviewChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: "1인당 연구비 (만원)",
                    data: data,
                    backgroundColor: colors,
                    borderRadius: 6,
                    barThickness: 16
                }]
            },
            options: {
                indexAxis: 'y', // 가로 막대 차트
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { color: '#475569', font: { size: 10 } }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#0f172a', font: { size: 10, weight: 'bold' } }
                    }
                }
            }
        });
    }

    // 6. 연구 분석 탭 (Research) 비즈니스 로직
    const filterButtons = document.querySelectorAll('.filter-switch-row .filter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            researchFilter = e.currentTarget.getAttribute('data-filter');
            
            // 헤더 글씨 변경
            const titleElem = document.getElementById('research-chart-title');
            const descElem = document.getElementById('research-chart-desc');
            
            if (researchFilter === 'funding') {
                titleElem.textContent = "대학별 전임교원 1인당 연구비 비교";
                descElem.textContent = "단위: 만원 / 2026년 공시 기준";
            } else {
                titleElem.textContent = "대학별 1인당 학술지 논문 게재 실적";
                descElem.textContent = "단위: 건 (SCI급 국제학술지 및 국내등재지 합산)";
            }

            renderResearchCompareChart();
        });
    });

    // 연구비/논문 비교 분석 차트
    function renderResearchCompareChart() {
        destroyChart('researchCompareChart');
        const ctx = document.getElementById('researchCompareChart').getContext('2d');

        const keys = ['mmu', 'kmou', 'kit', 'mnu', 'scnu', 'ksnu'];
        const labels = keys.map(k => UNIV_DATA[k].short);

        if (researchFilter === 'funding') {
            const data = keys.map(k => UNIV_DATA[k].researchFunding);
            const colors = keys.map(k => k === 'mmu' ? 'rgba(0, 90, 156, 0.95)' : 'rgba(100, 116, 139, 0.4)');
            const borderColors = keys.map(k => k === 'mmu' ? 'rgba(0, 90, 156, 1)' : 'rgba(100, 116, 139, 0.8)');

            charts.researchCompareChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '1인당 연구비 (만원)',
                        data: data,
                        backgroundColor: colors,
                        borderColor: borderColors,
                        borderWidth: 1.5,
                        borderRadius: 6,
                        barThickness: 22
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: '#475569', font: { size: 10, weight: 'bold' } }
                        },
                        y: {
                            grid: { color: 'rgba(0,0,0,0.06)' },
                            ticks: { color: '#475569', font: { size: 10 } }
                        }
                    }
                }
            });
        } else {
            // 논문 실적 비교 (누적 세로 막대 차트: SCI급 + 국내등재지)
            const sciData = keys.map(k => UNIV_DATA[k].sciPapers);
            const nrfData = keys.map(k => UNIV_DATA[k].nrfPapers);

            charts.researchCompareChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'SCI급 국제학술지',
                            data: sciData,
                            backgroundColor: '#005A9C',
                            barThickness: 22
                        },
                        {
                            label: '연구재단 등재지',
                            data: nrfData,
                            backgroundColor: '#009639',
                            barThickness: 22
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            display: true,
                            position: 'top',
                            labels: { boxWidth: 12, font: { size: 9, family: 'Noto Sans KR' }, color: '#475569' } 
                        }
                    },
                    scales: {
                        x: {
                            stacked: true,
                            grid: { display: false },
                            ticks: { color: '#475569', font: { size: 10, weight: 'bold' } }
                        },
                        y: {
                            stacked: true,
                            grid: { color: 'rgba(0,0,0,0.06)' },
                            ticks: { color: '#475569', font: { size: 10 } }
                        }
                    }
                }
            });
        }
    }

    // 연구 통계 데이터 테이블 드로잉
    function renderResearchTable() {
        const tbody = document.getElementById('research-table-body');
        tbody.innerHTML = '';

        const keys = ['mmu', 'kmou', 'kit', 'mnu', 'scnu', 'ksnu'];
        
        keys.forEach(k => {
            const u = UNIV_DATA[k];
            const row = document.createElement('tr');
            
            // 목포해양대 행만 두껍게 연출
            if (k === 'mmu') {
                row.style.backgroundColor = 'rgba(0, 90, 156, 0.05)';
                row.style.fontWeight = 'bold';
            }

            row.innerHTML = `
                <td>${u.short}</td>
                <td>${u.researchFunding.toLocaleString()}만원</td>
                <td>${u.sciPapers.toFixed(2)}건</td>
                <td>${u.nrfPapers.toFixed(2)}건</td>
                <td>${u.books.toFixed(2)}건</td>
            `;
            tbody.appendChild(row);
        });
    }

    // 7. 1대1 매치 탭 (Matchup) 비즈니스 로직
    const matchSelectB = document.getElementById('match-univ-b');
    matchSelectB.addEventListener('change', (e) => {
        matchUnivB = e.target.value;
        renderMatchupView();
    });

    function renderMatchupView() {
        const uA = UNIV_DATA.mmu;
        const uB = UNIV_DATA[matchUnivB];
        if (!uA || !uB) return;

        // 가. 매치 스코어 보드 작성
        const board = document.getElementById('matchup-score-list');
        board.innerHTML = '';

        // 비교할 지표 구조 정의
        const compareMetrics = [
            { key: 'researchFunding', name: "1인당 연구비", unit: "만원", format: v => v.toLocaleString() },
            { key: 'sciPapers', name: "1인당 SCI급 논문", unit: "건", format: v => v.toFixed(2) },
            { key: 'employment', name: "졸업생 취업률", unit: "%", format: v => v.toFixed(1) },
            { key: 'educationCost', name: "학생 1인당 교육비", unit: "만원", format: v => v.toLocaleString() },
            { key: 'freshmanRatio', name: "신입생 충원율", unit: "%", format: v => v.toFixed(1) }
        ];

        let winsA = 0;
        let winsB = 0;

        compareMetrics.forEach(m => {
            const valA = uA[m.key];
            const valB = uB[m.key];

            let classA = "";
            let classB = "";

            if (valA > valB) {
                classA = "win";
                classB = "lose";
                winsA++;
            } else if (valA < valB) {
                classA = "lose";
                classB = "win";
                winsB++;
            } else {
                classA = "draw";
                classB = "draw";
            }

            const row = document.createElement('div');
            row.className = "score-row";
            row.innerHTML = `
                <div class="score-val ${classA}">${m.format(valA)}${m.unit}</div>
                <div class="score-lbl">${m.name}</div>
                <div class="score-val ${classB}">${m.format(valB)}${m.unit}</div>
            `;
            board.appendChild(row);
        });

        // 나. 강점/약점 피드백 카드 도출
        const strengthList = document.getElementById('strength-list');
        const weaknessList = document.getElementById('weakness-list');
        strengthList.innerHTML = '';
        weaknessList.innerHTML = '';

        // 강점 분석 텍스트 생성
        if (uA.employment > uB.employment) {
            strengthList.innerHTML += `<li><strong>졸업생 취업률 우위</strong> (${uA.employment.toFixed(1)}% vs ${uB.employment.toFixed(1)}%) - 해사 특성화 취업 네트워크 강점</li>`;
        }
        if (uA.freshmanRatio >= uB.freshmanRatio) {
            strengthList.innerHTML += `<li><strong>신입생 충원 충실도 우수</strong> (${uA.freshmanRatio.toFixed(1)}% vs ${uB.freshmanRatio.toFixed(1)}%) - 작지만 알찬 전문 특성화 대학 선호도</li>`;
        }
        if (uA.educationCost > uB.educationCost) {
            strengthList.innerHTML += `<li><strong>1인당 높은 교육 투자액</strong> (${uA.educationCost.toLocaleString()}만원 vs ${uB.educationCost.toLocaleString()}만원)</li>`;
        } else if (uA.researchFunding > uB.researchFunding) {
            strengthList.innerHTML += `<li><strong>1인당 연구비 우위 확보</strong> (${uA.researchFunding.toLocaleString()}만원 vs ${uB.researchFunding.toLocaleString()}만원)</li>`;
        }

        // 목포해양대 고유 강점 디폴트 추가 (가성비)
        const effA = uA.sciPapers / (uA.researchFunding / 10000); // 1억원당 SCI수
        const effB = uB.sciPapers / (uB.researchFunding / 10000);
        if (effA > effB) {
            strengthList.innerHTML += `<li><strong>연구비 대비 논문 수율(가성비) 우위</strong> - 한정된 자원으로 다수의 고효율 SCI 논문 게재</li>`;
        }

        // 약점 분석 텍스트 생성
        let hasWeakness = false;
        if (uA.researchFunding < uB.researchFunding) {
            weaknessList.innerHTML += `<li><strong>1인당 연구비 격차 극복 필요</strong> (${uA.researchFunding.toLocaleString()}만원 vs ${uB.researchFunding.toLocaleString()}만원) - 해양 융합 국책 연구 수주 활동 확대 필요</li>`;
            hasWeakness = true;
        }
        if (uA.sciPapers < uB.sciPapers) {
            weaknessList.innerHTML += `<li><strong>SCI급 국제학술지 게재 실적 보완</strong> (${uA.sciPapers.toFixed(2)}건 vs ${uB.sciPapers.toFixed(2)}건) - 국제공동연구 및 연구 장려금 확대 지원 필요</li>`;
            hasWeakness = true;
        }
        if (uA.educationCost < uB.educationCost) {
            weaknessList.innerHTML += `<li><strong>1인당 교육 재정 규모 확대 권장</strong> (${uA.educationCost.toLocaleString()}만원 vs ${uB.educationCost.toLocaleString()}만원)</li>`;
            hasWeakness = true;
        }

        if (!hasWeakness) {
            weaknessList.innerHTML = `<li>비교 대학 대비 핵심 5대 지표에서 약점이 발견되지 않았습니다.</li>`;
        }

        // 다. 방사형 레이더 차트 드로잉
        renderMatchupRadarChart(uA, uB);
    }

    function renderMatchupRadarChart(uA, uB) {
        destroyChart('matchupRadarChart');
        const ctx = document.getElementById('matchupRadarChart').getContext('2d');

        // 지표 표준화 백분율 계산 (비교군 6개 대학교 중 최대값 대비 비중)
        const maxFunding = 13000;
        const maxSci = 0.70;
        const maxEdu = 2100;

        const normalize = (val, max) => Math.min((val / max) * 100, 100);

        const scoresA = [
            normalize(uA.researchFunding, maxFunding),
            normalize(uA.sciPapers, maxSci),
            uA.employment, // 취업률은 비율 그대로 매핑
            normalize(uA.educationCost, maxEdu),
            uA.freshmanRatio
        ];

        const scoresB = [
            normalize(uB.researchFunding, maxFunding),
            normalize(uB.sciPapers, maxSci),
            uB.employment,
            normalize(uB.educationCost, maxEdu),
            uB.freshmanRatio
        ];

        const labels = ['1인당 연구비', '1인당 SCI 논문', '취업률', '1인당 교육비', '신입생 충원율'];

        charts.matchupRadarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: uA.short,
                        data: scoresA,
                        backgroundColor: 'rgba(0, 90, 156, 0.2)',
                        borderColor: 'rgba(0, 90, 156, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#005A9C'
                    },
                    {
                        label: uB.short,
                        data: scoresB,
                        backgroundColor: uB.colorLight,
                        borderColor: uB.color,
                        borderWidth: 2,
                        pointBackgroundColor: uB.color
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'top',
                        labels: { font: { size: 9, family: 'Noto Sans KR' }, color: '#475569' } 
                    }
                },
                scales: {
                    r: {
                        angleLines: { color: 'rgba(0,0,0,0.06)' },
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        pointLabels: { color: '#0f172a', font: { size: 10, family: 'Noto Sans KR', weight: 'bold' } },
                        ticks: { display: false },
                        min: 40,
                        max: 105
                    }
                }
            }
        });
    }

    // 8. 시뮬레이터 탭 (Simulator) 비즈니스 로직
    const sliderFunding = document.getElementById('sim-slider-funding');
    const sliderSci = document.getElementById('sim-slider-sci');

    sliderFunding.addEventListener('input', (e) => {
        simFunding = parseInt(e.target.value);
        document.getElementById('sim-val-funding').textContent = `${simFunding.toLocaleString()}만원`;
        updateSimulatorView();
    });

    sliderSci.addEventListener('input', (e) => {
        simSci = parseFloat(e.target.value);
        document.getElementById('sim-val-sci').textContent = `${simSci.toFixed(2)}건`;
        updateSimulatorView();
    });

    function updateSimulatorView() {
        // 가상 목포해양대 점수 계산
        // 가중치: 연구비(40%), SCI논문(45%), 등재지 및 저역서 등 고정치(15%)
        // 연구비 상한: 18,000만원, SCI 논문 상한: 1.0건
        const fundingScore = (simFunding / 18000) * 40;
        const sciScore = (simSci / 1.0) * 45;
        // 목포해양대 등재지(0.52) 및 저역서(0.14)에 따른 고정 가중치 점수
        const fixedScore = 15; 
        
        const mmuScore = Math.min(fundingScore + sciScore + fixedScore, 100);
        
        document.getElementById('sim-mmu-score').textContent = `${mmuScore.toFixed(1)}점`;
        document.getElementById('sim-mmu-score-bar').style.width = `${mmuScore}%`;

        // 타 대학 경쟁력 점수 계산 (고정 통계치)
        const calcUnivScore = (key) => {
            const u = UNIV_DATA[key];
            const fScr = (u.researchFunding / 18000) * 40;
            const sScr = (u.sciPapers / 1.0) * 45;
            // 각 대학 고유 등재지 및 저역서 기반 고정 15% 가중치 반영
            const fixScr = ((u.nrfPapers + u.books) / 0.8) * 15;
            return Math.min(fScr + sScr + fixScr, 100);
        };

        const scores = {
            mmu: mmuScore,
            kmou: calcUnivScore('kmou'),
            kit: calcUnivScore('kit'),
            mnu: calcUnivScore('mnu'),
            scnu: calcUnivScore('scnu'),
            ksnu: calcUnivScore('ksnu')
        };

        // 점수 기준으로 대학 정렬
        const sortedKeys = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
        
        // 랭킹 리스트 드로잉
        const rankList = document.getElementById('sim-ranking-list');
        rankList.innerHTML = '';

        sortedKeys.forEach((key, index) => {
            const isMmu = key === 'mmu';
            const uName = isMmu ? "국립목포해양대학교 (모의)" : UNIV_DATA[key].name;
            const uShort = isMmu ? "목포해양대 (가상)" : UNIV_DATA[key].short;
            const scr = scores[key];

            const row = document.createElement('div');
            row.className = isMmu ? "sim-rank-row mmu-row" : "sim-rank-row";
            row.innerHTML = `
                <span class="sim-rank-num">${index + 1}위</span>
                <span class="sim-rank-name">${uShort}</span>
                <span class="sim-rank-val">${scr.toFixed(1)}점</span>
            `;
            rankList.appendChild(row);
        });

        // 목포해양대 순위 배지 업데이트
        const mmuRank = sortedKeys.indexOf('mmu') + 1;
        const badge = document.getElementById('sim-mmu-rank-badge');
        badge.textContent = `목포해양대 ${mmuRank}위`;
        if (mmuRank === 1) {
            badge.className = "badge badge-accent rank-1";
            badge.style.backgroundColor = "rgba(217, 119, 6, 0.1)";
            badge.style.color = "#d97706";
        } else {
            badge.className = "badge badge-accent";
            badge.style.backgroundColor = "rgba(0, 90, 156, 0.1)";
            badge.style.color = "#005A9C";
        }
    }


    // --- 9. 최초 실행 시 시각화 호출 ---
    updateHomeStatsCard();
    renderHomeOverviewChart();
});
