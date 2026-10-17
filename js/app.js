document.addEventListener('DOMContentLoaded', () => {
    const rawInput = document.getElementById('rawInput');
    const delimiterSelect = document.getElementById('delimiterSelect');
    const hasHeader = document.getElementById('hasHeader');
    const resetBtn = document.getElementById('resetBtn');
    const filenameInput = document.getElementById('filenameInput');
    
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    const dataStats = document.getElementById('dataStats');
    
    const exportXlsx = document.getElementById('exportXlsx');
    const exportCsv = document.getElementById('exportCsv');
    const exportJson = document.getElementById('exportJson');

    let sheetsStore = {
        'Sheet1': []
    };
    let activeSheet = 'Sheet1';

    const processInput = () => {
        const text = rawInput.value;
        const grid = Parser.parse(text, {
            delimiter: delimiterSelect.value,
            hasHeader: hasHeader.checked
        });

        sheetsStore[activeSheet] = grid;
        renderTable(grid);
    };

    rawInput.addEventListener('input', processInput);
    delimiterSelect.addEventListener('change', processInput);
    hasHeader.addEventListener('change', processInput);

    resetBtn.addEventListener('click', () => {
        rawInput.value = '';
        sheetsStore = { 'Sheet1': [] };
        renderTable([]);
    });

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
        headers.forEach(h => headerRowHtml += `<th>${h}</th>`);
        tableHead.innerHTML = headerRowHtml;

        rows.forEach((row, rowIndex) => {
            let rowHtml = `<tr><td>${rowIndex + 1}</td>`;
            headers.forEach((_, colIndex) => {
                rowHtml += `<td>${row[colIndex] !== undefined ? row[colIndex] : ''}</td>`;
            });
            rowHtml += `</tr>`;
            tableBody.innerHTML += rowHtml;
        });

        dataStats.textContent = `${rows.length} Rows × ${headers.length} Cols`;
    }

    exportXlsx.addEventListener('click', () => {
        Exporter.toXlsx(sheetsStore, filenameInput.value || 'ActiveTabs_Export');
    });

    exportCsv.addEventListener('click', () => {
        Exporter.toCsv(sheetsStore[activeSheet] || [], filenameInput.value || 'ActiveTabs_Export');
    });

    exportJson.addEventListener('click', () => {
        Exporter.toJson(sheetsStore[activeSheet] || [], filenameInput.value || 'ActiveTabs_Export');
    });
});