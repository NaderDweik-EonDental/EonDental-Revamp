#!/usr/bin/env node

const apps = [
  { name: 'Shell', url: 'http://localhost:5000/' },
  { name: 'Case submission', url: 'http://localhost:5001/' },
  { name: 'Smile simulation', url: 'http://localhost:5002/' },
  { name: '3D viewer', url: 'http://localhost:5003/' },
];

console.log('');
console.log('EON local apps');
console.log('──────────────');
for (const app of apps) {
  console.log(`${app.name}`);
  console.log(`  ${app.url}`);
}
console.log('');
