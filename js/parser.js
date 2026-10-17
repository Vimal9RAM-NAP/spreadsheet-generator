const Parser = {
    parse(input, options = { delimiter: 'auto', hasHeader: true }) {
        if (!input || !input.trim()) return [];

        const cleanInput = input.trim();

        if (options.delimiter === 'json' || (cleanInput.startsWith('[') && cleanInput.endsWith(']'))) {
            try {
                const parsed = JSON.parse(cleanInput);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return this.convertJsonToGrid(parsed);
                }
            } catch (e) {}
        }

        if (options.delimiter === 'markdown' || (cleanInput.includes('|') && cleanInput.includes('---'))) {
            return this.parseMarkdownTable(cleanInput);
        }

        const delimiter = options.delimiter === 'auto' ? this.detectDelimiter(cleanInput) : options.delimiter;
        return this.parseDelimitedText(cleanInput, delimiter);
    },

    parseMarkdownTable(text) {
        const lines = text.split('\n').filter(line => line.trim().startsWith('|'));
        const grid = [];

        lines.forEach(line => {
            if (line.includes('---')) return;

            const cells = line
                .split('|')
                .slice(1, -1)
                .map(cell => cell.trim());

            if (cells.length > 0) grid.push(cells);
        });

        return grid;
    },

    parseDelimitedText(text, delimiter) {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        return lines.map(line => line.split(delimiter).map(cell => cell.trim()));
    },

    convertJsonToGrid(jsonArr) {
        if (typeof jsonArr[0] !== 'object') {
            return [['Value'], ...jsonArr.map(val => [val])];
        }

        const headers = Object.keys(jsonArr[0]);
        const rows = jsonArr.map(obj => headers.map(key => obj[key] !== undefined ? obj[key] : ''));

        return [headers, ...rows];
    },

    detectDelimiter(text) {
        const firstLine = text.split('\n')[0] || '';
        const counts = {
            ',': (firstLine.match(/,/g) || []).length,
            '\t': (firstLine.match(/\t/g) || []).length,
            ':': (firstLine.match(/;/g) || []).length,
            '|': (firstLine.match(/\|/g) || []).length
        };

        let best = ',';
        let max = 0;
        for (const [delim, count] of Object.entries(counts)) {
            if (count > max) {
                max = count;
                best = delim;
            }
        }
        return best;
    }
};