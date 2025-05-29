import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractDate(fileName: string): string | null {
  const now = new Date();
  const currentYear = now.getFullYear();

  // パターン: YYYY-MM-DD
  let m = fileName.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }

  // パターン: YYYY_MM_DD
  m = fileName.match(/(\d{4})_(\d{1,2})_(\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }

  // パターン: YYYY.MM.DD
  m = fileName.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }

  // パターン: YYYYMMDD
  m = fileName.match(/(\d{4})(\d{2})(\d{2})/);
  if (m) {
    return `${m[1]}-${m[2]}-${m[3]}`;
  }

  // パターン: YYYY年MM月DD日
  m = fileName.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }

  // パターン: YYMMDD（年2桁）
  m = fileName.match(/(\d{2})(\d{2})(\d{2})/);
  if (m) {
    return `20${m[1]}-${m[2]}-${m[3]}`;
  }

  // パターン: MM-DD または M-D（年なし、今年を補完）
  m = fileName.match(/(\d{1,2})-(\d{1,2})/);
  if (m) {
    return `${currentYear}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }

  // パターン: MM_DD（年なし、今年を補完）
  m = fileName.match(/(\d{1,2})_(\d{1,2})/);
  if (m) {
    return `${currentYear}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }

  // パターン: MM.DD（年なし、今年を補完）
  m = fileName.match(/(\d{1,2})\.(\d{1,2})/);
  if (m) {
    return `${currentYear}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }

  // パターン: M月D日（年なし、今年を補完）
  m = fileName.match(/(\d{1,2})月(\d{1,2})日/);
  if (m) {
    return `${currentYear}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }

  return null;
}
