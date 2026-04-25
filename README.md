# BET Revelação — Backend

API REST + WebSocket para o app de chá revelação.

---

## Rodando localmente

```bash
# 1. Instale as dependências
npm install

# 2. Crie o arquivo de variáveis de ambiente
cp .env.example .env
# Edite .env se quiser trocar a senha admin ou a porta

# 3. Inicie o servidor
npm start          # produção
npm run dev        # desenvolvimento (recarrega ao salvar)
```

O servidor sobe em `http://localhost:3000`.

### Testando com curl

```bash
# Criar aposta
curl -X POST http://localhost:3000/api/bets \
  -H "Content-Type: application/json" \
  -d '{"name":"João","team":"boy","amount":50}'

# Listar apostas
curl http://localhost:3000/api/bets

# Ver estado
curl http://localhost:3000/api/state

# Revelar (admin)
curl -X POST http://localhost:3000/api/admin/reveal \
  -H "Content-Type: application/json" \
  -H "x-admin-pass: admin123" \
  -d '{"team":"boy"}'

# Sortear ganhadores (admin)
curl -X POST http://localhost:3000/api/admin/draw \
  -H "x-admin-pass: admin123"

# Deletar aposta (admin)
curl -X DELETE http://localhost:3000/api/admin/bets/1 \
  -H "x-admin-pass: admin123"

# Resetar tudo (admin)
curl -X DELETE http://localhost:3000/api/admin/reset \
  -H "x-admin-pass: admin123"
```

---

## Deploy no Railway

### 1. Crie uma conta e instale o CLI

Acesse [railway.app](https://railway.app) e crie uma conta gratuita.

Instale o CLI (opcional, mas útil):
```bash
npm install -g @railway/cli
railway login
```

### 2. Suba o projeto via GitHub (recomendado)

1. Crie um repositório no GitHub e faça push deste projeto:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/SEU_USUARIO/bet-revelacao-backend.git
   git push -u origin main
   ```

2. No dashboard do Railway, clique em **New Project → Deploy from GitHub repo** e selecione o repositório.

3. O Railway detecta automaticamente o `railway.json` e usa `node server.js`.

### 3. Configure as variáveis de ambiente

No painel do projeto no Railway, vá em **Variables** e adicione:

| Variável     | Valor       |
|--------------|-------------|
| `ADMIN_PASS` | sua_senha   |
| `PORT`       | *(deixe vazio — Railway injeta automaticamente)* |

> **Atenção:** o SQLite salva `data.db` no sistema de arquivos do container. O Railway tem armazenamento efêmero — ao fazer redeploy os dados são perdidos. Para persistência, use um **Volume** (Railway → seu serviço → Volumes → Add Volume, monte em `/app`). Em produção real considere migrar para PostgreSQL (o Railway oferece gratuitamente).

### 4. Domínio público automático

Após o deploy, o Railway gera uma URL como:
```
https://bet-revelacao-backend-production.up.railway.app
```

Use essa URL no seu frontend.

---

## Apontando domínio da Hostgator para o Railway

### Passo a passo (registro CNAME)

1. **Pegue o domínio Railway do seu serviço:**  
   No Railway: seu projeto → Settings → Domains → **Add Custom Domain** → digite seu domínio (ex: `api.seudominio.com.br`) → Railway mostra o valor do CNAME, algo como:  
   ```
   bet-revelacao-backend-production.up.railway.app
   ```

2. **Acesse o painel DNS da Hostgator:**  
   Login em [hpanel.hostgator.com.br](https://hpanel.hostgator.com.br) → **Domínios → Zona DNS** (ou "Gerenciar DNS") do seu domínio.

3. **Crie um registro CNAME:**

   | Tipo  | Nome (Host) | Valor (Points to)                                      | TTL  |
   |-------|-------------|--------------------------------------------------------|------|
   | CNAME | `api`       | `bet-revelacao-backend-production.up.railway.app`      | 3600 |

   - **Nome/Host:** use `api` para criar `api.seudominio.com.br`, ou `@` para o domínio raiz (nem sempre funciona com CNAME — prefira um subdomínio).
   - **Valor:** a URL gerada pelo Railway (sem `https://`).

4. **Salve e aguarde a propagação** (pode levar de 10 min a 24 h).

5. **Volte ao Railway** e clique em **Verify** ao lado do domínio customizado. Quando verificado, o Railway emite o certificado SSL automaticamente.

6. **Teste:**
   ```bash
   curl https://api.seudominio.com.br/health
   # Deve retornar: {"ok":true}
   ```

---

## Eventos Socket.io

| Evento         | Payload                          | Quando                          |
|----------------|----------------------------------|---------------------------------|
| `bet:new`      | `{ bet }`                        | Nova aposta criada              |
| `bet:removed`  | `{ id }`                         | Aposta deletada pelo admin      |
| `state:update` | `{ revealed, winners }`          | Revelação ou sorteio realizado  |

Conectando no frontend:
```js
import { io } from 'socket.io-client';
const socket = io('https://api.seudominio.com.br');

socket.on('bet:new', ({ bet }) => { /* atualiza ranking */ });
socket.on('state:update', ({ revealed, winners }) => { /* mostra resultado */ });
```
