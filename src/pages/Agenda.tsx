import EmBreve from '../components/EmBreve'

export default function Agenda() {
  return (
    <EmBreve
      titulo="Agenda"
      fase="Fase 1"
      itens={[
        'Calendário com consultas, doses, vacinas e cuidados pet',
        'Filtro por membro',
        'Sincronização com o Google Agenda',
      ]}
    />
  )
}
