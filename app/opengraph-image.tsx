import { ImageResponse } from "next/og";

export const alt = "Garage Lobster – Every car in your garage, fully documented";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ fontSize: 96 }}>🦞</div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#a1a1aa",
            }}
          >
            Garage Lobster
          </div>
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Every car in your garage, fully documented.
        </div>
        <div style={{ marginTop: 32, fontSize: 32, color: "#a1a1aa" }}>
          Maintenance, mods and specs for the DIY garage.
        </div>
      </div>
    ),
    size,
  );
}
