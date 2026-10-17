const Exporter = {
    toXlsx(sheetsData, filename = 'ActiveTabs_Export') {
        if (typeof XLSX === 'undefined') {
            alert('SheetJS library not loaded.');
            return;
        }

        const wb = XLSX.utils.book_new();

        Object.entries(sheetsData).forEach(([sheetName, grid]) => {
            if (grid.length > 0) {
                const ws = XLSX.utils.aoa_to_sheet(grid);
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            }
        });

        XLSX.writeFile(wb, `${filename}.xlsx`);
    },

    toCsv(grid, filename = 'ActiveTabs_Export') {
        const csvContent = grid.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        this.downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
    },

    toJson(grid, filename = 'ActiveTabs_Export') {
        if (grid.length < 2) return;

        const headers = grid[0];
        const rows = grid.slice(1);

        const jsonObjects = rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] || '';
            });
            return obj;
        });

        const jsonString = JSON.stringify(jsonObjects, null, 2);
        this.downloadFile(jsonString, `${filename}.json`, 'application/json');
    },

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};