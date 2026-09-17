// Helpers compartidos para mostrar una llamada real — parseo del transcript,
// formato de fecha/duración, y el mapeo de outcome a etiqueta/color.
// Extraído de CallsList (que los usaba solo internamente) para que Registros
// (la lista y el detalle de una llamada, a nivel de toda la agencia) pueda
// mostrar exactamente el mismo formato sin duplicar esta lógica.

export function parseTranscript(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return parsed
      .filter((item) => item.type === "message" && Array.isArray(item.content))
      .map((item) => ({ role: item.role, content: item.content.join(" ") }));
  } catch {
    return [];
  }
}

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatDate(iso) {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return d.toLocaleString("es-NI", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function formatDateLong(iso) {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return d.toLocaleString("es-NI", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const OUTCOME_LABEL = {
  completed: "Completada",
  transferred: "Transferida",
  max_duration_reached: "Cortada por duración",
  error: "Error",
};

export const OUTCOME_HUE = {
  completed: "green",
  transferred: "",
  max_duration_reached: "amber",
  error: "red",
};
