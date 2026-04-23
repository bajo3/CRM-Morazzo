import { createClientSchema, type Client } from "@crm/shared";
import { useEffect, useState } from "react";

import { TopHeader } from "../../components/layout/top-header";
import { DataTable } from "../../components/ui/data-table";
import { FormField, TextArea, TextInput } from "../../components/ui/form-field";
import { apiFetch } from "../../lib/api";

type ApiResponse<T> = {
  ok: boolean;
  data: T;
};

const fallbackClients: Client[] = [
  {
    id: "demo-client-1",
    name: "Lucia Fernandez",
    phone: "11-5555-1201",
    address: "Av. Rivadavia 1234",
    jobSite: "Caballito",
    notes: "Cliente frecuente",
  },
  {
    id: "demo-client-2",
    name: "Estudio Norte",
    phone: "11-5555-1202",
    address: "Del Libertador 4550",
    jobSite: "Nunez obra",
    notes: "Consulta por puerta blindex",
  },
];

const initialForm = {
  name: "",
  phone: "",
  address: "",
  jobSite: "",
  notes: "",
};

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(fallbackClients);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadMessage, setLoadMessage] = useState("Mostrando datos demo hasta conectar la API.");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    let isMounted = true;

    apiFetch<ApiResponse<Client[]>>("/clients")
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setClients(payload.data);
        setLoadMessage("Datos cargados desde la API.");
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setLoadMessage("API no disponible. Se muestran clientes demo para seguir armando la UI.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = createClientSchema.safeParse({
      name: form.name,
      phone: form.phone || null,
      address: form.address || null,
      jobSite: form.jobSite || null,
      notes: form.notes || null,
    });

    if (!parsed.success) {
      setErrorMessage("Revisa los datos del cliente antes de guardar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = await apiFetch<ApiResponse<Client>>("/clients", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });

      setClients((current) => [payload.data, ...current]);
      setForm(initialForm);
      setLoadMessage("Cliente guardado en la API.");
    } catch {
      setErrorMessage("No se pudo guardar en la API. Revisa que el backend y la base esten levantados.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <div className="space-y-6">
      <TopHeader
        title="Clientes"
        description="CRUD simple para mostrador: datos claros, carga rapida y observaciones internas del cliente."
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-line bg-white p-4 text-sm text-stone-600 shadow-panel">{loadMessage}</div>
          <DataTable
            columns={[
              { key: "name", header: "Cliente", render: (row) => <span className="font-semibold text-ink">{row.name}</span> },
              { key: "phone", header: "Telefono", render: (row) => row.phone ?? "-" },
              { key: "address", header: "Direccion", render: (row) => row.address ?? "-" },
              { key: "jobSite", header: "Localidad / obra", render: (row) => row.jobSite ?? "-" },
            ]}
            rows={clients}
            emptyTitle="Sin clientes"
            emptyDescription="Crea el primer cliente para empezar el flujo comercial."
          />
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-white p-5 shadow-panel">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-ink">Nuevo cliente</h3>
            <p className="text-sm text-stone-600">Formulario reutilizable y validado con schema compartido.</p>
          </div>

          <div className="mt-5 space-y-4">
            <FormField label="Nombre">
              <TextInput value={form.name} onChange={(event) => updateField("name", event.target.value)} />
            </FormField>
            <FormField label="Telefono">
              <TextInput value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
            </FormField>
            <FormField label="Direccion">
              <TextInput value={form.address} onChange={(event) => updateField("address", event.target.value)} />
            </FormField>
            <FormField label="Localidad / obra">
              <TextInput value={form.jobSite} onChange={(event) => updateField("jobSite", event.target.value)} />
            </FormField>
            <FormField label="Observaciones">
              <TextArea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
            </FormField>
            {errorMessage ? <p className="text-sm font-medium text-rose-700">{errorMessage}</p> : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Guardando..." : "Guardar cliente"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

