import { TopHeader } from "../../components/layout/top-header";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <TopHeader title={title} description={description} />
      <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center shadow-panel">
        <p className="text-base font-semibold text-ink">Modulo en preparacion</p>
        <p className="mt-2 text-sm text-stone-600">{description}</p>
      </div>
    </div>
  );
}

