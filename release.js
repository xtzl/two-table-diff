#!/usr/bin/env node
/**
 * 发版脚本
 * 用法：node release.js 1.3.1 "这次改了什么"
 *
 * 做三件事：
 *   1. 把 index.html 里的 APP_VERSION / BUILD_TIME 更新成新版本号和当前时间
 *   2. 在 README 的「更新日志」最前面插一条
 *   3. git add / commit / push
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ver = (process.argv[2] || '').replace(/^v/, '');
const note = process.argv[3] || '';

if (!/^\d+\.\d+\.\d+$/.test(ver)) {
  console.error('用法: node release.js <1.3.1> "更新说明"');
  process.exit(1);
}

const dir = __dirname;
const htmlPath = path.join(dir, 'index.html');
const readmePath = path.join(dir, 'README.md');

const now = new Date();
const p = (n) => String(n).padStart(2, '0');
const stamp = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}`;

let html = fs.readFileSync(htmlPath, 'utf8');
const before = html;
html = html.replace(/var APP_VERSION = '[^']*';/, `var APP_VERSION = 'v${ver}';`);
html = html.replace(/var BUILD_TIME = '[^']*';/, `var BUILD_TIME = '${stamp}';`);
if (html === before) {
  console.error('✗ index.html 里没找到 APP_VERSION / BUILD_TIME 字段');
  process.exit(1);
}
fs.writeFileSync(htmlPath, html);

let readme = fs.readFileSync(readmePath, 'utf8');
const entry = `- **v${ver}** ${stamp}${note ? ' — ' + note : ''}`;
if (readme.includes('## 更新日志')) {
  readme = readme.replace(/(## 更新日志\n\n)/, `$1${entry}\n`);
} else {
  readme = readme.trimEnd() + `\n\n## 更新日志\n\n${entry}\n`;
}
fs.writeFileSync(readmePath, readme);

const git = (...args) =>
  execFileSync('git', args, { cwd: dir, stdio: 'inherit' });

try {
  git('add', '-A');
  git('-c', 'user.name=xtzl', '-c', 'user.email=xtzl@users.noreply.github.com',
      'commit', '-m', `release: v${ver}${note ? ' ' + note : ''}`);
  git('push', 'origin', 'main');
} catch (e) {
  console.error('\n✗ git 操作失败，可能是没有改动或推送被拒');
  process.exit(1);
}

console.log(`\n✓ 已发布 v${ver} · ${stamp}`);
console.log('  线上约 30~60 秒后生效：https://xtzl.github.io/two-table-diff/');
