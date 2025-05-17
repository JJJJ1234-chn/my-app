// src/timeHelpers.ts

/**
 * 将 "13:30" 字符串解析为 Date 对象（当天 UTC 时间）
 * @param lstString - 形如 "13:30"
 * @returns Date
 */
export function parseLSTtoUTC(lstString: string): Date {
  const [hourStr, minuteStr] = lstString.split(':');
  const date = new Date();
  date.setUTCHours(parseInt(hourStr), parseInt(minuteStr), 0, 0);
  return date;
}

/**
 * 计算两个时间的差（单位：秒）
 * @param t1 - 时间 1
 * @param t2 - 时间 2
 * @returns 差值（秒）
 */
export function secondsBetween(t1: Date, t2: Date): number {
  return Math.abs((t1.getTime() - t2.getTime()) / 1000);
}

/**
 * 将秒数格式化为 mm:ss 或 hh:mm:ss 字符串
 * @param seconds - 总秒数
 * @returns 格式化字符串
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  } else {
    return `${pad(m)}:${pad(s)}`;
  }
}

function pad(n: number): string {
  return n < 10 ? '0' + n : n.toString();
}