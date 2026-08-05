/**
 * Amnt — Dashboard Page (Premium Light Theme — Optimized v2)
 */
import Chart from 'chart.js/auto';
import { auth } from '../services/auth.js';
import { kpi } from '../services/kpi.js';
import { marchesStore, societesStore, periodStore, preventifStore, pannesStore, reclamationsStore, equipementsStore } from '../services/store.js';

const formatDuration = (minutes, fallback = '—') => {
    if (minutes === null || minutes === undefined || isNaN(minutes)) return fallback;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
        return `${hrs}h ${mins}min`;
    }
    return `${mins}min`;
};

export function renderDashboard(container) {
    const user = auth.getCurrentUser();
    const currentAirportId = auth.getCurrentAirportId();

    // Greeting based on time of day
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const userName = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : '';

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 style="display: flex; align-items: center; gap: 0.625rem;">
                    <span style="font-size: 1.5rem;">📊</span>
                    Tableau de Bord
                </h1>
                <p id="dashboardSubtitle" class="mb-0">${greeting}${userName ? ', <strong style="color: #0f172a;">' + userName + '</strong>' : ''}. Aperçu des performances de maintenance.</p>
            </div>
            
            <div class="flex gap-3">
                <div class="form-group mb-0">
                    <select id="filterPeriod" class="form-control" style="min-width: 200px;">
                        <option value="all">Tout afficher (Année en cours)</option>
                        <optgroup label="Par Trimestre">
                            <option value="T1">Trimestre 1 (Jan - Mar)</option>
                            <option value="T2">Trimestre 2 (Avr - Juin)</option>
                            <option value="T3">Trimestre 3 (Juil - Sept)</option>
                            <option value="T4">Trimestre 4 (Oct - Déc)</option>
                        </optgroup>
                        <optgroup label="Par Mois">
                            <option value="01">Janvier</option><option value="02">Février</option><option value="03">Mars</option>
                            <option value="04">Avril</option><option value="05">Mai</option><option value="06">Juin</option>
                            <option value="07">Juillet</option><option value="08">Août</option><option value="09">Septembre</option>
                            <option value="10">Octobre</option><option value="11">Novembre</option><option value="12">Décembre</option>
                        </optgroup>
                    </select>
                </div>
                <div class="form-group mb-0">
                    <select id="societeFilter" class="form-control" style="min-width: 200px;">
                        <option value="all">Toutes les sociétés</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- KPI Cards: 2 rows of 3 -->
        <div id="kpiOverview" class="dash-kpi-grid mb-6">
            <!-- KPIs injected here -->
        </div>

        <!-- Interventions Alerts & SLO Row -->
        <div style="display: grid; grid-template-columns: 3fr 2fr; gap: 1rem; margin-bottom: 1rem; align-items: stretch;">
            <div class="card" style="display: flex; flex-direction: column; height: 340px; background: #ffffff;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                    <h3 style="font-size: 0.875rem; font-weight: 600; color: #374151; margin: 0; display: flex; align-items: center; gap: 0.375rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Alertes Interventions (Retards Planning)
                    </h3>
                    <span id="alertsCountBadge" style="font-size: 0.75rem; font-weight: 600; color: #ffffff; background: #dc2626; padding: 0.125rem 0.5rem; border-radius: 9999px; display: none;">0</span>
                </div>
                <div id="interventionsAlertsList" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; padding-right: 2px;">
                    <!-- Alerts list items or empty state will be injected here -->
                </div>
            </div>
            
            <div class="card" style="display: flex; flex-direction: column; height: 340px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                    <h3 style="font-size: 0.875rem; font-weight: 600; color: #374151; margin: 0; display: flex; align-items: center; gap: 0.375rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Conformité SLO
                    </h3>
                    <span id="sloPercentLabel" style="font-size: 0.6875rem; color: #94a3b8; font-weight: 500;"></span>
                </div>
                <div style="flex: 1; position: relative; display: flex; align-items: center; justify-content: center; height: 250px;">
                    <canvas id="slaChart"></canvas>
                    <div id="sloCenter" style="position: absolute; display: flex; flex-direction: column; align-items: center; pointer-events: none; transform: translateY(-12px);">
                        <span id="sloCenterValue" style="font-size: 1.75rem; font-weight: 700; color: #0f172a; line-height: 1;">—</span>
                        <span style="font-size: 0.625rem; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.125rem;">Conforme</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="card">
                <h3 style="font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.375rem;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Dernières Pannes
                </h3>
                <div id="recentPannes" style="display: flex; flex-direction: column; gap: 0.375rem; max-height: 200px; overflow-y: auto;"></div>
            </div>
            <div class="card">
                <h3 style="font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.375rem;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Dernières Réclamations
                </h3>
                <div id="recentReclamations" style="display: flex; flex-direction: column; gap: 0.375rem; max-height: 200px; overflow-y: auto;"></div>
            </div>
        </div>
    `;

    const societeFilter = document.getElementById('societeFilter');
    const filterPeriod = document.getElementById('filterPeriod');
    
    let sFilters = {};
    if (currentAirportId !== 'all') sFilters.airport_id = currentAirportId;
    
    const societes = societesStore.getAll(sFilters);
    societes.forEach(s => {
        const option = document.createElement('option');
        option.value = s.id;
        option.textContent = s.nom || s.raison_sociale;
        societeFilter.appendChild(option);
    });

    filterPeriod.value = periodStore.getPeriod();

    const getPeriodLabel = (periodVal, year) => {
        if (periodVal === 'all') return `Année ${year}`;
        if (periodVal.startsWith('T')) return `Trimestre ${periodVal.replace('T', '')} ${year}`;
        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        return `${months[parseInt(periodVal, 10) - 1]} ${year}`;
    };

    let slaChartInstance = null;

    const renderSkeletonKPIs = () => {
        const kpiContainer = document.getElementById('kpiOverview');
        kpiContainer.innerHTML = Array(6).fill(0).map(() => `
            <div class="kpi-card">
                <div class="skeleton" style="width: 40px; height: 40px; border-radius: 8px;"></div>
                <div class="kpi-content" style="flex: 1;">
                    <div class="skeleton" style="width: 60%; height: 22px; margin-bottom: 0.375rem;"></div>
                    <div class="skeleton" style="width: 40%; height: 12px;"></div>
                </div>
            </div>
        `).join('');
    };

    // Helper: trend arrow
    const trendArrow = (value, goodDirection = 'up') => {
        if (value === null || value === undefined) return '';
        const isGood = goodDirection === 'up' ? value >= 0 : value <= 0;
        const color = isGood ? '#059669' : '#dc2626';
        const arrow = value >= 0
            ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>`
            : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;
        return `<span style="display: inline-flex; align-items: center; gap: 0.125rem; font-size: 0.6875rem; font-weight: 600; color: ${color};">${arrow}${Math.abs(value)}%</span>`;
    };

    const renderKPIsAndCharts = () => {
        const kpiContainer = document.getElementById('kpiOverview');
        const activePeriod = periodStore.getPeriod();
        const activeSocieteId = societeFilter.value;
        const currentYear = new Date().getFullYear();

        renderSkeletonKPIs();

        setTimeout(() => {
            let periodStr = currentYear.toString();
            if (activePeriod !== 'all') {
                if (activePeriod.startsWith('T')) {
                    periodStr = `${currentYear}-Q${activePeriod.replace('T', '')}`;
                } else {
                    periodStr = `${currentYear}-${activePeriod}`;
                }
            }

            const filters = { period: periodStr, societeId: activeSocieteId };
            const resPRR = kpi.calculatePRR(currentAirportId, filters);
            const resMRT = kpi.calculateMRT(currentAirportId, filters);
            const resDisp = kpi.calculateDisponibilite(currentAirportId, filters);
            const resPannes = kpi.getVolumePannes(currentAirportId, filters);

            // Count preventive interventions
            let pFilters = {};
            if (currentAirportId && currentAirportId !== 'all') pFilters.airport_id = currentAirportId;
            const allPrev = preventifStore.getAll(pFilters).filter(inv => {
                if (activeSocieteId && activeSocieteId !== 'all' && inv.societe_id !== activeSocieteId) return false;
                return kpi.isDateInPeriod(inv.date_planifiee, periodStr);
            });
            const prevTotal = allPrev.length;
            const prevDone = allPrev.filter(i => i.statut === 'REALISEE').length;

            // Count active reclamations
            let rFilters = {};
            if (currentAirportId && currentAirportId !== 'all') rFilters.airport_id = currentAirportId;
            const allRec = reclamationsStore.getAll(rFilters);
            const activeRec = allRec.filter(r => {
                const s = r.statut || 'NOUVELLE';
                return s === 'NOUVELLE' || s === 'EN_COURS';
            });

            const finalPRR = resPRR.prr !== null ? `${resPRR.prr}%` : '—';
            const finalMRT = resMRT.mrt !== null ? formatDuration(resMRT.mrtMinutes) : '—';
            const finalDisp = resDisp.disponibilite !== null ? `${resDisp.disponibilite}%` : '—';

            kpiContainer.innerHTML = `
                <div class="kpi-card">
                    <div class="kpi-icon" style="color: #059669; background: #d1fae5;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value" style="color: #059669;">${finalPRR}</div>
                        <div class="kpi-label">Respect Planning (PRR)</div>
                    </div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-icon" style="color: #2563eb; background: #dbeafe;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value" style="color: #2563eb;">${finalMRT}</div>
                        <div class="kpi-label">Temps de Réaction (MRT)</div>
                    </div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-icon" style="color: #7c3aed; background: #ede9fe;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value" style="color: #7c3aed;">${finalDisp}</div>
                        <div class="kpi-label">Disponibilité Globale</div>
                    </div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-icon" style="color: #dc2626; background: #fee2e2;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value" style="color: #dc2626;">${resPannes.total}</div>
                        <div class="kpi-label">Pannes Enregistrées</div>
                    </div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-icon" style="color: #0891b2; background: #cffafe;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value" style="color: #0891b2;">${prevDone}<span style="font-size: 0.875rem; font-weight: 500; color: #94a3b8;">/${prevTotal}</span></div>
                        <div class="kpi-label">Interventions Préventives</div>
                    </div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-icon" style="color: #d97706; background: #fef3c7;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value" style="color: #d97706;">${activeRec.length}</div>
                        <div class="kpi-label">Réclamations Actives</div>
                    </div>
                </div>
            `;

            renderCharts(periodStr, activeSocieteId);
            renderRecentActivity();
        }, 200);
    };

    const renderCharts = (periodStr, societeId) => {
        if (slaChartInstance) slaChartInstance.destroy();

        // ─── CALCUL & RENDU DES ALERTES D'INTERVENTIONS ───
        let alertFilters = {};
        if (currentAirportId && currentAirportId !== 'all') alertFilters.airport_id = currentAirportId;
        const allInterventionsList = preventifStore.getAll(alertFilters);

        // Une intervention est en retard si date_planifiee < aujourd'hui et statut === 'PLANIFIEE'
        const todayStr = new Date().toISOString().split('T')[0];
        
        const retardInterventions = allInterventionsList.filter(inv => {
            if (societeId && societeId !== 'all' && inv.societe_id !== societeId) return false;
            return inv.statut === 'PLANIFIEE' && inv.date_planifiee < todayStr;
        });

        // Trier par date la plus ancienne en premier (plus urgent)
        retardInterventions.sort((a, b) => a.date_planifiee.localeCompare(b.date_planifiee));

        const alertsContainer = document.getElementById('interventionsAlertsList');
        const alertsBadge = document.getElementById('alertsCountBadge');
        
        if (retardInterventions.length > 0) {
            alertsBadge.textContent = retardInterventions.length;
            alertsBadge.style.display = 'inline-block';
            
            alertsContainer.innerHTML = retardInterventions.map(inv => {
                const eq = equipementsStore.getById(inv.equipement_id);
                const eqName = eq ? eq.nom_equipement : 'Équipement inconnu';
                const soc = societesStore.getById(inv.societe_id);
                const socName = soc ? (soc.nom || soc.raison_sociale) : 'Société inconnue';
                
                // Calculer le nombre de jours de retard
                const planDate = new Date(inv.date_planifiee);
                const today = new Date();
                const diffTime = today - planDate;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                let urgencyColor = '#d97706'; // orange si < 5 jours
                let urgencyBg = '#fef3c7';
                let borderCol = '#fcd34d';
                if (diffDays >= 5) {
                    urgencyColor = '#dc2626'; // rouge si >= 5 jours
                    urgencyBg = '#fee2e2';
                    borderCol = '#fecaca';
                }

                const dateFmt = new Date(inv.date_planifiee).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.625rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; transition: border-color 150ms;">
                        <div style="min-width: 0; flex: 1; padding-right: 0.5rem;">
                            <div style="font-weight: 600; font-size: 0.8125rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${eqName}</div>
                            <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.125rem;">
                                Par <strong>${socName}</strong> · Prévu le ${dateFmt}
                            </div>
                        </div>
                        <span style="font-size: 0.6875rem; font-weight: 700; color: ${urgencyColor}; background: ${urgencyBg}; border: 1px solid ${borderCol}; padding: 0.1875rem 0.5rem; border-radius: 6px; flex-shrink: 0; display: inline-flex; align-items: center; gap: 0.25rem;">
                            ⚠️ Retard ${diffDays} j.
                        </span>
                    </div>
                `;
            }).join('');
        } else {
            alertsBadge.style.display = 'none';
            alertsContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: #64748b; padding: 1rem;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background: #d1fae5; display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem; color: #059669;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div style="font-weight: 600; font-size: 0.875rem; color: #0f172a;">Aucun retard détecté</div>
                    <p style="font-size: 0.75rem; color: #64748b; margin: 0.25rem 0 0 0;">Toutes les interventions planifiées sont à jour.</p>
                </div>
            `;
        }

        // ─── SLO DOUGHNUT CHART ───
        const ctxSla = document.getElementById('slaChart').getContext('2d');
        
        let compliantCount = 0;
        let nonCompliantCount = 0;

        let pFilters = {};
        if (currentAirportId && currentAirportId !== 'all') pFilters.airport_id = currentAirportId;
        const allInterventions = preventifStore.getAll(pFilters);

        allInterventions.forEach(inv => {
            if (societeId && societeId !== 'all' && inv.societe_id !== societeId) return;
            const planDate = inv.date_planifiee;
            if (!kpi.isDateInPeriod(planDate, periodStr)) return;

            if (inv.statut === 'REALISEE') {
                const isIncluded = inv.date_realisee && inv.date_realisee <= inv.date_planifiee;
                if (isIncluded) compliantCount++;
                else nonCompliantCount++;
            } else {
                nonCompliantCount++;
            }
        });

        const totalSLO = compliantCount + nonCompliantCount;
        let sloPercent = totalSLO > 0 ? Math.round((compliantCount / totalSLO) * 100) : 100;

        if (compliantCount === 0 && nonCompliantCount === 0) {
            compliantCount = 1;
            nonCompliantCount = 0;
            sloPercent = 100;
        }

        // Update center label
        const sloCenterVal = document.getElementById('sloCenterValue');
        if (sloCenterVal) sloCenterVal.textContent = `${sloPercent}%`;

        // Update sub-label
        const sloPercentLabel = document.getElementById('sloPercentLabel');
        if (sloPercentLabel) sloPercentLabel.textContent = `${compliantCount} / ${totalSLO || 1} interventions`;

        slaChartInstance = new Chart(ctxSla, {
            type: 'doughnut',
            data: {
                labels: ['Conforme SLO', 'Non-conforme'],
                datasets: [{
                    data: [compliantCount, nonCompliantCount],
                    backgroundColor: ['#059669', '#f1f5f9'],
                    hoverBackgroundColor: ['#047857', '#e2e8f0'],
                    borderColor: '#FFFFFF',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#64748b', font: { size: 11, family: 'Inter' }, padding: 16, usePointStyle: true, pointStyleWidth: 10 }
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        bodyColor: '#ffffff',
                        bodyFont: { size: 12, family: 'Inter' },
                        padding: { top: 8, bottom: 8, left: 12, right: 12 },
                        cornerRadius: 8,
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    };

    // ─── RECENT ACTIVITY PANELS ───
    const renderRecentActivity = () => {
        // Recent Pannes
        let pFilters = {};
        if (currentAirportId && currentAirportId !== 'all') pFilters.airport_id = currentAirportId;
        const pannes = pannesStore.getAll(pFilters)
            .sort((a, b) => new Date(b.t_panne) - new Date(a.t_panne))
            .slice(0, 5);

        const pannesContainer = document.getElementById('recentPannes');
        if (pannes.length === 0) {
            pannesContainer.innerHTML = `<div style="color: #94a3b8; font-size: 0.8125rem; font-style: italic; padding: 0.5rem 0;">Aucune panne enregistrée.</div>`;
        } else {
            pannesContainer.innerHTML = pannes.map(p => {
                const eq = equipementsStore.getById(p.equipement_id);
                const eqName = eq ? eq.nom_equipement : 'Inconnu';
                const d = new Date(p.t_panne);
                const dateStr = !isNaN(d) ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
                const isOpen = p.statut !== 'RESOLUE';
                const dot = isOpen ? '#dc2626' : '#059669';
                return `
                    <div style="display: flex; align-items: center; gap: 0.625rem; padding: 0.5rem 0.625rem; background: ${isOpen ? '#fef2f2' : '#f8fafc'}; border-radius: 6px; border: 1px solid ${isOpen ? '#fecaca' : '#f1f5f9'}; transition: all 150ms;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${dot}; flex-shrink: 0;${isOpen ? ' animation: pulse-ring 2s infinite;' : ''}"></span>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 0.8125rem; font-weight: 500; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${eqName}</div>
                            <div style="font-size: 0.6875rem; color: #94a3b8;">${dateStr} · ${p.statut}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Recent Reclamations
        let rFilters = {};
        if (currentAirportId && currentAirportId !== 'all') rFilters.airport_id = currentAirportId;
        const recs = reclamationsStore.getAll(rFilters)
            .sort((a, b) => new Date(b.date_signalement || b.t_notification || b.created_at || 0) - new Date(a.date_signalement || a.t_notification || a.created_at || 0))
            .slice(0, 5);

        const recContainer = document.getElementById('recentReclamations');
        if (recs.length === 0) {
            recContainer.innerHTML = `<div style="color: #94a3b8; font-size: 0.8125rem; font-style: italic; padding: 0.5rem 0;">Aucune réclamation enregistrée.</div>`;
        } else {
            recContainer.innerHTML = recs.map(r => {
                const dateStr2 = (r.date_signalement || r.t_notification || r.created_at || '');
                const d2 = new Date(dateStr2);
                const fmtDate = !isNaN(d2) ? d2.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
                const statut = r.statut || 'NOUVELLE';
                let badgeColor = '#64748b';
                let badgeBg = '#f1f5f9';
                if (statut === 'NOUVELLE') { badgeColor = '#dc2626'; badgeBg = '#fee2e2'; }
                if (statut === 'EN_COURS') { badgeColor = '#d97706'; badgeBg = '#fef3c7'; }
                if (statut === 'RESOLUE') { badgeColor = '#059669'; badgeBg = '#d1fae5'; }
                const label = statut === 'NOUVELLE' ? 'Ouverte' : statut === 'EN_COURS' ? 'En cours' : 'Résolue';
                return `
                    <div style="display: flex; align-items: center; gap: 0.625rem; padding: 0.5rem 0.625rem; background: #f8fafc; border-radius: 6px; border: 1px solid #f1f5f9; transition: all 150ms;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 0.8125rem; font-weight: 500; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${r.objet || 'Réclamation'}</div>
                            <div style="font-size: 0.6875rem; color: #94a3b8;">${fmtDate}</div>
                        </div>
                        <span style="font-size: 0.6875rem; font-weight: 600; color: ${badgeColor}; background: ${badgeBg}; padding: 0.125rem 0.5rem; border-radius: 9999px; flex-shrink: 0;">${label}</span>
                    </div>
                `;
            }).join('');
        }
    };

    renderKPIsAndCharts();

    societeFilter.addEventListener('change', renderKPIsAndCharts);
    filterPeriod.addEventListener('change', (e) => {
        periodStore.setPeriod(e.target.value);
    });

    const onPeriodChange = (e) => {
        filterPeriod.value = e.detail.period;
        renderKPIsAndCharts();
    };

    const onAirportChange = () => {
        renderDashboard(container);
    };

    const onStoreChanged = (e) => {
        if (['preventif', 'pannes', 'reclamations', 'equipements', 'marches', 'societes'].includes(e.detail.collection)) {
            renderKPIsAndCharts();
        }
    };

    window.addEventListener('period-change', onPeriodChange);
    window.addEventListener('airport-change', onAirportChange, { once: true });
    window.addEventListener('store-changed', onStoreChanged);

    const cleanup = () => {
        if (slaChartInstance) slaChartInstance.destroy();
        window.removeEventListener('period-change', onPeriodChange);
        window.removeEventListener('airport-change', onAirportChange);
        window.removeEventListener('store-changed', onStoreChanged);
        window.removeEventListener('page-destroy', cleanup);
    };
    window.addEventListener('page-destroy', cleanup);
}
