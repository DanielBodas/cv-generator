import fs from 'fs';
import path from 'path';

const dirs = ['config', 'css', 'jss', 'sections'];

dirs.forEach(dir => {
    const src = path.join(process.cwd(), dir);
    const dest = path.join(process.cwd(), 'dist', dir);
    try {
        if (fs.existsSync(src)) {
            // fs.cpSync is available in Node 16.7.0+
            fs.cpSync(src, dest, { recursive: true });
            console.log(`Successfully copied ${dir} to dist/${dir}`);
        } else {
            console.warn(`Source directory ${dir} does not exist.`);
        }
    } catch (err) {
        console.error(`Error copying ${dir} to dist:`, err);
    }
});

// Copy favicon files directly to dist root so browsers can locate them automatically
const faviconFiles = ['favicon.svg', 'favicon.png', 'favicon.ico'];
faviconFiles.forEach(file => {
    try {
        const src = path.join(process.cwd(), file);
        const dest = path.join(process.cwd(), 'dist', file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`Successfully copied ${file} to dist/${file}`);
        } else {
            console.warn(`Source ${file} does not exist.`);
        }
    } catch (err) {
        console.error(`Error copying ${file} to dist:`, err);
    }
});
