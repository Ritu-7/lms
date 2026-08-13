const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
    { search: /dark:bg-slate-950/g, replace: 'dark:bg-dk-base' },
    { search: /dark:bg-slate-900/g, replace: 'dark:bg-dk-surface' },
    { search: /dark:bg-slate-800/g, replace: 'dark:bg-dk-surface-2' },
    { search: /dark:border-white\/10/g, replace: 'dark:border-dk-border' },
    { search: /dark:border-white\/5/g, replace: 'dark:border-dk-border-2' },
    { search: /dark:border-white\/7/g, replace: 'dark:border-dk-border' },
    { search: /dark:border-white\/8/g, replace: 'dark:border-dk-border' },
    { search: /dark:text-white/g, replace: 'dark:text-dk-text' },
    { search: /dark:text-slate-100/g, replace: 'dark:text-dk-text' },
    { search: /dark:text-slate-200/g, replace: 'dark:text-dk-text' },
    { search: /dark:text-slate-300/g, replace: 'dark:text-dk-text-2' },
    { search: /dark:text-slate-400/g, replace: 'dark:text-dk-text-2' },
    { search: /dark:text-slate-500/g, replace: 'dark:text-dk-text-3' },
    { search: /dark:bg-white\/5/g, replace: 'dark:bg-dk-surface' },
    { search: /dark:bg-white\/10/g, replace: 'dark:bg-dk-surface-2' },
    { search: /dark:hover:bg-white\/5/g, replace: 'dark:hover:bg-dk-surface-2' },
    { search: /dark:hover:bg-white\/10/g, replace: 'dark:hover:bg-dk-surface-2' },
];

function processDirectory(directory) {
    fs.readdir(directory, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        files.forEach(file => {
            const filePath = path.join(directory, file);

            fs.stat(filePath, (err, stat) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    return;
                }

                if (stat.isDirectory()) {
                    processDirectory(filePath);
                } else if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
                    processFile(filePath);
                }
            });
        });
    });
}

function processFile(filePath) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        let updatedData = data;
        let modified = false;

        replacements.forEach(rep => {
            if (rep.search.test(updatedData)) {
                updatedData = updatedData.replace(rep.search, rep.replace);
                modified = true;
            }
        });

        // Admin-specific background adjustment: Admin pages get #0D0D10 content area instead of base
        if (filePath.includes('src\\pages\\admin') && filePath.includes('.tsx')) {
            if (updatedData.includes('dark:bg-dk-base')) {
               updatedData = updatedData.replace(/dark:bg-dk-base/g, 'dark:bg-[#0D0D10]');
               modified = true;
            }
        }

        if (modified) {
            fs.writeFile(filePath, updatedData, 'utf8', err => {
                if (err) {
                    console.error('Error writing file:', err);
                } else {
                    console.log(`Updated ${filePath}`);
                }
            });
        }
    });
}

processDirectory(directoryPath);
