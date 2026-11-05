export default function EmBreve({ titulo, fase, itens }: { titulo: string; fase: string; itens: string[] }) {
  return (
    <section>
      <h1 className="mb-4 text-2xl font-semibold">{titulo}</h1>
      <div className="cartao text-slate-600">
        <p className="mb-2 font-medium text-slate-800">Chega na {fase}.</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {itens.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
