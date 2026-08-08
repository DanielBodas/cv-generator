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
