interface Props {
  filename: string;
  found: number;
  newCount: number;
  duplicates: number;
  onImport: () => void;
  onCancel: () => void;
  loading: boolean;
}

export default function ImportPreview({ filename, found, newCount, duplicates, onImport, onCancel, loading }: Props) {
  return (
    <section className="rounded-[18px] bg-[#121821] p-[18px]">
      <h3 className="mb-3 text-base font-bold text-[#eef4f8]">Предпросмотр импорта</h3>
      <div className="mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#8795a5]">Файл</span>
          <span className="text-[#eef4f8]">{filename}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8795a5]">Найдено строк</span>
          <span className="text-[#eef4f8]">{found}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8795a5]">Новых</span>
          <span className="text-[#58d68d] font-bold">{newCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8795a5]">Дубликатов (пропущено)</span>
          <span className="text-[#f5a623] font-bold">{duplicates}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-3 text-sm font-semibold text-[#8795a5] transition-colors hover:text-[#eef4f8]"
        >
          Отмена
        </button>
        <button
          onClick={onImport}
          disabled={loading || newCount === 0}
          className="flex-1 rounded-xl bg-[#75b8ff] px-4 py-3 text-sm font-bold text-[#090d12] transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? 'Импорт...' : `Импортировать ${newCount}`}
        </button>
      </div>
    </section>
  );
}
