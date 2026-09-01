import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CallsList from "./CallsList";

describe("CallsList", () => {
  it("con calls=null y loading, muestra el estado de carga", () => {
    render(<CallsList calls={null} loading={true} />);
    expect(screen.getByText("Cargando llamadas…")).toBeInTheDocument();
  });

  it("con un error, lo muestra en vez de la lista", () => {
    render(<CallsList calls={null} loading={false} error="no se pudo cargar" />);
    expect(screen.getByText("no se pudo cargar")).toBeInTheDocument();
  });

  it("con una lista vacía, muestra el estado honesto de 'todavía no hubo ninguna llamada' — nunca datos inventados", () => {
    render(<CallsList calls={[]} loading={false} />);
    expect(screen.getByText("Todavía no hubo ninguna llamada")).toBeInTheDocument();
  });

  it("renderiza una llamada real con su duración, número y resultado", () => {
    render(
      <CallsList
        calls={[
          {
            id: 1,
            started_at: "2026-09-01T10:00:00Z",
            duration_seconds: 125,
            caller_number: "+17865551234",
            outcome: "completed",
            transcript: null,
          },
        ]}
        loading={false}
      />
    );
    expect(screen.getByText("+17865551234")).toBeInTheDocument();
    expect(screen.getByText("2:05")).toBeInTheDocument();
    expect(screen.getByText("Completada")).toBeInTheDocument();
  });

  it("sin número de llamante, avisa que no está disponible en vez de mostrar vacío", () => {
    render(
      <CallsList
        calls={[{ id: 1, started_at: "2026-09-01T10:00:00Z", duration_seconds: 30, caller_number: null, outcome: "transferred", transcript: null }]}
        loading={false}
      />
    );
    expect(screen.getByText("Número no disponible")).toBeInTheDocument();
    expect(screen.getByText("Transferida")).toBeInTheDocument();
  });

  it("clickear una llamada con transcripción real la expande y muestra los mensajes", async () => {
    const user = userEvent.setup();
    const transcript = JSON.stringify([
      { type: "message", role: "assistant", content: ["Hola, gracias por llamar"] },
      { type: "message", role: "user", content: ["Quiero una cotización"] },
    ]);
    render(
      <CallsList
        calls={[{ id: 1, started_at: "2026-09-01T10:00:00Z", duration_seconds: 40, caller_number: "+17865551234", outcome: "completed", transcript }]}
        loading={false}
      />
    );

    expect(screen.queryByText("Hola, gracias por llamar")).not.toBeInTheDocument();
    await user.click(screen.getByText("+17865551234"));
    expect(await screen.findByText("Hola, gracias por llamar")).toBeInTheDocument();
    expect(screen.getByText("Quiero una cotización")).toBeInTheDocument();
  });

  it("una transcripción vacía o corrupta no rompe el render, solo no queda nada para expandir", () => {
    render(
      <CallsList
        calls={[{ id: 1, started_at: "2026-09-01T10:00:00Z", duration_seconds: 10, caller_number: "+1", outcome: "error", transcript: "esto no es JSON válido" }]}
        loading={false}
      />
    );
    expect(screen.getByText("Error")).toBeInTheDocument();
  });
});
