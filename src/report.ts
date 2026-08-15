/**
 * Aggregation logic for WebRTC `RTCPeerConnection.getStats()` dumps.
 *
 * A dump is a JSON array (or id-keyed object) of RTCStats records. This module
 * pulls out the inbound/outbound RTP records and renders a compact Markdown
 * table you can paste into a bug report.
 */

export interface RtcStat {
  type?: string;
  kind?: string;
  mediaType?: string;
  ssrc?: number;
  codecId?: string;
  mimeType?: string;
  id?: string;
  packetsReceived?: number;
  packetsSent?: number;
  packetsLost?: number;
  bytesReceived?: number;
  bytesSent?: number;
  jitter?: number;
  framesPerSecond?: number;
}

export interface StreamRow {
  direction: "inbound" | "outbound";
  kind: string;
  codec: string;
  kib: number;
  lossPct: number;
  jitterMs: number | null;
  fps: number | null;
}

function toRecords(raw: unknown): RtcStat[] {
  if (Array.isArray(raw)) return raw as RtcStat[];
  if (raw && typeof raw === "object") return Object.values(raw as Record<string, RtcStat>);
  return [];
}

function codecMap(records: RtcStat[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of records) {
    if (r.type === "codec" && r.id) {
      map.set(r.id, r.mimeType ? r.mimeType.split("/").pop()! : r.id);
    }
  }
  return map;
}

export function collect(raw: unknown): StreamRow[] {
  const records = toRecords(raw);
  const codecs = codecMap(records);
  const rows: StreamRow[] = [];
  for (const r of records) {
    const t = r.type ?? "";
    if (t !== "inbound-rtp" && t !== "outbound-rtp" && t !== "remote-inbound-rtp") continue;
    const direction = t.startsWith("outbound") ? "outbound" : "inbound";
    const packets = r.packetsReceived ?? r.packetsSent ?? 0;
    const lost = r.packetsLost ?? 0;
    const total = packets + lost;
    rows.push({
      direction,
      kind: r.kind ?? r.mediaType ?? "?",
      codec: (r.codecId && codecs.get(r.codecId)) || "?",
      kib: (r.bytesReceived ?? r.bytesSent ?? 0) / 1024,
      lossPct: total ? (lost / total) * 100 : 0,
      jitterMs: r.jitter != null ? r.jitter * 1000 : null,
      fps: r.framesPerSecond ?? null,
    });
  }
  return rows;
}

export function renderMarkdown(rows: StreamRow[]): string {
  if (rows.length === 0) return "_No inbound/outbound RTP records found._";
  const header =
    "| Dir | Kind | Codec | KiB | Loss % | Jitter (ms) | FPS |\n" +
    "| --- | --- | --- | ---: | ---: | ---: | ---: |";
  const body = rows
    .map(
      (r) =>
        `| ${r.direction} | ${r.kind} | ${r.codec} | ${r.kib.toFixed(1)} | ` +
        `${r.lossPct.toFixed(2)} | ${r.jitterMs != null ? r.jitterMs.toFixed(1) : "-"} | ` +
        `${r.fps != null ? r.fps.toFixed(0) : "-"} |`,
    )
    .join("\n");
  return `${header}\n${body}`;
}
