// --- CONSTANTS & MOCK DATA ---
const DEFAULT_PAPERS = [
    {
        id: "paper-1",
        title: "Attention Is All You Need",
        authors: "Vaswani et al.",
        project: "Transformer Araştırmaları",
        topic: "Derin Öğrenme",
        year: 2017,
        month: 6,
        importanceOrder: 1,
        isRead: true,
        notes: "# Attention Is All You Need Notları\n\n- **Önemli Katkı:** RNN ve CNN katmanları yerine tamamen self-attention (öz-dikkat) mekanizmasına dayalı yeni bir ağ mimarisi (Transformer) önerildi.\n- **Sonuçlar:** Çeviri görevlerinde SOTA elde edildi ve eğitim hızı ciddi oranda arttı.\n- **Kilit Kavramlar:** Multi-Head Attention, Positional Encoding, Encoder-Decoder mimarisi.",
        createdAt: "2026-07-01T10:00:00.000Z",
        updatedAt: "2026-07-01T10:30:00.000Z"
    },
    {
        id: "paper-2",
        title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
        authors: "Devlin et al.",
        project: "NLP Modelleri",
        topic: "Doğal Dil İşleme",
        year: 2018,
        month: 10,
        importanceOrder: 2,
        isRead: true,
        notes: "# BERT İncelemesi\n\n- Masked Language Model (MLM) ve Next Sentence Prediction (NSP) görevleri ile çift yönlü ön eğitim.\n- İnce ayar (fine-tuning) yöntemiyle birçok NLP görevinde mükemmel sonuçlar elde etti.\n- NLP dünyasında bir dönüm noktası.",
        createdAt: "2026-07-02T11:00:00.000Z",
        updatedAt: "2026-07-02T11:15:00.000Z"
    },
    {
        id: "paper-3",
        title: "Language Models are Few-Shot Learners",
        authors: "Brown et al. (OpenAI)",
        project: "GPT Serisi",
        topic: "Büyük Dil Modelleri",
        year: 2020,
        month: 5,
        importanceOrder: 3,
        isRead: false,
        notes: "# GPT-3 Makalesi\n\n- **Ölçekleme Yasaları:** Model parametre sayısı 175 milyara ulaştığında, ince ayar yapmadan sadece birkaç örnek göstererek (few-shot) birçok görevi yapabildiği gösterildi.\n- İn-context learning konsepti popülerleşti.\n- *Eksiklik:* Hesaplama maliyeti çok yüksek ve hala mantık hataları yapabiliyor.",
        createdAt: "2026-07-03T09:00:00.000Z",
        updatedAt: "2026-07-03T09:00:00.000Z"
    },
    {
        id: "paper-4",
        title: "LoRA: Low-Rank Adaptation of Large Language Models",
        authors: "Hu et al. (Microsoft)",
        project: "NLP Modelleri",
        topic: "Model İnce Ayar",
        year: 2021,
        month: 6,
        importanceOrder: 4,
        isRead: false,
        notes: "# LoRA Özet\n\n- Ağırlık matrislerine eklenen düşük matris dereceli (low-rank) güncellemeler sayesinde ince ayar parametre sayısı %99 azaltıldı.\n- VRAM tüketimini dramatik şekilde düşürür.\n- Çıkarım (inference) gecikmesi yaratmaz (orijinal ağırlıklarla birleştirilebilir).",
        createdAt: "2026-07-04T14:20:00.000Z",
        updatedAt: "2026-07-04T14:20:00.000Z"
    }
];

// --- APP STATE ---
const isServerMode = window.location.protocol.startsWith('http');
let papers = [];
let projects = [];
let topics = [];
let deletedPdfFiles = [];
let pdfFiles = []; // All PDF filenames currently on disk
let goals = []; // Reading targets/goals array
let currentPdfPaperId = null; // Currently open PDF paper ID
let filters = {
    search: '',
    project: '',
    topic: '',
    status: ''
};
let sortBy = 'importance';
let groupBy = 'none';
let activeView = 'papers'; // 'papers' or 'analytics'
let selectedPaperId = null;
let collapsedGroups = new Set();
let isNotesEditMode = false;

// --- DOM ELEMENTS ---
const elements = {
    themeToggle: document.getElementById('theme-toggle'),
    
    // Sidebar Stats
    statTotal: document.getElementById('stat-total'),
    statRead: document.getElementById('stat-read'),
    statProgressText: document.getElementById('stat-progress-text'),
    statProgressFill: document.getElementById('stat-progress-fill'),
    
    // Views
    navAllPapers: document.getElementById('nav-all-papers'),
    navAnalytics: document.getElementById('nav-analytics'),
    viewPapersContainer: document.getElementById('view-papers-container'),
    viewAnalyticsContainer: document.getElementById('view-analytics-container'),
    
    // Sidebar Filters
    filterProject: document.getElementById('filter-project'),
    filterTopic: document.getElementById('filter-topic'),
    filterStatus: document.getElementById('filter-status'),
    btnClearFilters: document.getElementById('btn-clear-filters'),
    
    // Manage Sidebar Buttons
    navManageProjects: document.getElementById('nav-manage-projects'),
    navManageTopics: document.getElementById('nav-manage-topics'),
    
    // Backup/Restore
    btnExport: document.getElementById('btn-export'),
    btnImport: document.getElementById('btn-import'),
    fileImport: document.getElementById('file-import'),
    
    // Main Headers/Tools
    searchInput: document.getElementById('search-input'),
    btnAddPaper: document.getElementById('btn-add-paper'),
    sortSelect: document.getElementById('sort-select'),
    groupSelect: document.getElementById('group-select'),
    papersList: document.getElementById('papers-list'),
    
    // Detail Drawer
    detailDrawer: document.getElementById('detail-drawer'),
    btnCloseDrawer: document.getElementById('btn-close-drawer'),
    drawerContent: document.getElementById('drawer-content'),
    
    // Modals
    paperModal: document.getElementById('paper-modal'),
    paperForm: document.getElementById('paper-form'),
    modalTitle: document.getElementById('modal-title'),
    paperIdInput: document.getElementById('paper-id'),
    paperTitleInput: document.getElementById('paper-title'),
    paperAuthorsInput: document.getElementById('paper-authors'),
    paperYearInput: document.getElementById('paper-year'),
    paperMonthSelect: document.getElementById('paper-month'),
    paperProjectInput: document.getElementById('paper-project'),
    paperTopicInput: document.getElementById('paper-topic'),
    paperIsReadInput: document.getElementById('paper-isread'),
    paperNotesTextarea: document.getElementById('paper-notes'),
    projectComboDropdown: document.getElementById('project-combo-dropdown'),
    topicComboDropdown: document.getElementById('topic-combo-dropdown'),
    
    projectsModal: document.getElementById('projects-modal'),
    addProjectForm: document.getElementById('add-project-form'),
    newProjectNameInput: document.getElementById('new-project-name'),
    projectsManageList: document.getElementById('projects-manage-list'),
    
    topicsModal: document.getElementById('topics-modal'),
    addTopicForm: document.getElementById('add-topic-form'),
    newTopicNameInput: document.getElementById('new-topic-name'),
    topicsManageList: document.getElementById('topics-manage-list'),
    
    // Confirm Dialog
    confirmModal: document.getElementById('confirm-modal'),
    confirmTitle: document.getElementById('confirm-title'),
    confirmMessage: document.getElementById('confirm-message'),
    confirmBtnCancel: document.getElementById('confirm-btn-cancel'),
    confirmBtnYes: document.getElementById('confirm-btn-yes'),

    // History Modal
    historyModal: document.getElementById('history-modal'),
    btnShowHistory: document.getElementById('btn-show-history'),
    historyManageList: document.getElementById('history-manage-list'),

    // Chart Containers
    chartProjects: document.getElementById('chart-projects'),
    chartTopics: document.getElementById('chart-topics'),
    chartMonthlyProgress: document.getElementById('chart-monthly-progress'),

    // PDF Elements
    paperPdfInput: document.getElementById('paper-pdf'),
    pdfComboDropdown: document.getElementById('pdf-combo-dropdown'),
    pdfViewerContainer: document.getElementById('pdf-viewer-container'),
    pdfIframe: document.getElementById('pdf-iframe'),
    pdfViewerTitle: document.getElementById('pdf-viewer-title'),
    btnClosePdf: document.getElementById('btn-close-pdf'),
    pdfCurrentPageInput: document.getElementById('pdf-current-page'),
    btnPdfPageDec: document.getElementById('btn-pdf-page-dec'),
    btnPdfPageInc: document.getElementById('btn-pdf-page-inc'),

    // Goals View Elements
    navGoals: document.getElementById('nav-goals'),
    viewGoalsContainer: document.getElementById('view-goals-container'),
    goalsList: document.getElementById('goals-list'),
    btnAddGoal: document.getElementById('btn-add-goal'),
    
    // Goals Modal
    goalModal: document.getElementById('goal-modal'),
    goalForm: document.getElementById('goal-form'),
    goalModalTitle: document.getElementById('goal-modal-title'),
    goalIdInput: document.getElementById('goal-id'),
    goalTitleInput: document.getElementById('goal-title'),
    goalDateInput: document.getElementById('goal-date'),
    goalPapersSelection: document.getElementById('goal-papers-selection')
};

// --- INITIALIZATION ---
async function init() {
    loadTheme();
    await loadData();
    setupEventListeners();
    renderAll();
}

