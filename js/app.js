document.addEventListener('DOMContentLoaded', () => {
    const rawInput = document.getElementById('rawInput');
    const delimiterSelect = document.getElementById('delimiterSelect');
    const hasHeader = document.getElementById('hasHeader');
    const multiTableDetect = document.getElementById('multiTableDetect');
    const resetBtn = document.getElementById('resetBtn');
    const filenameInput = document.getElementById('filenameInput');
    
    const tabsBar = document.getElementById('tabsBar');
    const addSheetBtn = document.getElementById('addSheetBtn');
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    const dataStats = document.getElementById('dataStats');
    
    const downloadBtn = document.getElementById('downloadBtn');
    const exportDropdown = document.querySelector('.export-options');
    const exportXlsx = document.getElementById('exportXlsx');
    const exportCsv = document.getElementById('exportCsv');
    const exportJson = document.getElementById('exportJson');

    let sheetsStore = {
        'Sheet 1': { text: '', grid: [] }
    };
    let activeSheet = 'Sheet 1';
    let sheetCounter = 1;

    const processInput = () => {
        const text = rawInput.value;

        if (multiTableDetect && multiTableDetect.checked && containsMultipleTables(text)) {
            splitAndPopulateMultiTables(text);
            return;
        }

        const grid = Parser.parse(text, {
            delimiter: delimiterSelect.value,
            hasHeader: hasHeader.checked
        });

        sheetsStore[activeSheet] = { text, grid };
        renderTable(grid);
    };

    function containsMultipleTables(text) {
        if (!text) return false;
        const markdownTableMatches = text.match(/(\|.+|[\r\n]+){2,}/g);
        return markdownTableMatches && markdownTableMatches.length > 1;
    }

    function splitAndPopulateMultiTables(text) {
        const tableBlocks = text.match(/(\|.+|[\r\n]+){2,}/g) || [];
        if (tableBlocks.length <= 1) return;

        sheetsStore = {};
        tableBlocks.forEach((block, index) => {
            const sheetName = `Sheet ${index + 1}`;
            const grid = Parser.parse(block.trim(), {
                delimiter: delimiterSelect.value,
                hasHeader: hasHeader.checked
            });
            sheetsStore[sheetName] = { text: block.trim(), grid };
        });

        sheetCounter = tableBlocks.length;
        activeSheet = 'Sheet 1';
        rawInput.value = sheetsStore[activeSheet].text;
        renderTabs();
        renderTable(sheetsStore[activeSheet].grid);
    }

    function renderTabs() {
        const existingTabs = tabsBar.querySelectorAll('.tab-item:not(.add-tab-btn)');
        existingTabs.forEach(tab => tab.remove());

        Object.keys(sheetsStore).forEach(sheetName => {
            const tabBtn = document.createElement('button');
            tabBtn.className = `tab-item ${sheetName === activeSheet ? 'active' : ''}`;
            tabBtn.dataset.sheet = sheetName;
            
            const closeSpan = Object.keys(sheetsStore).length > 1 
                ? `<span class="close-tab" data-close="${sheetName}">×</span>` 
                : '';

            tabBtn.innerHTML = `${sheetName} ${closeSpan}`;

            tabBtn.addEventListener('click', (e) => {
                if (e.target.classList.contains('close-tab')) {
                    e.stopPropagation();
                    deleteSheet(e.target.dataset.close);
                    return;
                }
                switchSheet(sheetName);
            });

            tabsBar.insertBefore(tabBtn, addSheetBtn);
        });
    }

    function switchSheet(sheetName) {
        if (!sheetsStore[sheetName]) return;
        activeSheet = sheetName;
        rawInput.value = sheetsStore[activeSheet].text || '';
        renderTabs();
        renderTable(sheetsStore[activeSheet].grid || []);
    }

    addSheetBtn.addEventListener('click', () => {
        sheetCounter++;
        const newSheetName = `Sheet ${sheetCounter}`;
        sheetsStore[newSheetName] = { text: '', grid: [] };
        switchSheet(newSheetName);
    });

    function deleteSheet(sheetName) {
        if (Object.keys(sheetsStore).length <= 1) return;
        delete sheetsStore[sheetName];

        if (activeSheet === sheetName) {
            activeSheet = Object.keys(sheetsStore)[0];
        }

        switchSheet(activeSheet);
    }

    function renderTable(grid) {
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        if (!grid || grid.length === 0) {
            dataStats.textContent = '0 Rows × 0 Cols';
            tableBody.innerHTML = `<tr><td colspan="3" class="empty-state">No data generated yet. Paste raw data into Ingestion and select format below.</td></tr>`;
            return;
        }

        const containsHeader = hasHeader.checked;
        const headers = containsHeader ? grid[0] : grid[0].map((_, i) => `Col ${i + 1}`);
        const rows = containsHeader ? grid.slice(1) : grid;

        let headerRowHtml = `<th>#</th>`;
        headers.forEach(h => headerRowHtml += `<th>${escapeHtml(h)}</th>`);
        tableHead.innerHTML = headerRowHtml;

        rows.forEach((row, rowIndex) => {
            let rowHtml = `<tr><td>${rowIndex + 1}</td>`;
            headers.forEach((_, colIndex) => {
                const cellVal = row[colIndex] !== undefined ? escapeHtml(row[colIndex]) : '';
                rowHtml += `<td>${cellVal}</td>`;
            });
            rowHtml += `</tr>`;
            tableBody.innerHTML += rowHtml;
        });

        dataStats.textContent = `${rows.length} Rows × ${headers.length} Cols`;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    rawInput.addEventListener('input', processInput);
    delimiterSelect.addEventListener('change', processInput);
    hasHeader.addEventListener('change', processInput);
    if (multiTableDetect) multiTableDetect.addEventListener('change', processInput);

    resetBtn.addEventListener('click', () => {
        rawInput.value = '';
        sheetCounter = 1;
        sheetsStore = { 'Sheet 1': { text: '', grid: [] } };
        activeSheet = 'Sheet 1';
        renderTabs();
        renderTable([]);
    });

    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.download-dropdown')) {
            exportDropdown.classList.remove('show');
        }
    });

    exportXlsx.addEventListener('click', () => {
        exportDropdown.classList.remove('show');
        const exportWorkbookData = {};
        Object.entries(sheetsStore).forEach(([sheetName, data]) => {
            if (data.grid && data.grid.length > 0) {
                exportWorkbookData[sheetName] = data.grid;
            }
        });
        Exporter.toXlsx(exportWorkbookData, filenameInput.value || 'ActiveTabs_Export');
    });

    exportCsv.addEventListener('click', () => {
        exportDropdown.classList.remove('show');
        const currentGrid = sheetsStore[activeSheet]?.grid || [];
        Exporter.toCsv(currentGrid, `${filenameInput.value || 'ActiveTabs_Export'}_${activeSheet}`);
    });

    exportJson.addEventListener('click', () => {
        exportDropdown.classList.remove('show');
        const currentGrid = sheetsStore[activeSheet]?.grid || [];
        Exporter.toJson(currentGrid, `${filenameInput.value || 'ActiveTabs_Export'}_${activeSheet}`);
    });

    renderTabs();
});