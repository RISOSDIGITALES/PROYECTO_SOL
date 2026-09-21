import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChangePasswordForm from "./ChangePasswordForm";

describe("ChangePasswordForm", () => {
  it("manda la actual y la nueva a onSubmit cuando coinciden la confirmación", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ChangePasswordForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Contraseña actual"), "vieja123");
    await user.type(screen.getByLabelText("Contraseña nueva"), "nueva12345");
    await user.type(screen.getByLabelText("Confirmar contraseña nueva"), "nueva12345");
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(onSubmit).toHaveBeenCalledWith("vieja123", "nueva12345");
    expect(await screen.findByText("Contraseña actualizada correctamente.")).toBeInTheDocument();
  });

  it("si la confirmación no coincide, no llama a onSubmit y avisa", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ChangePasswordForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Contraseña actual"), "vieja123");
    await user.type(screen.getByLabelText("Contraseña nueva"), "nueva12345");
    await user.type(screen.getByLabelText("Confirmar contraseña nueva"), "otra-cosa");
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText("La confirmación no coincide con la contraseña nueva.")).toBeInTheDocument();
  });

  it("si onSubmit rechaza (ej. contraseña actual incorrecta), muestra el error real del backend", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("La contraseña actual no es correcta"));
    render(<ChangePasswordForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Contraseña actual"), "mal");
    await user.type(screen.getByLabelText("Contraseña nueva"), "nueva12345");
    await user.type(screen.getByLabelText("Confirmar contraseña nueva"), "nueva12345");
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(await screen.findByText("La contraseña actual no es correcta")).toBeInTheDocument();
  });
});