// --- DATA PERSISTENCE ---
async function loadData() {
    if (isServerMode) {
        try {
            const res = await fetch('/api/data');
            const data = await res.json();
            papers = data.papers || [];
            projects = data.projects || [];
            topics = data.topics || [];
            deletedPdfFiles = data.deletedPdfFiles || [];
            pdfFiles = data.pdfFiles || [];
            goals = data.goals || [];
        } catch (e) {
            console.error("Sunucudan veriler yüklenemedi, yerel depolamaya geçiliyor:", e);
            loadLocalData();
        }
    } else {
        loadLocalData();
    }
}

// Ensure default progress fields on papers
function ensurePaperFields() {
    papers.forEach(p => {
        if (p.progress === undefined) {
            p.progress = p.isRead ? 100 : 0;
        }
        if (p.lastReadPage === undefined) {
            p.lastReadPage = 1;
        }
    });
}

function loadLocalData() {
    try {
        const storedPapers = localStorage.getItem('paperlist_papers');
        const storedProjects = localStorage.getItem('paperlist_projects');
        const storedTopics = localStorage.getItem('paperlist_topics');
        const storedDeletedPdfs = localStorage.getItem('paperlist_deleted_pdfs');
        const storedGoals = localStorage.getItem('paperlist_goals');

        if (storedPapers) {
            papers = JSON.parse(storedPapers);
        } else {
            // First time loading: set up mock data
            papers = [...DEFAULT_PAPERS];
            savePapers(false);
        }

        ensurePaperFields();

        if (storedProjects) {
            projects = JSON.parse(storedProjects);
        } else {
            // Populate projects list from current papers
            const uniqueProjects = [...new Set(papers.map(p => p.project))].filter(Boolean);
            projects = uniqueProjects.map((p, idx) => ({ id: `project-${Date.now()}-${idx}`, name: p }));
            saveProjects();
        }

        if (storedTopics) {
            topics = JSON.parse(storedTopics);
        } else {
            // Populate topics list from current papers
            const uniqueTopics = [...new Set(papers.map(p => p.topic))].filter(Boolean);
            topics = uniqueTopics.map((t, idx) => ({ id: `topic-${Date.now()}-${idx}`, name: t }));
            saveTopics();
        }
        
        deletedPdfFiles = storedDeletedPdfs ? JSON.parse(storedDeletedPdfs) : [];
        goals = storedGoals ? JSON.parse(storedGoals) : [];
        pdfFiles = []; // Empty on local file mode
    } catch (e) {
        console.error("Veriler yüklenirken hata oluştu:", e);
        papers = [...DEFAULT_PAPERS];
        projects = [];
        topics = [];
        deletedPdfFiles = [];
        pdfFiles = [];
        goals = [];
    }
}

async function syncWithServer() {
    if (!isServerMode) return;
    try {
        const payload = {
            papers,
            projects,
            topics,
            deletedPdfFiles,
            goals
        };
        const res = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(payload)
        });
        const resData = await res.json();
        if (resData.papers) {
            papers = resData.papers;
        }
        if (resData.projects) {
            projects = resData.projects;
        }
        if (resData.topics) {
            topics = resData.topics;
        }
        if (resData.pdfFiles) {
            pdfFiles = resData.pdfFiles;
        }
    } catch (e) {
        console.error("Sunucuya senkronizasyon hatası:", e);
        showToast("Sunucuya senkronizasyon başarısız oldu!", "error");
    }
}

async function savePapers(triggerAutoDownload = true) {
    localStorage.setItem('paperlist_papers', JSON.stringify(papers));
    localStorage.setItem('paperlist_deleted_pdfs', JSON.stringify(deletedPdfFiles));
    localStorage.setItem('paperlist_goals', JSON.stringify(goals));
    saveLocalHistoryBackup();
    if (isServerMode) {
        await syncWithServer();
    }
    if (triggerAutoDownload) {
        checkAndTriggerDailyBackup();
    }
}

async function saveGoals() {
    localStorage.setItem('paperlist_goals', JSON.stringify(goals));
    saveLocalHistoryBackup();
    if (isServerMode) {
        await syncWithServer();
    }
}

async function saveProjects() {
    localStorage.setItem('paperlist_projects', JSON.stringify(projects));
    saveLocalHistoryBackup();
    if (isServerMode) {
        await syncWithServer();
    }
}

async function saveTopics() {
    localStorage.setItem('paperlist_topics', JSON.stringify(topics));
    saveLocalHistoryBackup();
    if (isServerMode) {
        await syncWithServer();
    }
}

// Rolling history backup in localStorage (keeps last 5 changes)
function saveLocalHistoryBackup() {
    try {
        let history = localStorage.getItem('paperlist_backup_history');
        history = history ? JSON.parse(history) : [];
        
        const newState = {
            timestamp: new Date().toISOString(),
            papers: JSON.parse(JSON.stringify(papers)),
            projects: JSON.parse(JSON.stringify(projects)),
            topics: JSON.parse(JSON.stringify(topics)),
            goals: JSON.parse(JSON.stringify(goals))
        };
        
        // Add at the beginning
        history.unshift(newState);
        
        // Limit to 5
        if (history.length > 5) {
            history = history.slice(0, 5);
        }
        
        localStorage.setItem('paperlist_backup_history', JSON.stringify(history));
    } catch (e) {
        console.error("Yerel yedek geçmişi oluşturulamadı:", e);
    }
}

