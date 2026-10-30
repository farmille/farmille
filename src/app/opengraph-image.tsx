import { ImageResponse } from "next/og";

export const alt = "Farmille";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "88px",
        color: "#ffffff",
        background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 58%, #66bb6a 100%)",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 92,
          fontWeight: 800,
          letterSpacing: "-0.04em",
        }}
      >
        Farmille
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 28,
          fontSize: 36,
          fontWeight: 600,
          lineHeight: 1.5,
        }}
      >
        農業資材の製品情報・感想口コミ・実証詳細レポート
      </div>
    </div>,
    size,
  );
}
