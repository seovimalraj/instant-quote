interface Props {
  meta?: Record<string, any>;
}

export default function Badges({ meta }: Props) {
  if (!meta) return null;
  return (
    <div className="flex gap-2 mb-2 text-xs">
      {meta.standard && (
        <span className="bg-gray-200 px-2 py-1 rounded">
          Standard: {meta.standard}
        </span>
      )}
      {meta.expedite && (
        <span className="bg-yellow-200 px-2 py-1 rounded">
          Expedite: {meta.expedite}
        </span>
      )}
    </div>
  );
}