// Daily automatic download backup (when changes occur)
function checkAndTriggerDailyBackup() {
    try {
        if (papers.length === 0) return;
        
        const todayStr = new Date().toISOString().split('T')[0];
        const lastBackupDate = localStorage.getItem('paperlist_last_autodownload_date');
        
        if (lastBackupDate !== todayStr) {
            const backup = {
                version: "1.0",
                exportedAt: new Date().toISOString(),
                isAutoBackup: true,
                papers: papers,
                projects: projects,
                topics: topics
            };
            
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `paperlist_oto_yedek_${todayStr}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            
            localStorage.setItem('paperlist_last_autodownload_date', todayStr);
            showToast("Günlük yedek dosyanız otomatik olarak indirildi!", "success");
        }
    } catch (e) {
        console.error("Otomatik dosya yedeği alınamadı:", e);
    }
}

// Toast notification trigger
function showToast(message, type = 'success') {
    // Remove existing toasts first to prevent stacking issues
    document.querySelectorAll('.toast').forEach(el => el.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    lucide.createIcons();
    
    // Add show class after a tiny tick
    setTimeout(() => toast.classList.add('show'), 20);
    
    // Remove after 3.5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function loadTheme() {
    const isDark = localStorage.getItem('paperlist_theme') !== 'light';
    if (isDark) {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    }
}

// --- RENDER PIPELINE ---
function renderAll() {
    renderStats();
    renderFiltersDropdowns();
    if (activeView === 'papers') {
        renderList();
    } else if (activeView === 'goals') {
        renderGoals();
    } else if (activeView === 'analytics') {
        renderAnalytics();
    }
    lucide.createIcons();
}

// 1. Render Statistics Widget
function renderStats() {
    const total = papers.length;
    const read = papers.filter(p => p.isRead).length;
    const pct = total > 0 ? Math.round((read / total) * 100) : 0;
    
    elements.statTotal.textContent = total;
    elements.statRead.textContent = read;
    elements.statProgressText.textContent = `${pct}%`;
    elements.statProgressFill.style.width = `${pct}%`;
}

// 2. Render Project and Topic Dropdown Lists (Sidebar & Modal)
function renderFiltersDropdowns() {
    // Save current selections
    const selectedProj = filters.project;
    const selectedTop = filters.topic;

    // Clear and populate Project filter dropdown
    elements.filterProject.innerHTML = '<option value="">Tümü</option>';
    projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name;
        if (p.name === selectedProj) opt.selected = true;
        elements.filterProject.appendChild(opt);
    });

    // Clear and populate Topic filter dropdown
    elements.filterTopic.innerHTML = '<option value="">Tümü</option>';
    topics.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.name;
        opt.textContent = t.name;
        if (t.name === selectedTop) opt.selected = true;
        elements.filterTopic.appendChild(opt);
    });

    // Toggle clear filters button visibility
    const hasActiveFilters = filters.search || filters.project || filters.topic || filters.status;
    if (hasActiveFilters) {
        elements.btnClearFilters.classList.remove('hidden');
    } else {
        elements.btnClearFilters.classList.add('hidden');
    }
}

// 3. Render Paper List
function renderList() {
    elements.papersList.innerHTML = '';
    
    // Filter papers
    let filtered = papers.filter(p => {
        // Search term
        const searchMatch = !filters.search || 
            p.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            (p.authors && p.authors.toLowerCase().includes(filters.search.toLowerCase())) ||
            (p.notes && p.notes.toLowerCase().includes(filters.search.toLowerCase()));
            
        // Project filter
        const projectMatch = !filters.project || p.project === filters.project;
        
        // Topic filter
        const topicMatch = !filters.topic || p.topic === filters.topic;
        
        // Status filter
        const statusMatch = !filters.status || 
            (filters.status === 'read' && p.isRead) ||
            (filters.status === 'unread' && !p.isRead);
            
        return searchMatch && projectMatch && topicMatch && statusMatch;
    });

    // Sort papers
    filtered.sort((a, b) => {
        if (sortBy === 'importance') {
            return a.importanceOrder - b.importanceOrder;
        } else if (sortBy === 'date-desc') {
            const dateA = (a.year * 100) + (a.month || 0);
            const dateB = (b.year * 100) + (b.month || 0);
            return dateB - dateA;
        } else if (sortBy === 'date-asc') {
            const dateA = (a.year * 100) + (a.month || 0);
            const dateB = (b.year * 100) + (b.month || 0);
            return dateA - dateB;
        } else if (sortBy === 'added-desc') {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
    });

    // Check empty state
    if (filtered.length === 0) {
        elements.papersList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="folder-open"></i>
                <h3>Kayıt bulunamadı</h3>
                <p>Kriterlere uygun yayın bulunmamaktadır. Yeni bir yayın ekleyebilir veya filtreleri temizleyebilirsiniz.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    // Is Drag & Drop enabled?
    // Drag & drop only when sorting by importance and no grouping or filtering is active
    const isDragEnabled = groupBy === 'none' && sortBy === 'importance' && 
                          !filters.project && !filters.topic && !filters.status && !filters.search;

    if (groupBy === 'none') {
        // Flat List
        filtered.forEach(p => {
            elements.papersList.appendChild(createPaperItemElement(p, isDragEnabled));
        });
    } else {
        // Grouped List
        const groups = {};
        
        filtered.forEach(p => {
            let key = '';
            let label = '';
            
            if (groupBy === 'project') {
                key = p.project || 'Projesiz';
                label = key;
            } else if (groupBy === 'topic') {
                key = p.topic || 'Konusuz';
                label = key;
            } else if (groupBy === 'isRead') {
                key = p.isRead ? 'read' : 'unread';
                label = p.isRead ? 'Okunanlar' : 'Okunmayanlar';
            }
            
            if (!groups[key]) {
                groups[key] = { label: label, papers: [] };
            }
            groups[key].papers.push(p);
        });

        // Create HTML structure for each group
        Object.keys(groups).forEach(key => {
            const group = groups[key];
            const groupSec = document.createElement('div');
            groupSec.className = 'group-section';
            
            const isCollapsed = collapsedGroups.has(key);
            
            const header = document.createElement('div');
            header.className = `group-header ${isCollapsed ? 'collapsed' : ''}`;
            header.innerHTML = `
                <i data-lucide="chevron-down"></i>
                <span>${group.label} (${group.papers.length})</span>
            `;
            header.addEventListener('click', () => {
                if (collapsedGroups.has(key)) {
                    collapsedGroups.delete(key);
                } else {
                    collapsedGroups.add(key);
                }
                renderList();
            });
            
            const content = document.createElement('div');
            content.className = 'group-content';
            
            group.papers.forEach(p => {
                content.appendChild(createPaperItemElement(p, false)); // Drag disabled in group mode
            });
            
            groupSec.appendChild(header);
            groupSec.appendChild(content);
            elements.papersList.appendChild(groupSec);
        });
    }

    if (isDragEnabled) {
        setupDragAndDrop();
    }
    
    lucide.createIcons();
}

// Helper to create a single Paper DOM Item
function createPaperItemElement(paper, isDragEnabled) {
    const item = document.createElement('div');
    item.className = `paper-item ${paper.isRead ? 'is-read' : ''}`;
    item.dataset.id = paper.id;
    if (isDragEnabled) {
        item.setAttribute('draggable', 'true');
    }

    const monthNames = ["", "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    const dateText = paper.month ? `${monthNames[paper.month]} ${paper.year}` : `${paper.year}`;

    item.innerHTML = `
        ${isDragEnabled ? `
        <div class="drag-handle" title="Önem sırasını değiştirmek için sürükleyin">
            <i data-lucide="grip-vertical"></i>
        </div>` : ''}
        
        <div class="read-toggle-container">
            <button class="paper-item-checkbox ${paper.isRead ? 'checked' : ''}" 
                    title="${paper.isRead ? 'Okunmadı olarak işaretle' : 'Okundu olarak işaretle'}">
            </button>
        </div>
        
        <div class="paper-info">
            <div class="paper-title-row">
                <span class="paper-title">${escapeHTML(paper.title)}</span>
            </div>
            <div class="paper-meta">
                ${paper.authors ? `
                <div class="meta-item" title="Yazar(lar)">
                    <i data-lucide="users"></i>
                    <span>${escapeHTML(paper.authors)}</span>
                </div>` : ''}
                
                <div class="meta-item" title="Yayın Tarihi">
                    <i data-lucide="calendar"></i>
                    <span>${dateText}</span>
                </div>

                ${paper.project ? `<span class="badge badge-project"><i data-lucide="folder"></i> ${escapeHTML(paper.project)}</span>` : ''}
                ${paper.topic ? `<span class="badge badge-topic"><i data-lucide="tag"></i> ${escapeHTML(paper.topic)}</span>` : ''}
                ${paper.pdfFile ? `<span class="badge badge-pdf" title="PDF Göstericiyi Açmak için Tıklayın"><i data-lucide="file-text"></i> PDF</span>` : ''}
            </div>
        </div>

        <div class="paper-actions">
            <button class="btn-icon btn-sm btn-edit-paper" title="Düzenle">
                <i data-lucide="edit-3"></i>
            </button>
            <button class="btn-icon btn-sm btn-icon-danger btn-delete-paper" title="Sil">
                <i data-lucide="trash-2"></i>
            </button>
        </div>
    `;

    // Event Handlers for clicking item & components
    const infoArea = item.querySelector('.paper-info');
    infoArea.addEventListener('click', () => openDrawer(paper.id));

    const checkBtn = item.querySelector('.paper-item-checkbox');
    checkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePaperReadStatus(paper.id);
    });

    const editBtn = item.querySelector('.btn-edit-paper');
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditPaperModal(paper.id);
    });

    const deleteBtn = item.querySelector('.btn-delete-paper');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showDeleteConfirm(paper.id);
    });

    const pdfBadge = item.querySelector('.badge-pdf');
    if (pdfBadge) {
        pdfBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            openPdfViewer(paper.id);
        });
    }

    return item;
}

// 4. Render Analytics Tab (Phase 2 & 3 Extra Features)
function renderAnalytics() {
    // Gather statistics
    const total = papers.length;
    const read = papers.filter(p => p.isRead).length;
    
    // Project breakdown calculation
    const projCounts = {};
    papers.forEach(p => {
        const proj = p.project || 'Projesiz';
        projCounts[proj] = (projCounts[proj] || 0) + 1;
    });
    
    // Topic breakdown calculation
    const topicCounts = {};
    papers.forEach(p => {
        const topic = p.topic || 'Konusuz';
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    // 4.1 Project Chart (Horizontal Bars)
    const projContainer = elements.chartProjects;
    projContainer.innerHTML = '';
    const sortedProjects = Object.entries(projCounts).sort((a,b) => b[1] - a[1]).slice(0, 5); // top 5
    
    if (sortedProjects.length === 0) {
        projContainer.innerHTML = '<p class="text-secondary text-sm text-center">Grafik için yeterli veri yok.</p>';
    } else {
        const maxVal = Math.max(...sortedProjects.map(x => x[1]));
        const chartWrapper = document.createElement('div');
        chartWrapper.style.width = '100%';
        chartWrapper.style.display = 'flex';
        chartWrapper.style.flexDirection = 'column';
        chartWrapper.style.gap = '0.75rem';
        
        sortedProjects.forEach(([name, count]) => {
            const pct = (count / maxVal) * 100;
            const barRow = document.createElement('div');
            barRow.style.display = 'flex';
            barRow.style.alignItems = 'center';
            barRow.style.gap = '1rem';
            
            barRow.innerHTML = `
                <div style="width: 120px; font-size: 0.85rem; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${name}">${name}</div>
                <div style="flex: 1; height: 16px; background-color: var(--border-color); border-radius: 8px; overflow: hidden; position: relative;">
                    <div style="width: ${pct}%; height: 100%; background-color: var(--primary); border-radius: 8px; transition: width 0.5s;"></div>
                </div>
                <div style="width: 30px; text-align: right; font-size: 0.85rem; font-weight: 700;">${count}</div>
            `;
            chartWrapper.appendChild(barRow);
        });
        projContainer.appendChild(chartWrapper);
    }

    // 4.2 Topic Chart (Horizontal Bars)
    const topicContainer = elements.chartTopics;
    topicContainer.innerHTML = '';
    const sortedTopics = Object.entries(topicCounts).sort((a,b) => b[1] - a[1]).slice(0, 5); // top 5
    
    if (sortedTopics.length === 0) {
        topicContainer.innerHTML = '<p class="text-secondary text-sm text-center">Grafik için yeterli veri yok.</p>';
    } else {
        const maxVal = Math.max(...sortedTopics.map(x => x[1]));
        const chartWrapper = document.createElement('div');
        chartWrapper.style.width = '100%';
        chartWrapper.style.display = 'flex';
        chartWrapper.style.flexDirection = 'column';
        chartWrapper.style.gap = '0.75rem';
        
        sortedTopics.forEach(([name, count]) => {
            const pct = (count / maxVal) * 100;
            const barRow = document.createElement('div');
            barRow.style.display = 'flex';
            barRow.style.alignItems = 'center';
            barRow.style.gap = '1rem';
            
            barRow.innerHTML = `
                <div style="width: 120px; font-size: 0.85rem; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${name}">${name}</div>
                <div style="flex: 1; height: 16px; background-color: var(--border-color); border-radius: 8px; overflow: hidden; position: relative;">
                    <div style="width: ${pct}%; height: 100%; background-color: var(--warning); border-radius: 8px; transition: width 0.5s;"></div>
                </div>
                <div style="width: 30px; text-align: right; font-size: 0.85rem; font-weight: 700;">${count}</div>
            `;
            chartWrapper.appendChild(barRow);
        });
        topicContainer.appendChild(chartWrapper);
    }

    // 4.3 Donut Chart for Read Ratio inside the monthly card
    const monthlyContainer = elements.chartMonthlyProgress;
    monthlyContainer.innerHTML = '';
    
    const unread = total - read;
    const readPct = total > 0 ? (read / total) * 100 : 0;
    
    const donutDiv = document.createElement('div');
    donutDiv.className = 'donut-chart-container';
    
    // Draw SVG circle. Radius = 50, Circumference = 2 * PI * radius ≈ 314.16
    const r = 50;
    const circ = 2 * Math.PI * r;
    const dashOffset = circ - (readPct / 100) * circ;
    
    donutDiv.innerHTML = `
        <svg class="donut-svg" width="160" height="160" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="${r}" fill="transparent" stroke="var(--border-color)" stroke-width="12"></circle>
            <circle class="donut-segment" cx="60" cy="60" r="${r}" fill="transparent" 
                    stroke="var(--success)" stroke-width="12" 
                    stroke-dasharray="${circ}" stroke-dashoffset="${dashOffset}" 
                    stroke-linecap="round"></circle>
            <text x="60" y="65" text-anchor="middle" font-family="var(--font-heading)" font-weight="700" font-size="16" fill="var(--text-primary)">
                %${Math.round(readPct)}
            </text>
        </svg>
        <div class="donut-legend">
            <div class="legend-item">
                <div class="legend-color" style="background-color: var(--success)"></div>
                <span>Okunan: <strong>${read} adet</strong></span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: var(--border-color)"></div>
                <span>Okunmayan: <strong>${unread} adet</strong></span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: var(--primary)"></div>
                <span>Toplam yayın: <strong>${total} adet</strong></span>
            </div>
        </div>
    `;
    
    monthlyContainer.appendChild(donutDiv);
}

// --- ACTIONS & MUTATIONS ---

function togglePaperReadStatus(id) {
    const idx = papers.findIndex(p => p.id === id);
    if (idx !== -1) {
        papers[idx].isRead = !papers[idx].isRead;
        papers[idx].progress = papers[idx].isRead ? 100 : 0;
        papers[idx].updatedAt = new Date().toISOString();
        savePapers();
        renderAll();
        
        // If drawer is open and showing this paper, reload drawer
        if (selectedPaperId === id) {
            renderDrawerContent(id);
        }
    }
}

function deletePaper(id) {
    papers = papers.filter(p => p.id !== id);
    // Clean references in goals
    goals.forEach(goal => {
        goal.papers = goal.papers.filter(gp => gp.paperId !== id);
    });
    // Remove goals with no papers left
    goals = goals.filter(goal => goal.papers.length > 0);
    saveGoals();

    // Normalize importance orders
    papers.sort((a,b) => a.importanceOrder - b.importanceOrder);
    papers.forEach((p, idx) => {
        p.importanceOrder = idx + 1;
    });
    
    savePapers();
    
    // Close drawer if it was showing the deleted paper
    if (selectedPaperId === id) {
        closeDrawer();
    }
    
    renderAll();
}

// --- DRAG & DROP ENGINE ---
function setupDragAndDrop() {
    const items = elements.papersList.querySelectorAll('.paper-item');
    
    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', item.dataset.id);
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            // Save the new state order
            const reorderedItems = [...elements.papersList.querySelectorAll('.paper-item')];
            const newOrderIds = reorderedItems.map(node => node.dataset.id);
            
            // Map old papers based on newOrderIds
            const tempPapersMap = {};
            papers.forEach(p => { tempPapersMap[p.id] = p; });
            
            // Build re-indexed papers
            const reorderedPapers = [];
            // Add matching ordered elements
            newOrderIds.forEach((id, index) => {
                if (tempPapersMap[id]) {
                    tempPapersMap[id].importanceOrder = index + 1;
                    reorderedPapers.push(tempPapersMap[id]);
                    delete tempPapersMap[id];
                }
            });
            // Append others not in filter (safeguard)
            Object.values(tempPapersMap).forEach((p, index) => {
                p.importanceOrder = reorderedPapers.length + 1;
                reorderedPapers.push(p);
            });
            
            papers = reorderedPapers;
            savePapers();
            renderStats(); // updates stats without resetting DOM while dragging
        });
    });

    elements.papersList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const draggingItem = document.querySelector('.dragging');
        if (!draggingItem) return;

        const afterElement = getDragAfterElement(elements.papersList, e.clientY);
        if (afterElement == null) {
            elements.papersList.appendChild(draggingItem);
        } else {
            elements.papersList.insertBefore(draggingItem, afterElement);
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.paper-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- COMBOBOX AUTOCOMPLETE (Modal) ---
function setupCombobox(inputEl, dropdownEl, dataProvider, onSelect) {
    inputEl.addEventListener('input', () => {
        const query = inputEl.value.trim().toLowerCase();
        const list = dataProvider();
        
        const filtered = list.filter(item => item.name.toLowerCase().includes(query));
        
        if (filtered.length > 0 && query !== '') {
            dropdownEl.innerHTML = '';
            filtered.forEach(item => {
                const row = document.createElement('div');
                row.className = 'combobox-item';
                row.textContent = item.name;
                row.addEventListener('click', () => {
                    inputEl.value = item.name;
                    dropdownEl.classList.remove('show');
                    if (onSelect) onSelect(item);
                });
                dropdownEl.appendChild(row);
            });
            dropdownEl.classList.add('show');
        } else {
            dropdownEl.classList.remove('show');
        }
    });

    inputEl.addEventListener('focus', () => {
        const query = inputEl.value.trim().toLowerCase();
        const list = dataProvider();
        dropdownEl.innerHTML = '';
        
        // Show all when input is focused/empty, or show filtered
        const filtered = query === '' ? list : list.filter(item => item.name.toLowerCase().includes(query));
        
        if (filtered.length > 0) {
            filtered.forEach(item => {
                const row = document.createElement('div');
                row.className = 'combobox-item';
                row.textContent = item.name;
                row.addEventListener('click', () => {
                    inputEl.value = item.name;
                    dropdownEl.classList.remove('show');
                    if (onSelect) onSelect(item);
                });
                dropdownEl.appendChild(row);
            });
            dropdownEl.classList.add('show');
        }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!inputEl.contains(e.target) && !dropdownEl.contains(e.target)) {
            dropdownEl.classList.remove('show');
        }
    });
}

// --- DRAWER ACTIONS ---
function openDrawer(paperId) {
    selectedPaperId = paperId;
    elements.detailDrawer.classList.add('open');
    renderDrawerContent(paperId);
}

function closeDrawer() {
    selectedPaperId = null;
    elements.detailDrawer.classList.remove('open');
}

function renderDrawerContent(paperId) {
    const paper = papers.find(p => p.id === paperId);
    if (!paper) {
        elements.drawerContent.innerHTML = '<p class="text-secondary">Yayın bulunamadı.</p>';
        return;
    }

    const monthNames = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const dateStr = paper.month ? `${monthNames[paper.month]} ${paper.year}` : `${paper.year}`;

    elements.drawerContent.innerHTML = `
        <div class="drawer-title-section">
            <h1 id="drawer-paper-title">${escapeHTML(paper.title)}</h1>
            <p id="drawer-paper-authors">${paper.authors ? escapeHTML(paper.authors) : 'Yazar belirtilmemiş'}</p>
        </div>

        <div class="drawer-meta-grid">
            <div class="drawer-meta-item">
                <span class="drawer-meta-label">Proje</span>
                <span class="drawer-meta-value">${paper.project ? `<span class="badge badge-project">${escapeHTML(paper.project)}</span>` : 'Belirtilmemiş'}</span>
            </div>
            <div class="drawer-meta-item">
                <span class="drawer-meta-label">Konu</span>
                <span class="drawer-meta-value">${paper.topic ? `<span class="badge badge-topic">${escapeHTML(paper.topic)}</span>` : 'Belirtilmemiş'}</span>
            </div>
            <div class="drawer-meta-item">
                <span class="drawer-meta-label">Yayın Tarihi</span>
                <span class="drawer-meta-value">${dateStr}</span>
            </div>
            <div class="drawer-meta-item">
                <span class="drawer-meta-label">Okuma Durumu</span>
                <span class="drawer-meta-value">
                    <span class="badge badge-status ${paper.isRead ? 'status-read' : 'status-unread'}">
                        ${paper.isRead ? 'Okundu' : 'Okunmadı'}
                    </span>
                </span>
            </div>
        </div>

        ${paper.pdfFile ? `
        <div style="display:flex; justify-content:stretch; margin-top:-0.5rem; margin-bottom:-0.25rem;">
            <button id="btn-open-pdf-viewer" class="btn-pdf-open btn-block" style="justify-content:center; padding: 0.65rem 1rem; font-size: 0.9rem;">
                <i data-lucide="file-text"></i> PDF Dosyasını Oku
            </button>
        </div>` : ''}

        <!-- Okuma İlerlemesi & Sayfa Bilgisi -->
        <div class="drawer-progress-section" style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; background-color: var(--bg-app); margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">Okuma İlerlemesi:</span>
                <span id="drawer-progress-val" style="font-size: 0.85rem; font-weight: 700; color: var(--primary);">%${paper.progress || 0}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <input type="range" id="drawer-progress-slider" min="0" max="100" value="${paper.progress || 0}" style="flex: 1; height: 6px; cursor: pointer;">
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.25rem; gap: 0.5rem; flex-wrap: wrap;">
                <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">Sayfa İlerlemesi:</span>
                <div style="display: flex; align-items: center; gap: 0.25rem;">
                    <input type="number" id="drawer-read-pages" min="0" max="${paper.pageCount || 1}" value="${paper.readPagesCount || 0}" style="width: 55px; text-align: center; border: 1px solid var(--border-color); border-radius: 6px; background-color: var(--bg-card); color: var(--text-primary); font-size: 0.85rem; padding: 0.2rem; font-weight: 600;">
                    <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">/</span>
                    <input type="number" id="drawer-total-pages" min="1" value="${paper.pageCount || 1}" style="width: 55px; text-align: center; border: 1px solid var(--border-color); border-radius: 6px; background-color: var(--bg-card); color: var(--text-primary); font-size: 0.85rem; padding: 0.2rem; font-weight: 600;">
                    <span style="font-size: 0.8rem; color: var(--text-secondary); margin-left: 0.25rem;">sayfa</span>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.5rem;">
                <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">Son Kaldığım Sayfa:</span>
                <input type="number" id="drawer-last-page" min="1" max="${paper.pageCount || 9999}" value="${paper.lastReadPage || 1}" style="width: 60px; text-align: center; border: 1px solid var(--border-color); border-radius: 6px; background-color: var(--bg-card); color: var(--text-primary); font-size: 0.85rem; padding: 0.2rem;">
            </div>
        </div>

        <div class="drawer-notes-section">
            <div class="drawer-notes-header">
                <h3>Kişisel Notlar</h3>
                <div>
                    <button id="btn-toggle-notes-view" class="btn-secondary btn-xs">
                        <i data-lucide="${isNotesEditMode ? 'eye' : 'edit-2'}"></i>
                        <span>${isNotesEditMode ? 'Önizleme' : 'Düzenle'}</span>
                    </button>
                </div>
            </div>
            
            ${isNotesEditMode ? `
                <textarea class="notes-textarea" id="notes-edit-field" placeholder="Notlarınızı yazın...">${paper.notes || ''}</textarea>
                <span class="text-secondary text-sm" style="font-size:0.75rem; text-align:right;">Yazarken otomatik olarak kaydedilir.</span>
            ` : `
                <div class="notes-preview-box" id="notes-preview-field">
                    ${paper.notes ? parseMarkdown(paper.notes) : '<em class="text-muted">Not eklenmemiş. Düzenle butonuna tıklayarak not yazabilirsiniz. Notlar markdown destekler.</em>'}
                </div>
            `}
        </div>
        
        <div style="font-size:0.75rem; color:var(--text-muted); display:flex; flex-direction:column; gap:0.25rem;">
            <span>Eklenme: ${new Date(paper.createdAt).toLocaleString('tr-TR')}</span>
            <span>Güncellenme: ${new Date(paper.updatedAt).toLocaleString('tr-TR')}</span>
        </div>
    `;

    lucide.createIcons();

    // Toggle button listener
    const toggleNotesBtn = document.getElementById('btn-toggle-notes-view');
    toggleNotesBtn.addEventListener('click', () => {
        isNotesEditMode = !isNotesEditMode;
        renderDrawerContent(paperId);
    });

    // Notes auto-save listener
    if (isNotesEditMode) {
        const notesArea = document.getElementById('notes-edit-field');
        
        // Save on keystroke (debounced) and on blur
        let timeout = null;
        notesArea.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                saveNotes(paperId, notesArea.value);
            }, 800);
        });

        notesArea.addEventListener('blur', () => {
            saveNotes(paperId, notesArea.value);
        });
    }

    // PDF open button listener
    const openPdfBtn = document.getElementById('btn-open-pdf-viewer');
    if (openPdfBtn) {
        openPdfBtn.addEventListener('click', () => {
            openPdfViewer(paper.id);
        });
    }

    // Progress slider listener
    const progressSlider = document.getElementById('drawer-progress-slider');
    const progressVal = document.getElementById('drawer-progress-val');
    const readPagesInput = document.getElementById('drawer-read-pages');
    const totalPagesInput = document.getElementById('drawer-total-pages');

    progressSlider.addEventListener('input', (e) => {
        progressVal.textContent = `%${e.target.value}`;
        const pct = parseInt(e.target.value) || 0;
        const total = parseInt(totalPagesInput.value) || 1;
        readPagesInput.value = Math.round((pct / 100) * total);
    });

    progressSlider.addEventListener('change', (e) => {
        const val = parseInt(e.target.value) || 0;
        paper.progress = val;
        paper.readPagesCount = Math.round((val / 100) * (paper.pageCount || 1));
        
        if (val === 100) {
            paper.isRead = true;
        } else {
            paper.isRead = false;
        }
        
        savePapers(false);
        renderList();
        renderDrawerContent(paperId);
    });

    // Read pages count input listener
    readPagesInput.addEventListener('change', (e) => {
        let readVal = parseInt(e.target.value);
        if (isNaN(readVal) || readVal < 0) readVal = 0;
        const totalVal = paper.pageCount || 1;
        readVal = Math.min(readVal, totalVal);
        
        paper.readPagesCount = readVal;
        const pct = Math.round((readVal / totalVal) * 100);
        paper.progress = pct;
        paper.isRead = (pct === 100);
        
        savePapers(false);
        renderList();
        renderDrawerContent(paperId);
    });

    // Total pages count input listener
    totalPagesInput.addEventListener('change', (e) => {
        let totalVal = parseInt(e.target.value);
        if (isNaN(totalVal) || totalVal < 1) totalVal = 1;
        
        paper.pageCount = totalVal;
        if ((paper.readPagesCount || 0) > totalVal) {
            paper.readPagesCount = totalVal;
        }
        
        const pct = Math.round(((paper.readPagesCount || 0) / totalVal) * 100);
        paper.progress = pct;
        paper.isRead = (pct === 100);
        
        savePapers(false);
        renderList();
        renderDrawerContent(paperId);
    });

    // Last page input listener
    const lastPageInput = document.getElementById('drawer-last-page');
    lastPageInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) val = 1;
        paper.lastReadPage = val;
        savePapers(false);
        
        if (currentPdfPaperId === paper.id) {
            elements.pdfCurrentPageInput.value = val;
        }
    });
}

function saveNotes(paperId, text) {
    const idx = papers.findIndex(p => p.id === paperId);
    if (idx !== -1) {
        papers[idx].notes = text;
        papers[idx].updatedAt = new Date().toISOString();
        savePapers();
        
        // Refresh sidebar stats / list if search filter matches text content
        if (filters.search) {
            renderList();
        }
    }
}

// --- MODALS ENGINE ---
function openAddPaperModal() {
    elements.modalTitle.textContent = "Yeni Paper Ekle";
    elements.paperIdInput.value = "";
    elements.paperForm.reset();
    
    // Reset page count inputs to default
    document.getElementById('paper-page-count').value = 1;
    document.getElementById('paper-read-pages-modal').value = 0;
    
    // Auto populate combos dropdown with values
    elements.projectComboDropdown.classList.remove('show');
    elements.topicComboDropdown.classList.remove('show');
    elements.pdfComboDropdown.classList.remove('show');

    elements.paperModal.classList.add('open');
}

function openEditPaperModal(paperId) {
    const paper = papers.find(p => p.id === paperId);
    if (!paper) return;

    elements.modalTitle.textContent = "Paper Düzenle";
    elements.paperIdInput.value = paper.id;
    elements.paperTitleInput.value = paper.title;
    elements.paperAuthorsInput.value = paper.authors || "";
    elements.paperYearInput.value = paper.year;
    elements.paperMonthSelect.value = paper.month || "";
    elements.paperProjectInput.value = paper.project;
    elements.paperTopicInput.value = paper.topic;
    elements.paperPdfInput.value = paper.pdfFile || "";
    elements.paperIsReadInput.checked = paper.isRead;
    
    // Set page count values
    document.getElementById('paper-page-count').value = paper.pageCount || 1;
    document.getElementById('paper-read-pages-modal').value = paper.readPagesCount || 0;
    
    elements.paperNotesTextarea.value = paper.notes || "";

    elements.paperModal.classList.add('open');
}

function closeAllModals() {
    elements.paperModal.classList.remove('open');
    elements.projectsModal.classList.remove('open');
    elements.topicsModal.classList.remove('open');
    elements.confirmModal.classList.remove('open');
    elements.historyModal.classList.remove('open');
    elements.goalModal.classList.remove('open');
}

// Save Paper Form Submit
function handlePaperFormSubmit(e) {
    e.preventDefault();
    
    const id = elements.paperIdInput.value;
    const title = elements.paperTitleInput.value.trim();
    const authors = elements.paperAuthorsInput.value.trim();
    const year = parseInt(elements.paperYearInput.value);
    const month = elements.paperMonthSelect.value ? parseInt(elements.paperMonthSelect.value) : null;
    const projectVal = elements.paperProjectInput.value.trim();
    const topicVal = elements.paperTopicInput.value.trim();
    const pdfVal = elements.paperPdfInput.value.trim();
    const isRead = elements.paperIsReadInput.checked;
    const notes = elements.paperNotesTextarea.value;

    if (!title || !year || !projectVal || !topicVal) {
        alert("Lütfen gerekli alanları doldurun.");
        return;
    }

    // Add dynamically to Projects / Topics collections if they do not exist
    if (!projects.some(p => p.name.toLowerCase() === projectVal.toLowerCase())) {
        projects.push({ id: `project-${Date.now()}`, name: projectVal });
        saveProjects();
    }
    
    if (!topics.some(t => t.name.toLowerCase() === topicVal.toLowerCase())) {
        topics.push({ id: `topic-${Date.now()}`, name: topicVal });
        saveTopics();
    }

    let finalPageCount = parseInt(document.getElementById('paper-page-count').value) || 1;
    let finalReadPagesCount = parseInt(document.getElementById('paper-read-pages-modal').value) || 0;
    if (finalPageCount < 1) finalPageCount = 1;
    finalReadPagesCount = Math.max(0, Math.min(finalReadPagesCount, finalPageCount));

    let finalIsRead = isRead;
    let finalProgress = 0;

    if (finalIsRead) {
        finalReadPagesCount = finalPageCount;
        finalProgress = 100;
    } else {
        finalProgress = Math.round((finalReadPagesCount / finalPageCount) * 100);
        if (finalProgress === 100) {
            finalIsRead = true;
        }
    }

    if (id) {
        // Edit mode
        const idx = papers.findIndex(p => p.id === id);
        if (idx !== -1) {
            const oldPaper = papers[idx];
            papers[idx] = {
                ...oldPaper,
                title,
                authors,
                year,
                month,
                project: projectVal,
                topic: topicVal,
                pdfFile: pdfVal || null,
                isRead: finalIsRead,
                progress: finalProgress,
                pageCount: finalPageCount,
                readPagesCount: finalReadPagesCount,
                notes,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Add mode
        const maxImportance = papers.length > 0 ? Math.max(...papers.map(p => p.importanceOrder)) : 0;
        const newPaper = {
            id: `paper-${Date.now()}`,
            title,
            authors,
            year,
            month,
            project: projectVal,
            topic: topicVal,
            pdfFile: pdfVal || null,
            importanceOrder: maxImportance + 1,
            isRead: finalIsRead,
            progress: finalProgress,
            pageCount: finalPageCount,
            readPagesCount: finalReadPagesCount,
            lastReadPage: 1,
            notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        papers.push(newPaper);
    }

    savePapers();
    closeAllModals();
    renderAll();
    
    // Refresh open drawer if same paper
    if (id && selectedPaperId === id) {
        renderDrawerContent(id);
    }
}

// Delete Confirmation
let paperIdToDelete = null;
function showDeleteConfirm(id) {
    const paper = papers.find(p => p.id === id);
    if (!paper) return;
    
    paperIdToDelete = id;
    elements.confirmTitle.textContent = `"${paper.title}" yayınını silmek istediğinize emin misiniz?`;
    elements.confirmMessage.textContent = "Bu işlem geri alınamaz.";
    elements.confirmModal.classList.add('open');
}

// --- PROJECT & TOPIC DIALOGS ---
function openProjectsModal() {
    renderProjectsManageList();
    elements.projectsModal.classList.add('open');
}

function renderProjectsManageList() {
    elements.projectsManageList.innerHTML = '';
    
    projects.forEach(p => {
        const item = document.createElement('div');
        item.className = 'manage-item';
        item.innerHTML = `
            <span>${escapeHTML(p.name)}</span>
            <div class="manage-item-actions">
                <button class="btn-icon btn-xs btn-edit-proj" title="İsmi Değiştir"><i data-lucide="edit-2"></i></button>
                <button class="btn-icon btn-xs btn-icon-danger btn-delete-proj" title="Sil"><i data-lucide="trash-2"></i></button>
            </div>
        `;
        
        item.querySelector('.btn-edit-proj').addEventListener('click', () => renameProject(p.id, p.name));
        item.querySelector('.btn-delete-proj').addEventListener('click', () => deleteProject(p.id, p.name));
        
        elements.projectsManageList.appendChild(item);
    });
    lucide.createIcons();
}

function handleAddProject(e) {
    e.preventDefault();
    const name = elements.newProjectNameInput.value.trim();
    if (!name) return;
    
    if (projects.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert("Bu isimde bir proje zaten mevcut.");
        return;
    }
    
    projects.push({ id: `project-${Date.now()}`, name: name });
    saveProjects();
    elements.newProjectNameInput.value = '';
    renderProjectsManageList();
    renderAll();
}

function renameProject(id, oldName) {
    const newName = prompt("Yeni proje ismi girin:", oldName);
    if (!newName || newName.trim() === "" || newName.trim() === oldName) return;
    
    const formatted = newName.trim();
    
    if (projects.some(p => p.id !== id && p.name.toLowerCase() === formatted.toLowerCase())) {
        alert("Bu isimde başka bir proje zaten mevcut.");
        return;
    }
    
    // Update projects table
    const idx = projects.findIndex(p => p.id === id);
    if (idx !== -1) {
        projects[idx].name = formatted;
        saveProjects();
    }
    
    // Update all papers using this project name
    papers.forEach(p => {
        if (p.project === oldName) {
            p.project = formatted;
        }
    });
    savePapers();
    
    renderProjectsManageList();
    renderAll();
}

function deleteProject(id, name) {
    if (!confirm(`"${name}" projesini silmek istediğinize emin misiniz?\nBu projeye ait olan yayınların proje alanı boşaltılacaktır.`)) {
        return;
    }
    
    projects = projects.filter(p => p.id !== id);
    saveProjects();
    
    // Reset projects in papers
    papers.forEach(p => {
        if (p.project === name) {
            p.project = "";
        }
    });
    savePapers();
    
    renderProjectsManageList();
    renderAll();
}

// Topics Dialogs
function openTopicsModal() {
    renderTopicsManageList();
    elements.topicsModal.classList.add('open');
}

function renderTopicsManageList() {
    elements.topicsManageList.innerHTML = '';
    
    topics.forEach(t => {
        const item = document.createElement('div');
        item.className = 'manage-item';
        item.innerHTML = `
            <span>${escapeHTML(t.name)}</span>
            <div class="manage-item-actions">
                <button class="btn-icon btn-xs btn-edit-topic" title="İsmi Değiştir"><i data-lucide="edit-2"></i></button>
                <button class="btn-icon btn-xs btn-icon-danger btn-delete-topic" title="Sil"><i data-lucide="trash-2"></i></button>
            </div>
        `;
        
        item.querySelector('.btn-edit-topic').addEventListener('click', () => renameTopic(t.id, t.name));
        item.querySelector('.btn-delete-topic').addEventListener('click', () => deleteTopic(t.id, t.name));
        
        elements.topicsManageList.appendChild(item);
    });
    lucide.createIcons();
}

function handleAddTopic(e) {
    e.preventDefault();
    const name = elements.newTopicNameInput.value.trim();
    if (!name) return;
    
    if (topics.some(t => t.name.toLowerCase() === name.toLowerCase())) {
        alert("Bu isimde bir konu zaten mevcut.");
        return;
    }
    
    topics.push({ id: `topic-${Date.now()}`, name: name });
    saveTopics();
    elements.newTopicNameInput.value = '';
    renderTopicsManageList();
    renderAll();
}

function renameTopic(id, oldName) {
    const newName = prompt("Yeni konu ismi girin:", oldName);
    if (!newName || newName.trim() === "" || newName.trim() === oldName) return;
    
    const formatted = newName.trim();
    
    if (topics.some(t => t.id !== id && t.name.toLowerCase() === formatted.toLowerCase())) {
        alert("Bu isimde başka bir konu zaten mevcut.");
        return;
    }
    
    // Update topics table
    const idx = topics.findIndex(t => t.id === id);
    if (idx !== -1) {
        topics[idx].name = formatted;
        saveTopics();
    }
    
    // Update all papers using this topic name
    papers.forEach(p => {
        if (p.topic === oldName) {
            p.topic = formatted;
        }
    });
    savePapers();
    
    renderTopicsManageList();
    renderAll();
}

function deleteTopic(id, name) {
    if (!confirm(`"${name}" konusunu silmek istediğinize emin misiniz?\nBu konuya ait olan yayınların konu alanı boşaltılacaktır.`)) {
        return;
    }
    
    topics = topics.filter(t => t.id !== id);
    saveTopics();
    
    // Reset topics in papers
    papers.forEach(p => {
        if (p.topic === name) {
            p.topic = "";
        }
    });
    savePapers();
    
    renderTopicsManageList();
    renderAll();
}

// --- IMPORT & EXPORT DATABASE ---
function handleExport() {
    const backup = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        papers: papers,
        projects: projects,
        topics: topics
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `paperlist_yedek_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = JSON.parse(evt.target.result);
            if (!data.papers || !Array.isArray(data.papers)) {
                alert("Geçersiz yedek dosyası formatı!");
                return;
            }
            
            if (confirm("Bu işlem mevcut tüm yayınları silip yedektekileri yükleyecektir. Devam etmek istiyor musunuz?")) {
                papers = data.papers;
                projects = data.projects || [];
                topics = data.topics || [];
                
                savePapers();
                saveProjects();
                saveTopics();
                
                // Clear state filters & selection
                filters = { search: '', project: '', topic: '', status: '' };
                elements.searchInput.value = '';
                elements.filterProject.value = '';
                elements.filterTopic.value = '';
                elements.filterStatus.value = '';
                
                closeDrawer();
                renderAll();
                alert("Yedek başarıyla geri yüklendi!");
            }
        } catch (err) {
            console.error(err);
            alert("Dosya okunurken hata oluştu. Lütfen geçerli bir JSON dosyası seçin.");
        }
    };
    reader.readAsText(file);
    elements.fileImport.value = ''; // Reset input selection
}

