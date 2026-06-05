// 공유 폰트 등록 — 단일 모듈에서만 register (이중 등록 방지)
// 여러 PDF 컴포넌트(DesignReport, ConceptDeck)가 이것을 import

import { Font } from "@react-pdf/renderer";

let registered = false;

export function ensureFonts() {
  if (registered) return;
  registered = true;
  Font.register({
    family: "NanumGothic",
    fonts: [
      { src: "https://cdn.jsdelivr.net/npm/@fontsource/nanum-gothic@latest/files/nanum-gothic-korean-400-normal.woff2", fontWeight: 400 },
      { src: "https://cdn.jsdelivr.net/npm/@fontsource/nanum-gothic@latest/files/nanum-gothic-korean-700-normal.woff2", fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((w) => [w]);
}
