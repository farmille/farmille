import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Farmille — 農家が選ぶ BS 資材レビュー";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#3A7F5C",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          padding: "80px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 144, fontWeight: 700, letterSpacing: -2 }}>
          Farmille
        </div>
        <div style={{ fontSize: 56, marginTop: 32, opacity: 0.95 }}>
          BS資材の農家レビュー
        </div>
        <div style={{ fontSize: 32, marginTop: 48, opacity: 0.85 }}>
          farmer × JA × researcher × maker
        </div>
      </div>
    ),
    { ...size },
  );
}
