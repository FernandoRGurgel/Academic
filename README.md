<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/3e427bc4-064c-42d4-95fb-5323a250308c

## Run Locally

**Prerequisites:**  Node.js


1. Instale as dependências:
   `npm install`
2. Configure as variáveis de ambiente necessárias no arquivo `.env.local` (veja `.env.example`).
3. Execute o app:
   `npm run dev`

## Deploy na Vercel

Este projeto é totalmente compatível com a **Vercel** e pode ser publicado facilmente seguindo estes passos:

### 1. Preparar o Repositório
Certifique-se de que todas as alterações estão commitadas e enviadas para o seu repositório remoto (ex: GitHub, GitLab ou Bitbucket).

### 2. Configurar a Vercel
1. Vá para o painel da [Vercel](https://vercel.com/) e clique em **Add New...** > **Project**.
2. Importe o seu repositório de projeto.
3. No campo **Framework Preset**, selecione **Next.js**.
4. Expanda a seção **Environment Variables** e adicione as seguintes variáveis de ambiente:
   - `GEMINI_API_KEY`: Sua chave da API da Gemini.
   - `NEXT_PUBLIC_SUPABASE_URL`: A URL do seu projeto do Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: A chave anônima (anon key) do seu Supabase.
   - `APP_URL`: A URL de produção gerada pela Vercel para o seu app (ex: `https://seu-projeto.vercel.app`).
5. Clique em **Deploy**.

> [!IMPORTANT]
> A Vercel detectará e construirá automaticamente o projeto usando o comando `next build`. Garantimos a integridade do código e a ausência de erros de build e de tipagem do TypeScript localmente antes de enviar.

