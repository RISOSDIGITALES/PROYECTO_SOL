import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CustomersList from "./CustomersList";

const baseCustomer = {
  id: 1,
  business_id: 1,
  phone: "+13055550199",
  name: "",
  email: "",
  stage: "new",
  tags: "",
  notes: "",
  calls_count: 1,
  last_call_at: "2026-09-21T15:00:00Z",
  created_at: "2026-09-21T15:00:00Z",
  updated_at: "2026-09-21T15:00:00Z",
};

describe("CustomersList", () => {
  it("con customers=null y loading, muestra el estado de carga", () => {
    render(<CustomersList customers={null} loading={true} />);
    expect(screen.getByText("Cargando clientes…")).toBeInTheDocument();
  });

  it("con un error, lo muestra en vez de la lista", () => {
    render(<CustomersList customers={null} loading={false} error="no se pudo cargar" />);
    expect(screen.getByText("no se pudo cargar")).toBeInTheDocument();
  });

  it("con una lista vacía, muestra el estado honesto -- nunca un cliente inventado", () => {
    render(<CustomersList customers={[]} loading={false} />);
    expect(screen.getByText("Todavía no hay ningún cliente")).toBeInTheDocument();
  });

  it("sin nombre todavía, muestra el teléfono como identificador principal", () => {
    render(<CustomersList customers={[baseCustomer]} loading={false} onUpdate={vi.fn()} />);
    expect(screen.getByText("+13055550199")).toBeInTheDocument();
  });

  it("con nombre real, lo muestra como principal y el teléfono al lado", () => {
    render(<CustomersList customers={[{ ...baseCustomer, name: "María Torres" }]} loading={false} onUpdate={vi.fn()} />);
    expect(screen.getByText("María Torres")).toBeInTheDocument();
    expect(screen.getByText("+13055550199")).toBeInTheDocument();
  });

  it("clickear la fila la expande y muestra los campos editables con su valor real", async () => {
    const user = userEvent.setup();
    render(
      <CustomersList
        customers={[{ ...baseCustomer, name: "María Torres", notes: "Preguntó por precios" }]}
        loading={false}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.queryByDisplayValue("Preguntó por precios")).not.toBeInTheDocument();
    await user.click(screen.getByText("María Torres"));
    expect(await screen.findByDisplayValue("Preguntó por precios")).toBeInTheDocument();
  });

  it("cambiar la etapa desde el desplegable llama a onUpdate con el stage nuevo", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<CustomersList customers={[baseCustomer]} loading={false} onUpdate={onUpdate} />);

    await user.selectOptions(screen.getByRole("combobox"), "contacted");
    expect(onUpdate).toHaveBeenCalledWith(1, { stage: "contacted" });
  });

  it("guardar nombre/etiquetas/notas llama a onUpdate con los 3 campos reales", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<CustomersList customers={[baseCustomer]} loading={false} onUpdate={onUpdate} />);

    await user.click(screen.getByText("+13055550199"));
    await user.type(screen.getByPlaceholderText("Sin nombre todavía"), "Juan Pérez");
    await user.click(screen.getByText("Guardar"));

    expect(onUpdate).toHaveBeenCalledWith(1, { name: "Juan Pérez", notes: "", tags: "" });
  });
});
