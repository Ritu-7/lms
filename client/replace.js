const fs = require('fs');
const path = require('path');

const dirs = [
  'd:/lms-copy/lms/client/src/pages/admin',
  'd:/lms-copy/lms/client/src/components/admin'
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      processDir(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Borders
      content = content.replace(/dark:border-white\/10/g, 'dark:border-dk-border');
      content = content.replace(/dark:border-white\/5/g, 'dark:border-dk-border');

      // Cards / Panels
      content = content.replace(/dark:bg-slate-900/g, 'dark:bg-dk-surface');
      
      // Backgrounds
      if (file === 'AdminSidebar.tsx') {
        content = content.replace(/dark:bg-slate-950/g, 'dark:bg-dk-base');
      } else {
        content = content.replace(/dark:bg-slate-950/g, 'dark:bg-[#0D0D10]');
      }
      
      // Specifically fix Analytics.tsx if it doesn't have dark mode bg
      if (file === 'Analytics.tsx' && !content.includes('dark:bg-[')) {
         content = content.replace('bg-gray-50/30', 'bg-gray-50/30 dark:bg-[#0D0D10]');
      }

      if (file === 'AdminLayout.tsx' && !content.includes('dark:bg-')) {
         content = content.replace('bg-gray-50', 'bg-gray-50 dark:bg-[#0D0D10]');
      }

      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

dirs.forEach(processDir);
console.log('Done replacement script.');
