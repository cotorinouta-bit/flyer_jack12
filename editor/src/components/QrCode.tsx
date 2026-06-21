import QRCode from "qrcode";
import { useMemo } from "react";

// URL から同期的に QR を SVG 生成（外部通信なし・書き出しでも確実に描画）
export function QrCode({ value, size = 120, fg = "#1C1918", margin = 2 }: { value: string; size?: number; fg?: string; margin?: number }) {
  const svg = useMemo(() => {
    try {
      const qr = QRCode.create(value || " ", { errorCorrectionLevel: "M" });
      const n = qr.modules.size;
      const data = qr.modules.data;
      const dim = n + margin * 2;
      let rects = "";
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          if (data[y * n + x]) rects += `<rect x="${x + margin}" y="${y + margin}" width="1" height="1"/>`;
        }
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${dim}" height="${dim}" fill="#ffffff"/><g fill="${fg}">${rects}</g></svg>`;
    } catch {
      return "";
    }
  }, [value, size, fg, margin]);
  return <span style={{ display: "inline-block", lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: svg }} />;
}