// --- LOCAL BACKUPS HISTORY ---
function openHistoryModal() {
    renderHistoryManageList();
    elements.historyModal.classList.add('open');
}

function renderHistoryManageList() {
    elements.historyManageList.innerHTML = '';
    
    let history = localStorage.getItem('paperlist_backup_history');
    history = history ? JSON.parse(history) : [];
    
    if (history.length === 0) {
        elements.historyManageList.innerHTML = '<p class="text-secondary text-sm text-center">Henüz kaydedilmiş yerel yedek bulunmamaktadır.</p>';
        return;
    }
    
    history.forEach((state, index) => {
        const item = document.createElement('div');
        item.className = 'manage-item';
        
        const date = new Date(state.timestamp);
        const timeStr = date.toLocaleString('tr-TR');
        const count = state.papers ? state.papers.length : 0;
        
        item.innerHTML = `
            <div>
                <div style="font-weight: 600;">Yedek Noktası #${index + 1}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${timeStr} (${count} yayın)</div>
            </div>
            <button class="btn-primary btn-xs btn-restore-history" data-timestamp="${state.timestamp}">
                Geri Yükle
            </button>
        `;
        
        item.querySelector('.btn-restore-history').addEventListener('click', () => {
            restoreHistoryBackup(state.timestamp);
        });
        
        elements.historyManageList.appendChild(item);
    });
}

