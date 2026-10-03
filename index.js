const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const videos = require('./models/videos');
const usuarios = require('./models/usuarios');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const app = express();
const fs = require('fs');
const db = require('./config/db');

// db.sequelize.sync({ force: true });
db.sequelize.sync({ force: false });
app.use(session({secret: '123456', store:new SequelizeStore({ db: db.sequelize}), resave: false, saveUninitialized: false, cookie: { secure: false }}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));
app.get('/', async (req, res) => {
    try{
        const listaVideos = await db.Videos.findAll({ raw: true });
        if(req.session.usuarioLogado){
            return res.render('index', {listaVideos, usuario: req.session.usuarioLogado});
        }else{
            return res.render('login', {logado:false});
        }
    }catch(error){
        console.error("Erro ao buscar vídeos:", error);
        res.status(500).send("Erro ao carregar a página inicial.");
    }
});
app.get('/publicar', (req, res) => {
    res.render('insVid');
});
app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/sign', (req, res) => {
    res.render('sign');
});
app.get('/sair', (req, res)=>{
    req.session.destroy((err) => {
        if (err) {
            console.error("Erro ao encerrar a sessão:", err);
            return res.status(500).send("Erro ao tentar deslogar.");
        }
        res.redirect('/login');
    });
});
app.post('/tratarInsVid', (req, res) => {
    let titulo = req.body.titulo;
    let descricao = req.body.descricao;
    let autor = req.body.autor;
    if (!req.files || !req.files.video) {
        return res.status(400).send('Nenhum arquivo enviado.');
    }
    let video = req.files.video;
    let capa = req.files.capa;
    let timestamp = Date.now();
    let extensaoVideo = path.extname(video.name);
    let extensaoCapa = path.extname(capa.name);
    let nomeVideo = timestamp + extensaoVideo;
    let nomeCapa = timestamp + extensaoCapa;
    let caminhoDestinoVideo = path.join(__dirname, 'videos', nomeVideo);
    let caminhoRelativoVideo = path.join("videos", nomeVideo);
    let caminhoDestinoCapa = path.join(__dirname, 'videos', nomeCapa);
    let caminhoRelativoCapa = path.join("videos", nomeCapa);
    // console.log(titulo, "\n", video, "\n", descricao, "\n", autor, "\n", caminhoRelativo);
    video.mv(caminhoDestinoVideo, async (err) => {
        if(err){
            return res.status(500).send(err);
        }
        capa.mv(caminhoDestinoCapa, async (err) => {
            if(err){
                return res.status(500).send(err);
            }
            try{
                await db.Videos.create({
                    autor: autor,
                    titulo: titulo,
                    descricao: descricao,
                    url: caminhoRelativoVideo,
                    urlCapa: caminhoRelativoCapa,
                    idUsuario: req.session.usuarioLogado.id 
                });
                res.redirect('/');
            } catch (dbError) {
                console.error("Erro ao salvar no banco:", dbError);
                res.status(500).send("Erro ao salvar as informações do vídeo ou capa no banco de dados.");
            }
        });
    });
});
app.post('/tratarUpdVid', async (req, res) => {
    let titulo = req.body.titulo;
    let descricao = req.body.descricao;
    let autor = req.body.autor;
    let capa, video, nomeCapa, nomeVideo;
    let timestamp = Date.now();
    let id = req.body.id;
    if (req.files) {
        if(req.files.video){
            video = req.files.video;
            let extensaoVideo = path.extname(video.name);
            nomeVideo = timestamp + extensaoVideo;
        }
        if(req.files.capa){
            capa = req.files.capa;
            let extensaoCapa = path.extname(capa.name);
            nomeCapa = timestamp + extensaoCapa;
        }
    }
    try{
        let videoAtualizado = await db.Videos.findByPk(id);
        if (!videoAtualizado) {
            return res.status(404).send("Vídeo não encontrado.");
        }
        if(req.files){
            if(req.files.video){
                let caminhoDestinoVideo = path.join(__dirname, 'videos', nomeVideo);
                let caminhoRelativoVideo = path.join("videos", nomeVideo);
                fs.unlinkSync(path.join(__dirname, videoAtualizado.url));
                await video.mv(caminhoDestinoVideo, async (err) => {
                    if(err){
                        return res.status(500).send(err);
                    }
                });
                videoAtualizado.url = caminhoRelativoVideo;
            }
            if(req.files.capa){
                let caminhoDestinoCapa = path.join(__dirname, 'videos', nomeCapa);
                let caminhoRelativoCapa = path.join("videos", nomeCapa);
                fs.unlinkSync(path.join(__dirname, videoAtualizado.urlCapa));
                await capa.mv(caminhoDestinoCapa, async (err) => {
                    if(err){
                        return res.status(500).send(err);
                    }
                });
                videoAtualizado.urlCapa = caminhoRelativoCapa;
            }
        }
        // console.log(titulo, "\n", video, "\n", descricao, "\n", autor, "\n", caminhoRelativo);
            try{
                videoAtualizado.titulo = titulo;
                videoAtualizado.autor = autor;
                videoAtualizado.descricao = descricao;
                await videoAtualizado.save();
                res.redirect('/');
            } catch (dbError) {
                console.error("Erro ao salvar no banco:", dbError);
                res.status(500).send("Erro ao salvar as informações do vídeo ou capa no banco de dados.");
            }
    }catch(error){
        console.error("Erro ao atualizar no banco:", error);
        res.status(500).send("Erro ao salvar as modificações do vídeo no sistema.");
    }
});
app.post('/tratarSign', async (req, res) => {
    let nome = req.body.nome;
    let email = req.body.email;
    let senha = req.body.senha;
    try {
    const usuarioExistente = await db.Usuarios.findOne({ 
      where: { email: email } 
    });
    if (usuarioExistente) {
        return res.render('sign', {email:false})
    }else{
        await db.Usuarios.create({
            nome:nome,
            email:email,
            senha:senha,
        });
        return res.redirect('/login');
    }
  } catch (error) {
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
});
app.post('/tratarLogin', async (req, res) => {
    let email = req.body.email;
    let senha = req.body.senha;
    const usuario = await db.Usuarios.findOne({ 
        where: { email: email } 
    });
    if(usuario){
        if(usuario.senha == senha){
            req.session.usuarioLogado = {
                id: usuario.id,
            };
            return res.redirect('/');
        }
    }
    return res.render('login', {email:false});
});
app.get('/:id', async (req, res) =>{
    let id = req.params.id;
    try {
        const video = await db.Videos.findByPk(id, { raw: true });
        if (!video) {
            return res.status(404).send("Vídeo não encontrado.");
        }
        res.render('verVid', { video: video });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao carregar o vídeo.");
    }
});
app.get('/apagar/:id', async (req, res) =>{
    let id = req.params.id;
    try {
        const video = await db.Videos.findByPk(id);
        if (!video) {
            return res.status(404).send("Vídeo não encontrado.");
        }
        if(video.url){
            fs.unlinkSync(path.join(__dirname, video.url));
        }
        if(video.urlCapa){
            fs.unlinkSync(path.join(__dirname, video.urlCapa));
        }
        await video.destroy();
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao excluir o vídeo.");
    }
});
app.get('/editar/:id', async (req, res) =>{
    let id = req.params.id;
    const video = await db.Videos.findByPk(id);
    if (!video) {
        return res.status(404).send("Vídeo não encontrado.");
    }
    res.render('updVid', {video});
});
app.listen(8081, () => {
  console.log('Servidor rodando em http://localhost:8081');
});