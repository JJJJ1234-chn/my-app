// src/fetchIridium.ts

// —— 空导出，让 TypeScript 把它识别为模块 ——  
export {};

/**
 * 动态拉取 Iridium-NEXT 66 颗卫星的 TLE
 * 来源：CelesTrak GP API
 */
export async function fetchIridiumTLE(): Promise<[string, string][]> {
  const url =
    'https://celestrak.org/NORAD/elements/gp.php?FORMAT=tle&GROUP=iridium-NEXT';
  const resp = await fetch(url, { mode: 'cors' });
  if (!resp.ok) {
    throw new Error(`TLE 拉取失败: ${resp.status}`);
  }
  const text = await resp.text();
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.startsWith('1 ') || l.startsWith('2 '));
  const tleList: [string, string][] = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    tleList.push([lines[i], lines[i + 1]]);
  }
  return tleList;
}