function restoreHistoryBackup(timestamp) {
    let history = localStorage.getItem('paperlist_backup_history');
    history = history ? JSON.parse(history) : [];
    
    const targetState = history.find(s => s.timestamp === timestamp);
    if (!targetState) {
        alert("Seçilen yedek bulunamadı.");
        return;
    }
    
    if (confirm("Bu yedek noktasına geri dönmek istediğinize emin misiniz? Mevcut durum silinecektir.")) {
        papers = JSON.parse(JSON.stringify(targetState.papers)) || [];
        projects = JSON.parse(JSON.stringify(targetState.projects)) || [];
        topics = JSON.parse(JSON.stringify(targetState.topics)) || [];
        goals = JSON.parse(JSON.stringify(targetState.goals)) || [];
        
        // Save to localStorage without triggerAutoDownload to avoid double downloads
        savePapers(false);
        saveProjects();
        saveTopics();
        
        closeAllModals();
        closeDrawer();
        renderAll();
        showToast("Seçilen yedek başarıyla geri yüklendi!");
    }
}

// --- PDF VIEWER ACTIONS ---
function openPdfViewer(paperId) {
    const paper = papers.find(p => p.id === paperId);
    if (!paper || !paper.pdfFile) return;
    
    currentPdfPaperId = paperId;
    
    const pageNum = paper.lastReadPage || 1;
    const pdfPath = (isServerMode ? `/pdfs/` : `./pdfs/`) + paper.pdfFile + `#page=${pageNum}`;
    
    elements.pdfIframe.src = pdfPath;
    elements.pdfViewerTitle.textContent = paper.title;
    elements.pdfCurrentPageInput.value = pageNum;
    elements.pdfViewerContainer.style.display = 'flex';
    
    showToast(`PDF kaldığınız sayfadan açıldı: Sayfa ${pageNum}`, "info");
    lucide.createIcons();
}

