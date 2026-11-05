# Saúde da Família

App pessoal (PWA) para guardar a memória de saúde da família — consultas, receitas, exames, vacinas, pets — com documentos lidos por IA e lembretes. Plano completo em [`PLANO.md`](PLANO.md); convenções para o Claude Code em [`CLAUDE.md`](CLAUDE.md).

## Configuração (Fase 0)

Tudo em contas **pessoais**.

### 1. Supabase

1. Crie um projeto em <https://supabase.com> (plano free). Anote a senha do banco.
2. Em **Project Settings › API**, copie a **Project URL** e a **anon public key**.
3. Aplique as migrations a partir deste repositório:
   ```bash
   npm install
   npx supabase login
   npx supabase link --project-ref SEU_PROJECT_REF   # o ref está na URL do painel
   npm run db:push
   ```
4. Em **Authentication › URL Configuration**:
   - **Site URL**: `https://saude.seudominio.com.br` (o subdomínio da Hostinger)
   - **Redirect URLs**: adicione também `http://localhost:5173`
5. Em **Authentication › Sign In / Providers › Email**, deixe **Email** ativo (o link mágico usa ele). Opcional: limitar cadastros desligando "Allow new users to sign up" depois que você e a Eduarda já tiverem entrado.
6. O SMTP padrão do Supabase envia poucos e-mails por hora. Para uso diário, configure um SMTP próprio em **Authentication › Emails › SMTP Settings** (ex.: o e-mail da Hostinger).

### 2. Rodar localmente

```bash
cp .env.example .env.local   # preencha URL e anon key
npm run dev                  # http://localhost:5173
```

No primeiro login o app pede para **criar a família** e já oferece cadastrar os 7 membros do plano. Para dar acesso à Eduarda (ou a quem for), a pessoa entra uma vez com o e-mail dela e depois você a adiciona em **Mais › Usuários da família** com o papel desejado.

### 3. Hostinger + deploy automático

1. No hPanel, crie o subdomínio (ex.: `saude.seudominio.com.br`) e ative o **SSL**.
2. Em **Arquivos › Contas FTP**, crie um usuário FTP com acesso à pasta do subdomínio (ex.: `/public_html/saude/` — confira o caminho mostrado no hPanel).
3. No GitHub, em **Settings › Secrets and variables › Actions**, crie:

   | Secret | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | Project URL do Supabase |
   | `VITE_SUPABASE_ANON_KEY` | anon public key |
   | `FTP_SERVER` | host FTP da Hostinger (ex.: `ftp.seudominio.com.br` ou o IP mostrado) |
   | `FTP_USERNAME` | usuário FTP |
   | `FTP_PASSWORD` | senha FTP |
   | `FTP_SERVER_DIR` | pasta de destino **terminando com `/`** (ex.: `/` se o usuário FTP já cai na pasta do subdomínio) |

4. Todo push na branch `main` faz build e envia `dist/` por FTP. Também dá para rodar manualmente em **Actions › Deploy (Hostinger) › Run workflow**.
5. O `public/.htaccess` força HTTPS e redireciona todas as rotas para `index.html`.

### 4. Instalar no celular

Abra o subdomínio no navegador do celular e use **Adicionar à tela de início** (no iPhone, pelo Safari › Compartilhar). Instalado, ele abre como app e, a partir da Fase 2, poderá receber notificações.
