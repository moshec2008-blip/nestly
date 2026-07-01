type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export default function SectionTitle({
  eyebrow,
  title,
  description,
}: SectionTitleProps) {
  return (
    <div className="text-right">
      {eyebrow && <p className="text-xs font-bold text-slate-500">{eyebrow}</p>}
      <h2 className="mt-1 text-2xl font-black text-slate-950">{title}</h2>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}