function closePdfViewer() {
    elements.pdfIframe.src = "";
    elements.pdfViewerTitle.textContent = "";
    elements.pdfViewerContainer.style.display = 'none';
    currentPdfPaperId = null;
}

function handlePageChange(value) {
    if (!currentPdfPaperId) return;
    const paper = papers.find(p => p.id === currentPdfPaperId);
    if (!paper) return;
    
    let page = parseInt(value);
    if (isNaN(page) || page < 1) page = 1;
    if (paper.pageCount && page > paper.pageCount) page = paper.pageCount;
    
    paper.lastReadPage = page;
    elements.pdfCurrentPageInput.value = page;
    
    const pdfPath = (isServerMode ? `/pdfs/` : `./pdfs/`) + paper.pdfFile + `#page=${page}`;
    elements.pdfIframe.src = pdfPath;
    
    savePapers(false);
}

// --- UTILITY FUNCTIONS ---
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Extremely lightweight regex markdown parser for notes section
function parseMarkdown(text) {
    if (!text) return '';
    
    let html = escapeHTML(text);
    
    // Headers (# Header, ## Header, etc.)
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold (**text** or __text__)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic (*text* or _text_)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Bullet points (line starting with - or *)
    // Wrap groups of list items in <ul>
    let lines = html.split('\n');
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.startsWith('- ') || line.startsWith('* ')) {
            let content = line.substring(2);
            lines[i] = `<li>${content}</li>`;
            if (!inList) {
                lines[i] = '<ul>' + lines[i];
                inList = true;
            }
        } else {
            if (inList) {
                lines[i - 1] = lines[i - 1] + '</ul>';
                inList = false;
            }
        }
    }
    if (inList) {
        lines[lines.length - 1] = lines[lines.length - 1] + '</ul>';
    }
    html = lines.join('\n');
    
    // New lines to br (ignoring list structures or headers wrap)
    html = html.replace(/\n/g, '<br>');
    
    // Clean redundant <br> inside list tags
    html = html.replace(/<\/li><br><li>/g, '</li><li>');
    html = html.replace(/<ul><br><li>/g, '<ul><li>');
    html = html.replace(/<\/li><br><\/ul>/g, '</li></ul>');
    html = html.replace(/<\/h(\d)><br>/g, '</h$1>');
    
    return html;
}

