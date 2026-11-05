import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<'inicio' | 'enviando' | 'enviado'>('inicio')
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEstado('enviando')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setErro(error.message)
      setEstado('inicio')
    } else {
      setEstado('enviado')
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <img src="/favicon.svg" alt="" className="mx-auto mb-4 h-16 w-16" />
        <h1 className="mb-1 text-center text-2xl font-semibold">Saúde da Família</h1>
        <p className="mb-6 text-center text-slate-500">Entre com seu e-mail. Enviaremos um link de acesso.</p>

        {estado === 'enviado' ? (
          <div className="cartao text-center">
            <p className="font-medium">Link enviado para {email}.</p>
            <p className="mt-1 text-sm text-slate-500">Abra o e-mail neste aparelho e toque no link.</p>
            <button className="botao-sec mt-4" onClick={() => setEstado('inicio')}>
              Usar outro e-mail
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="cartao space-y-4">
            <div>
              <label htmlFor="email" className="rotulo">E-mail</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                className="campo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {erro && <p className="text-sm text-red-600">{erro}</p>}
            <button type="submit" className="botao w-full" disabled={estado === 'enviando'}>
              {estado === 'enviando' ? 'Enviando…' : 'Enviar link de acesso'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
