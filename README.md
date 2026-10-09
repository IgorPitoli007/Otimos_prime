# OtimosPrime

Plataforma de vídeos estilo rede social, feita com Node.js, Express, PostgreSQL (via Sequelize) e EJS. Permite criar conta, logar, publicar vídeos com capa, comentar, editar e excluir vídeos/comentários.

## Autores

| Nome | RA |
|------|----|
| Luiz Pedro Pereira dos Santos | 2648024 |
| Igor Rafael Pitoli | 2787849 |

## Funcionalidades

- Cadastro e login de usuários (sessão via `express-session` + `connect-session-sequelize`)
- Publicação de vídeo com capa (upload via `express-fileupload`)
- Feed inicial com todos os vídeos publicados
- Tela de assistir vídeo, responsiva (se adapta a vídeo vertical ou horizontal)
- Comentários por vídeo, com exclusão restrita a quem comentou
- Edição e exclusão de vídeos restrita a quem publicou

## Tecnologias

- **Backend:** Node.js, Express
- **Banco de dados:** PostgreSQL + Sequelize
- **Views:** EJS (renderizado através de arquivos `.html`)
- **Upload de arquivos:** express-fileupload
- **Sessão:** express-session + connect-session-sequelize

## Estrutura do projeto

```
├── config/
│   └── db.js            # Configuração da conexão com o PostgreSQL
├── models/
│   ├── usuarios.js
│   ├── videos.js
│   └── comentarios.js
├── views/
│   ├── login.html
│   ├── sign.html
│   ├── index.html       # Feed inicial
│   ├── insVid.html      # Publicar vídeo
│   ├── updVid.html      # Editar vídeo
│   └── verVid.html      # Assistir vídeo + comentários
├── css/
│   ├── home.css
│   ├── publicar.css
│   └── ver.css
├── videos/               # Arquivos de vídeo e capa enviados (criada em tempo de execução)
├── index.js              # Arquivo principal do servidor
└── package.json
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) instalado
- [PostgreSQL](https://www.postgresql.org/) instalado e rodando localmente

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

3. **Crie o banco de dados no PostgreSQL**

   Entre no psql e crie o banco com o mesmo nome configurado em `config/db.js`:
   ```sql
   CREATE DATABASE otimosprime;
   ```

4. **Configure a conexão com o banco**

   Abra `config/db.js` e ajuste usuário/senha conforme o seu PostgreSQL local:
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

5. **Rode o servidor**
   ```bash
   node index.js
   ```

6. **Acesse no navegador**
   ```
   http://localhost:8081
   ```

   Na primeira vez, crie uma conta pela tela de cadastro antes de logar.

## Rotas principais

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Feed inicial (ou tela de login, se não estiver logado) |
| GET | `/login` | Tela de login |
| GET | `/sign` | Tela de cadastro |
| POST | `/tratarLogin` | Processa o login |
| POST | `/tratarSign` | Processa o cadastro |
| GET | `/sair` | Encerra a sessão |
| GET | `/publicar` | Tela de publicar vídeo |
| POST | `/tratarInsVid` | Processa a publicação de um vídeo |
| GET | `/:id` | Tela de assistir um vídeo específico |
| GET | `/editar/:id` | Tela de editar vídeo |
| POST | `/tratarUpdVid` | Processa a edição de um vídeo |
| GET | `/apagar/:id` | Exclui um vídeo |
| POST | `/comentar` | Adiciona um comentário |
| POST | `/apagarComentario/:id` | Exclui um comentário |