// --- SETUP EVENT LISTENERS ---
function setupEventListeners() {
    
    // Theme Toggle
    elements.themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme', !isDark);
        localStorage.setItem('paperlist_theme', isDark ? 'dark' : 'light');
    });

    // View Switching
    elements.navAllPapers.addEventListener('click', () => {
        elements.navAllPapers.classList.add('active');
        elements.navAnalytics.classList.remove('active');
        elements.navGoals.classList.remove('active');
        elements.viewPapersContainer.classList.add('active');
        elements.viewAnalyticsContainer.classList.remove('active');
        elements.viewGoalsContainer.classList.remove('active');
        activeView = 'papers';
    });

    elements.navAnalytics.addEventListener('click', () => {
        elements.navAnalytics.classList.add('active');
        elements.navAllPapers.classList.remove('active');
        elements.navGoals.classList.remove('active');
        elements.viewAnalyticsContainer.classList.add('active');
        elements.viewPapersContainer.classList.remove('active');
        elements.viewGoalsContainer.classList.remove('active');
        activeView = 'analytics';
        renderAnalytics();
    });

    elements.navGoals.addEventListener('click', () => {
        elements.navGoals.classList.add('active');
        elements.navAllPapers.classList.remove('active');
        elements.navAnalytics.classList.remove('active');
        elements.viewGoalsContainer.classList.add('active');
        elements.viewPapersContainer.classList.remove('active');
        elements.viewAnalyticsContainer.classList.remove('active');
        activeView = 'goals';
        renderGoals();
    });

    // Search bar event
    elements.searchInput.addEventListener('input', () => {
        filters.search = elements.searchInput.value;
        renderList();
        renderFiltersDropdowns();
    });

    // Filter selectors
    elements.filterProject.addEventListener('change', () => {
        filters.project = elements.filterProject.value;
        renderList();
        renderFiltersDropdowns();
    });
    
    elements.filterTopic.addEventListener('change', () => {
        filters.topic = elements.filterTopic.value;
        renderList();
        renderFiltersDropdowns();
    });

    elements.filterStatus.addEventListener('change', () => {
        filters.status = elements.filterStatus.value;
        renderList();
        renderFiltersDropdowns();
    });

    // Clear filters button
    elements.btnClearFilters.addEventListener('click', () => {
        filters = { search: '', project: '', topic: '', status: '' };
        elements.searchInput.value = '';
        elements.filterProject.value = '';
        elements.filterTopic.value = '';
        elements.filterStatus.value = '';
        renderAll();
    });

    // Sorting & Grouping
    elements.sortSelect.addEventListener('change', () => {
        sortBy = elements.sortSelect.value;
        renderList();
    });

    elements.groupSelect.addEventListener('change', () => {
        groupBy = elements.groupSelect.value;
        renderList();
    });

    // Add Paper triggers
    elements.btnAddPaper.addEventListener('click', openAddPaperModal);

    // Modal Close buttons
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Form Submit
    elements.paperForm.addEventListener('submit', handlePaperFormSubmit);

    // Drawer Close
    elements.btnCloseDrawer.addEventListener('click', closeDrawer);

    // Confirm dialog controls
    elements.confirmBtnCancel.addEventListener('click', closeAllModals);
    elements.confirmBtnYes.addEventListener('click', () => {
        if (paperIdToDelete) {
            deletePaper(paperIdToDelete);
            paperIdToDelete = null;
        }
        closeAllModals();
    });

    // Project & Topic management modal triggers
    elements.navManageProjects.addEventListener('click', openProjectsModal);
    elements.navManageTopics.addEventListener('click', openTopicsModal);

    // Manage Forms Submits
    elements.addProjectForm.addEventListener('submit', handleAddProject);
    elements.addTopicForm.addEventListener('submit', handleAddTopic);

    // Backup & Restore event links
    elements.btnExport.addEventListener('click', handleExport);
    elements.btnImport.addEventListener('click', () => elements.fileImport.click());
    elements.fileImport.addEventListener('change', handleImport);
    elements.btnShowHistory.addEventListener('click', openHistoryModal);

    // Set up Comboboxes in Add Paper Modal
    setupCombobox(
        elements.paperProjectInput,
        elements.projectComboDropdown,
        () => projects
    );
    
    setupCombobox(
        elements.paperTopicInput,
        elements.topicComboDropdown,
        () => topics
    );

    setupCombobox(
        elements.paperPdfInput,
        elements.pdfComboDropdown,
        () => pdfFiles.map(f => ({ name: f }))
    );

    elements.btnClosePdf.addEventListener('click', closePdfViewer);

    elements.pdfCurrentPageInput.addEventListener('change', (e) => {
        handlePageChange(e.target.value);
    });

    elements.btnPdfPageDec.addEventListener('click', () => {
        let val = parseInt(elements.pdfCurrentPageInput.value) || 1;
        if (val > 1) {
            handlePageChange(val - 1);
        }
    });

    elements.btnPdfPageInc.addEventListener('click', () => {
        let val = parseInt(elements.pdfCurrentPageInput.value) || 1;
        handlePageChange(val + 1);
    });

    elements.btnAddGoal.addEventListener('click', openAddGoalModal);
    elements.goalForm.addEventListener('submit', handleGoalFormSubmit);
}

