# OtimosPrime

Plataforma de vídeos estilo rede social, feita com Node.js, Express, EJS e **dois bancos de dados**: PostgreSQL (via Sequelize) para usuários, vídeos e comentários, e MongoDB (via Mongoose) para as críticas de suporte. Permite criar conta, logar, publicar vídeos com capa, pesquisar, comentar, editar e excluir vídeos e comentários, e enviar críticas na página de suporte.

## Autores

| Nome | RA |
|------|----|
| Luiz Pedro Pereira dos Santos | 2648024 |
| Igor Rafael Pitoli | 2787849 |

## Funcionalidades

- Cadastro e login de usuários (sessão via `express-session` + `connect-session-sequelize`)
- Publicação de vídeo com capa (upload via `express-fileupload`)
- Feed inicial com todos os vídeos publicados e pesquisa por título
- Tela de assistir vídeo, responsiva (se adapta a vídeo vertical ou horizontal)
- Comentários por vídeo, com edição e exclusão restritas a quem comentou
- Edição e exclusão de vídeos restritas a quem publicou
- Página de Suporte/Críticas (MongoDB): enviar, editar e excluir as próprias críticas
- Registro de erros em arquivo (`logs/errors.log`)

## Tecnologias

- **Backend:** Node.js, Express
- **Banco relacional:** PostgreSQL + Sequelize (usuários, vídeos, comentários)
- **Banco não relacional:** MongoDB + Mongoose (críticas de suporte)
- **Views:** EJS (renderizado através de arquivos `.html`)
- **Upload de arquivos:** express-fileupload
- **Sessão:** express-session + connect-session-sequelize

## Estrutura do projeto

```
├── config/
│   ├── db.js              # Conexão com o PostgreSQL e relacionamentos
│   └── db_mongoose.js     # String de conexão com o MongoDB
├── models/
│   ├── usuarios.js        # Postgres
│   ├── videos.js          # Postgres
│   ├── comentarios.js     # Postgres
│   └── suporte.js         # MongoDB (schema das críticas)
├── views/
│   ├── login.html
│   ├── sign.html
│   ├── index.html         # Feed inicial
│   ├── insVid.html        # Publicar vídeo
│   ├── updVid.html        # Editar vídeo
│   ├── verVid.html        # Assistir vídeo + comentários
│   ├── updCom.html        # Editar comentário
│   ├── suporte.html       # Suporte/Críticas
│   └── updCri.html        # Editar crítica
├── css/
│   ├── home.css
│   ├── publicar.css
│   └── ver.css
├── videos/                # Vídeos e capas enviados (precisa ser criada, veja abaixo)
├── logs/                  # errors.log (criada automaticamente pelo logger)
├── logger.js              # Registro de erros em arquivo
├── index.js               # Arquivo principal do servidor
└── package.json
```

## Pré-requisitos

- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) instalado e rodando localmente
- [MongoDB Community](https://www.mongodb.com/docs/manual/administration/install-community/) instalado e rodando localmente (veja a seção abaixo)

## Como rodar o projeto

1. **Clone o repositório**
   ```bash
   git clone https://github.com/IgorPitoli007/Otimos_prime.git
   cd Otimos_prime
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Crie a pasta `videos`**

   O Git não guarda pastas vazias, então ela não vem no repositório. Sem ela, o upload de vídeo falha com o erro `ENOENT`. Na raiz do projeto (ao lado do `index.js`):
   ```bash
   mkdir videos
   ```

4. **Crie o banco no PostgreSQL**

   Entre no psql e crie o banco com o mesmo nome configurado em `config/db.js`:
   ```sql
   CREATE DATABASE otimosprime;
   ```
   As tabelas são criadas automaticamente na primeira execução.

5. **Configure a conexão com o Postgres**

   Abra `config/db.js` e ajuste usuário e senha conforme o seu PostgreSQL local:
   ```js
   const sequelize = new Sequelize(
     'otimosprime',
     'postgres',
     'SUA_SENHA_AQUI',
     {
       host: 'localhost',
       dialect: 'postgres'
     }
   );
   ```

6. **Deixe o MongoDB rodando** (veja a próxima seção). O banco `Otimusprime` é criado automaticamente na primeira gravação, não precisa criar à mão. A conexão está em `config/db_mongoose.js`:
   ```js
   connection: "mongodb://localhost/Otimusprime"
   ```

7. **Rode o servidor**
   ```bash
   node index.js
   ```
   No terminal deve aparecer `Servidor rodando em http://localhost:8081` e `conectado` (conexão com o Mongo). Se aparecer `erro`, o MongoDB não está rodando e o motivo fica registrado em `logs/errors.log`.

8. **Acesse no navegador**
   ```
   http://localhost:8081
   ```
   Na primeira vez, crie uma conta pela tela de cadastro antes de logar.

## Instalando o PostgreSQL no Ubuntu

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl status postgresql
```

O `status` deve mostrar `active`. Depois defina a senha do usuário `postgres`, porque o Node conecta com senha:

```bash
sudo -u postgres psql
```

Dentro do `psql`:

```sql
ALTER USER postgres WITH PASSWORD 'sua_senha';
CREATE DATABASE otimosprime;
\q
```

Use a mesma senha em `config/db.js` (passo 5 acima). Em outros sistemas, baixe o instalador em [postgresql.org](https://www.postgresql.org/download/).

## Instalando o MongoDB no Ubuntu

O MongoDB não vem nos repositórios padrão do Ubuntu. Estes passos usam o repositório oficial da versão 8.0.

```bash
sudo apt install -y curl gnupg
curl -fsSL https://pgp.mongodb.com/server-8.0.asc | sudo gpg --dearmor --yes -o /usr/share/keyrings/mongodb-server-8.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod
```

O `status` deve mostrar `active (running)`. Para testar, rode `mongosh` e, dentro dele, `db.runCommand({ ping: 1 })`, que deve responder `{ ok: 1 }`.

**Ubuntu 26.04:** o repositório oficial ainda não publica pacotes para essa versão, por isso a linha acima usa o repositório do Ubuntu 24.04 (`noble`).

**Se o `mongod` não iniciar** com a mensagem `MongoDB cannot start: Linux kernel versions 6.19 and newer has a known incompatibility` ([SERVER-121912](https://jira.mongodb.org/browse/SERVER-121912)), o kernel do sistema é novo demais para essa versão do MongoDB. Um contorno relatado pela comunidade, que pula a checagem e serve para ambiente local de estudo:

```bash
sudo mkdir -p /etc/systemd/system/mongod.service.d
printf '[Service]\nEnvironment=GLIBC_TUNABLES=glibc.pthread.rseq=1\n' | sudo tee /etc/systemd/system/mongod.service.d/rseq.conf
sudo systemctl daemon-reload
sudo systemctl restart mongod
```

Em outros sistemas, siga o [guia oficial de instalação](https://www.mongodb.com/docs/manual/administration/install-community/).

## Rotas principais

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Feed inicial (redireciona para o login se não estiver logado) |
| GET | `/login` | Tela de login |
| GET | `/sign` | Tela de cadastro |
| POST | `/tratarLogin` | Processa o login |
| POST | `/tratarSign` | Processa o cadastro |
| GET | `/sair` | Encerra a sessão |
| GET | `/publicar` | Tela de publicar vídeo |
| POST | `/tratarInsVid` | Processa a publicação de um vídeo |
| GET | `/pesquisar` | Pesquisa vídeos pelo título |
| GET | `/:id` | Tela de assistir um vídeo específico |
| GET | `/editar/:id` | Tela de editar vídeo |
| POST | `/tratarUpdVid` | Processa a edição de um vídeo |
| GET | `/apagar/:id` | Exclui um vídeo |
| POST | `/comentar` | Adiciona um comentário |
| POST | `/UpdComentario/:id` | Tela de editar comentário |
| POST | `/tratarUpdComentario` | Processa a edição de um comentário |
| POST | `/apagarComentario/:id` | Exclui um comentário |
| GET | `/suporte` | Página de Suporte/Críticas (MongoDB) |
| POST | `/criarCritica` | Envia uma crítica |
| POST | `/UpdCritica` | Tela de editar crítica |
| POST | `/tratarUpdCritica` | Processa a edição de uma crítica |
| POST | `/apagarCritica` | Exclui uma crítica |