// --- GOALS ENGINE ---
function openAddGoalModal() {
    elements.goalModalTitle.textContent = "Yeni Okuma Hedefi Ekle";
    elements.goalIdInput.value = "";
    elements.goalForm.reset();
    
    // Clear and build papers checklist
    renderGoalPapersSelection({});
    
    // Set default date to 1 week from now
    const oneWeekLater = new Date();
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    elements.goalDateInput.value = oneWeekLater.toISOString().split('T')[0];
    
    elements.goalModal.classList.add('open');
}

function openEditGoalModal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    elements.goalModalTitle.textContent = "Okuma Hedefini Düzenle";
    elements.goalIdInput.value = goal.id;
    elements.goalTitleInput.value = goal.title;
    elements.goalDateInput.value = goal.targetDate;
    
    // Map paper targets to map for rendering
    const paperTargets = {};
    goal.papers.forEach(p => {
        paperTargets[p.paperId] = p.targetProgress;
    });
    
    renderGoalPapersSelection(paperTargets);
    
    elements.goalModal.classList.add('open');
}

function renderGoalPapersSelection(paperTargetsMap) {
    elements.goalPapersSelection.innerHTML = '';
    
    if (papers.length === 0) {
        elements.goalPapersSelection.innerHTML = '<p class="text-secondary text-sm">Seçilebilecek yayın bulunmamaktadır.</p>';
        return;
    }
    
    papers.forEach(paper => {
        const isChecked = paperTargetsMap[paper.id] !== undefined;
        const targetValue = isChecked ? paperTargetsMap[paper.id] : 100;
        
        const row = document.createElement('div');
        row.className = 'goal-paper-select-row';
        row.innerHTML = `
            <div class="goal-paper-select-info">
                <label class="checkbox-container" style="margin-bottom: 0;">
                    <input type="checkbox" class="goal-paper-checkbox" data-paper-id="${paper.id}" ${isChecked ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <span class="goal-paper-select-title" title="${escapeHTML(paper.title)}">${escapeHTML(paper.title)}</span>
            </div>
            <div class="goal-paper-select-slider-container" style="visibility: ${isChecked ? 'visible' : 'hidden'};">
                <input type="range" class="goal-paper-slider" min="0" max="100" value="${targetValue}">
                <span class="goal-paper-select-slider-val">%${targetValue}</span>
            </div>
        `;
        
        // Listen to checkbox changes to toggle slider visibility
        const checkbox = row.querySelector('.goal-paper-checkbox');
        const sliderContainer = row.querySelector('.goal-paper-select-slider-container');
        const slider = row.querySelector('.goal-paper-slider');
        const sliderVal = row.querySelector('.goal-paper-select-slider-val');
        
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                sliderContainer.style.visibility = 'visible';
            } else {
                sliderContainer.style.visibility = 'hidden';
            }
        });
        
        slider.addEventListener('input', (e) => {
            sliderVal.textContent = `%${e.target.value}`;
        });
        
        elements.goalPapersSelection.appendChild(row);
    });
}

function handleGoalFormSubmit(e) {
    e.preventDefault();
    
    const id = elements.goalIdInput.value;
    const title = elements.goalTitleInput.value.trim();
    const targetDate = elements.goalDateInput.value;
    
    if (!title || !targetDate) {
        alert("Lütfen gerekli alanları doldurun.");
        return;
    }
    
    // Gather selected papers
    const selectedPapers = [];
    elements.goalPapersSelection.querySelectorAll('.goal-paper-select-row').forEach(row => {
        const checkbox = row.querySelector('.goal-paper-checkbox');
        if (checkbox.checked) {
            const paperId = checkbox.dataset.paperId;
            const slider = row.querySelector('.goal-paper-slider');
            const targetProgress = parseInt(slider.value);
            
            selectedPapers.push({
                paperId,
                targetProgress
            });
        }
    });
    
    if (selectedPapers.length === 0) {
        alert("Lütfen en az bir yayın seçin.");
        return;
    }
    
    if (id) {
        // Edit Mode
        const idx = goals.findIndex(g => g.id === id);
        if (idx !== -1) {
            goals[idx] = {
                ...goals[idx],
                title,
                targetDate,
                papers: selectedPapers,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Add Mode
        const newGoal = {
            id: `goal-${Date.now()}`,
            title,
            targetDate,
            papers: selectedPapers,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        goals.push(newGoal);
    }
    
    saveGoals();
    closeAllModals();
    renderGoals();
    showToast("Okuma hedefi başarıyla kaydedildi!", "success");
}

function deleteGoal(goalId) {
    if (confirm("Bu okuma hedefini silmek istediğinize emin misiniz?")) {
        goals = goals.filter(g => g.id !== goalId);
        saveGoals();
        renderGoals();
        showToast("Okuma hedefi silindi.", "info");
    }
}

function renderGoals() {
    elements.goalsList.innerHTML = '';
    
    if (goals.length === 0) {
        elements.goalsList.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 3rem 1rem;">
                <i data-lucide="target" style="width:48px; height:48px; margin-bottom:1rem; color:var(--text-muted);"></i>
                <h3>Kayıtlı hedef bulunamadı</h3>
                <p>Henüz okuma hedefi oluşturmamışsınız. Yeni bir hedef ekleyerek çalışmalarınızı planlayabilirsiniz.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    goals.forEach(goal => {
        // Calculate progress values
        let totalTargetProgress = 0;
        let totalActualProgress = 0;
        let paperRowsHtml = '';
        
        goal.papers.forEach(gp => {
            const paper = papers.find(p => p.id === gp.paperId);
            const paperTitle = paper ? paper.title : 'Silinmiş Yayın';
            const actualProgress = paper ? (paper.progress || 0) : 0;
            
            totalTargetProgress += gp.targetProgress;
            totalActualProgress += actualProgress;
            
            paperRowsHtml += `
                <div class="goal-paper-row">
                    <div class="goal-paper-title" title="${escapeHTML(paperTitle)}">${escapeHTML(paperTitle)}</div>
                    <div class="goal-paper-pct">
                        <span style="color: var(--text-muted); font-size: 0.75rem;">%${actualProgress}</span>
                        <span style="color: var(--text-muted); font-size: 0.75rem;">/</span>
                        <span style="color: var(--primary); font-size: 0.75rem; font-weight:700;">%${gp.targetProgress}</span>
                    </div>
                </div>
            `;
        });
        
        const count = goal.papers.length;
        const avgTarget = count > 0 ? Math.round(totalTargetProgress / count) : 0;
        const avgActual = count > 0 ? Math.round(totalActualProgress / count) : 0;
        
        // Days remaining calculation
        const targetDateObj = new Date(goal.targetDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        const diffTime = targetDateObj - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let daysBadgeHtml = '';
        if (diffDays < 0) {
            daysBadgeHtml = `<span style="font-size:0.75rem; color:var(--danger); font-weight:600;"><i data-lucide="alert-triangle" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:0.25rem;"></i>Gecikmiş (${Math.abs(diffDays)} gün)</span>`;
        } else if (diffDays === 0) {
            daysBadgeHtml = `<span style="font-size:0.75rem; color:var(--warning); font-weight:600;"><i data-lucide="clock" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:0.25rem;"></i>Bugün son gün!</span>`;
        } else {
            daysBadgeHtml = `<span style="font-size:0.75rem; color:var(--success); font-weight:600;"><i data-lucide="calendar" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:0.25rem;"></i>${diffDays} gün kaldı</span>`;
        }
        
        const card = document.createElement('div');
        card.className = 'goal-card';
        card.innerHTML = `
            <div class="goal-card-header">
                <div style="flex:1; min-width:0;">
                    <h3 class="goal-card-title" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHTML(goal.title)}">${escapeHTML(goal.title)}</h3>
                    <div class="goal-card-date" style="margin-top:0.25rem;">
                        ${daysBadgeHtml}
                        <span style="margin-left:0.5rem;">(${goal.targetDate})</span>
                    </div>
                </div>
                <div style="display: flex; gap: 0.25rem; margin-top: -0.25rem;">
                    <button class="btn-icon btn-sm btn-edit-goal" title="Hedefi Düzenle" data-id="${goal.id}">
                        <i data-lucide="edit-3" style="width:14px; height:14px;"></i>
                    </button>
                    <button class="btn-icon btn-sm btn-icon-danger btn-delete-goal" title="Hedefi Sil" data-id="${goal.id}">
                        <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
                    </button>
                </div>
            </div>
            
            <div class="goal-progress-wrapper">
                <div class="goal-progress-label">
                    <span>Okuma İlerlemesi (Gerçekleşen / Hedef):</span>
                    <strong>%${avgActual} / %${avgTarget}</strong>
                </div>
                <div class="goal-progress-bar-bg">
                    <div class="goal-progress-bar-target" style="width: ${avgTarget}%"></div>
                    <div class="goal-progress-bar-actual" style="width: ${avgActual}%"></div>
                </div>
            </div>
            
            <div class="goal-papers-list" style="margin-top:0.5rem;">
                ${paperRowsHtml}
            </div>
        `;
        
        card.querySelector('.btn-edit-goal').addEventListener('click', (e) => {
            e.stopPropagation();
            openEditGoalModal(goal.id);
        });
        
        card.querySelector('.btn-delete-goal').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteGoal(goal.id);
        });
        
        elements.goalsList.appendChild(card);
    });
    
    lucide.createIcons();
}

// Start the app on DOM Load
document.addEventListener('DOMContentLoaded', init);
