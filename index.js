const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const app = express();
const fs = require('fs');
const db = require('./config/db');
const db_mongoose = require('./config/db_mongoose');
const mongoose = require('mongoose');
const mensagemSuporte = require('./models/suporte');
const Logger = require('./logger');
const logger = new Logger();

mongoose.connect(db_mongoose.connection)
.then(() => {
    console.log('conectado');
}).catch((erro) => {
    console.log('erro');
    console.error(erro);
    logger.erro("Erro ao conectar no mongodb:", erro.message);
});
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
        let listaVideos = await db.Videos.findAll({ raw: true });
        if(req.session.usuarioLogado){
            return res.render('index', {listaVideos, usuario: req.session.usuarioLogado});
        }else{
            return res.redirect('/login');
        }
    }catch(erro){
        console.error("Erro ao buscar vídeos:", erro);
        logger.erro("Erro ao buscar vídeos", erro.message);
        res.status(500).send("Erro ao carregar a página inicial.");
    }
});
app.get('/publicar', (req, res) => {
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    res.render('insVid');
});
app.get('/suporte', async (req, res) => {
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    try{
        let mensagensSuporte = await mensagemSuporte.find({});
        let usuario = req.session.usuarioLogado;
        res.render('suporte', {mensagensSuporte: mensagensSuporte, usuario:usuario});
    }catch(erro){
        logger.erro("Erro ao buscar criticas", erro.message);
        res.status(500).send("Erro ao carregar a página de suporte.");
    }
});
app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/sign', (req, res) => {
    res.render('sign');
});
app.get('/sair', (req, res)=>{
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    req.session.destroy((erro) => {
        if (erro) {
            console.error("Erro ao encerrar a sessão:", erro);
            logger.erro("Erro ao encerrar a sessão:", erro.message);
            return res.status(500).send("Erro ao tentar deslogar.");
        }
        res.redirect('/login');
    });
});
app.post('/tratarInsVid', async (req, res) => {
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    let titulo = req.body.titulo;
    let descricao = req.body.descricao;
    let autor = req.body.autor;
    if (!titulo.trim() || !descricao.trim() || !autor.trim()) {
        return res.render('insVid', {campos:false});
    }
    if (!req.files || !req.files.video) {
        return res.render('insVid', {video:false});
    }
    if (!req.files || !req.files.capa) {
        return res.render('insVid', {capa:false});
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
    try{
        await video.mv(caminhoDestinoVideo);
    }catch(erro){
        logger.erro('erro ao enviar video:', erro.message);
        return res.status(500).send(erro);
    }
    try{
        await capa.mv(caminhoDestinoCapa);
    }catch(erro){
        logger.erro('erro ao enviar capa:', erro.message);
        return res.status(500).send(erro);
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
    } catch (erro) {
        console.error("Erro ao salvar no banco:", erro);
        logger.erro("Erro ao salvar no banco:", erro.message);
        res.status(500).send("Erro ao salvar as informações do vídeo ou capa no banco de dados.");
    }
});
app.post('/tratarUpdVid', async (req, res) => {
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    let titulo = req.body.titulo;
    let descricao = req.body.descricao;
    let autor = req.body.autor;
    let id = req.body.id;
    if (!titulo.trim() || !descricao.trim() || !autor.trim()) {
        let video = await db.Videos.findByPk(id);
        if (!video) {
            return res.status(404).send("Vídeo não encontrado.");
        }
        return res.render('updVid', {campos:false, video});
    }
    let capa, video, nomeCapa, nomeVideo;
    let timestamp = Date.now();
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
                let VideoAntigo = path.join(__dirname, videoAtualizado.url);
                try{
                    await video.mv(caminhoDestinoVideo);
                }catch(erro){
                    logger.erro('erro ao enviar video:', erro.message);
                    return res.status(500).send(erro);
                }
                if(fs.existsSync(VideoAntigo)){
                    fs.unlinkSync(path.join(__dirname, videoAtualizado.url));
                }
                videoAtualizado.url = caminhoRelativoVideo;
            }
            if(req.files.capa){
                let caminhoDestinoCapa = path.join(__dirname, 'videos', nomeCapa);
                let caminhoRelativoCapa = path.join("videos", nomeCapa);
                let capaAntiga = path.join(__dirname, videoAtualizado.urlCapa);
                try{
                    await capa.mv(caminhoDestinoCapa);
                }catch(erro){
                    logger.erro('erro ao enviar capa:', erro.message);
                    return res.status(500).send(erro);
                }
                if(fs.existsSync(capaAntiga)){
                    fs.unlinkSync(path.join(__dirname, videoAtualizado.urlCapa));
                }
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
            } catch (erro) {
                console.error("Erro ao salvar no banco:", erro);
                logger.erro("Erro ao salvar no banco:", erro.message);
                res.status(500).send("Erro ao salvar as informações do vídeo ou capa no banco de dados.");
            }
    }catch(erro){
        console.error("Erro ao atualizar no banco:", erro);
        logger.erro("Erro ao atualizar no banco:", erro.message);
        res.status(500).send("Erro ao salvar as modificações do vídeo no sistema.");
    }
});
app.post('/UpdCritica', async (req, res) => {
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    let texto = req.body.texto;
    let usuario = req.session.usuarioLogado;
    let idUsuario = usuario.id;
    let critica = await mensagemSuporte.findOne({
        texto: texto,
        idUsuario: idUsuario
    });
    res.render('updCri', {critica:critica});
});
app.post('/tratarUpdCritica', async (req, res) => {
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    let texto = req.body.texto;
    let textoNovo = req.body.textoNovo;
    let usuario = req.session.usuarioLogado;
    let idUsuario = req.session.usuarioLogado.id;
    await mensagemSuporte.findOneAndUpdate(
        { texto:texto, idUsuario:idUsuario },
        { texto:textoNovo, idUsuario:idUsuario }
    );
    let mensagensSuporte = await mensagemSuporte.find({});
    res.render('suporte', {mensagensSuporte:mensagensSuporte, usuario:usuario});
});
app.post('/tratarUpdComentario', async (req, res) => {
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    let id = req.body.id;
    let texto = req.body.texto;
    let comentario = await db.Comentarios.findByPk(id, {include: db.Videos});
    if (!comentario) {
        return res.status(404).send("comentario não encontrado.");
    }
    comentario.texto = texto;
    await comentario.save();
    res.redirect('/'+comentario.video.id);
});
app.post('/tratarSign', async (req, res) => {
    let nome = req.body.nome;
    let email = req.body.email;
    let senha = req.body.senha;
    try {
        if (!nome.trim() || !email.trim() || !senha.trim()) {
            return res.render('sign', {campos:false});
        }
        let usuarioExistente = await db.Usuarios.findOne({ 
            where: { email: email } 
        });
        if (usuarioExistente) {
            return res.render('sign', {email:false});
        }else{
            await db.Usuarios.create({
                nome:nome,
                email:email,
                senha:senha,
            });
            return res.redirect('/login');
        }
    } catch (erro) {
        logger.erro("Erro interno do servidor:", erro.message);
        return  res.status(500).json({ erro: "Erro interno do servidor." });
    }
});
app.post('/tratarLogin', async (req, res) => {
    let email = req.body.email;
    let senha = req.body.senha;
    if (!email.trim() || !senha.trim()) {
        return res.render('login', {campos:false});
    }
    let usuario = await db.Usuarios.findOne({ 
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
app.post('/comentar', async (req, res) => {
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    let texto = req.body.texto;
    let idVideo = req.body.id;
    let idUsuario = req.session.usuarioLogado.id;

    try{
        await db.Comentarios.create({
            texto:texto,
            idUsuario: idUsuario,
            idVideo: idVideo
        });
        return res.redirect("/"+idVideo);
    } catch (erro) {
        console.error("Erro ao salvar no banco:", erro);
        logger.erro("Erro ao salvar no banco:", erro.message);
        return res.status(500).send("Erro ao salvar as informações do comentário no banco de dados.");
    }
});
app.get('/pesquisar', async(req, res) =>{
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    let texto = req.query.texto;
    try{
        let listaVideos = await db.Videos.findAll({where: {titulo: {[db.Sequelize.Op.iLike]: `%${texto}%`}}, raw: true });
        return res.render('index', {listaVideos:listaVideos, usuario: req.session.usuarioLogado});
    }catch(erro){
        console.error("Erro ao buscar vídeos:", erro);
        logger.erro("Erro ao buscar vídeos:", erro.message);
        res.status(500).send("Erro ao carregar a página inicial.");
    }
});
app.get('/:id', async (req, res) =>{
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    let id = req.params.id;
    if (!Number.isInteger(Number(id))) {
        return res.status(404).send("Página não encontrada.");
    }
    try {
        let video = await db.Videos.findByPk(id, { raw: true });
        if (!video) {
            return res.status(404).send("Vídeo não encontrado.");
        }
        let listaComentarios = await db.Comentarios.findAll({where: {idVideo:id}, include: [{ model: db.Usuarios }]});
        let idUsuario = req.session.usuarioLogado.id;
        let usuario = await db.Usuarios.findByPk(idUsuario, { raw: true });
        res.render('verVid', { video: video, listaComentarios: listaComentarios, usuario:usuario});
    } catch (erro) {
        console.error(erro);
        logger.erro("Erro ao carregar o vídeo:", erro.message);
        res.status(500).send("Erro ao carregar o vídeo.");
    }
});
app.get('/apagar/:id', async (req, res) =>{
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    let id = req.params.id;
    try {
        let video = await db.Videos.findByPk(id);
        if (!video) {
            return res.status(404).send("Vídeo não encontrado.");
        }
        if(fs.existsSync(path.join(__dirname, video.url))){
            fs.unlinkSync(path.join(__dirname, video.url));
        }
        if(fs.existsSync(path.join(__dirname, video.urlCapa))){
            fs.unlinkSync(path.join(__dirname, video.urlCapa));
        }
        await video.destroy();
        res.redirect('/');
    } catch (erro) {
        console.error(erro);
        logger.erro("Erro ao excluir o vídeo:", erro.message);
        res.status(500).send("Erro ao excluir o vídeo.");
    }
});
app.post('/apagarComentario/:id', async (req, res) =>{
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    let id = req.params.id;
    let idVideo = req.body.idVideo;
    try {
        let comentario = await db.Comentarios.findByPk(id);
        if (!comentario) {
            return res.status(404).send("comentário não encontrado.");
        }
        await comentario.destroy();
        res.redirect("/"+idVideo);
    } catch (erro) {
        console.error("Erro ao apagar comentário:", erro);
        logger.erro("Erro ao excluir o comentário:", erro.message);
        res.status(500).send("Erro ao excluir o comentário.");
    }
});
app.post('/UpdComentario/:id', async (req, res) =>{
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    let id = req.params.id;
    let comentario = await db.Comentarios.findByPk(id);
    if (!comentario) {
        return res.status(404).send("comentario não encontrado.");
    }
    res.render('updCom', {comentario:comentario});
});
app.get('/editar/:id', async (req, res) =>{
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    let id = req.params.id;
    let video = await db.Videos.findByPk(id);
    if (!video) {
        return res.status(404).send("Vídeo não encontrado.");
    }
    res.render('updVid', {video});
});
app.post('/criarCritica', async(req, res) =>{
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    try{
        let texto = req.body.critica;
        let usuario = req.session.usuarioLogado;
        let idUsuario = usuario.id;
        await new mensagemSuporte({
        texto: texto,
        idUsuario:idUsuario
        }).save()
        let mensagensSuporte = await mensagemSuporte.find({});
        res.render('suporte', {mensagensSuporte:mensagensSuporte, usuario:usuario});
    }catch(erro){
        console.log('erro ao cadastrar critica.');
        logger.erro("erro ao cadastrar critica:", erro.message);
        return res.status(500).send("erro ao cadastrar critica.");
    }
});
app.post('/apagarCritica', async(req, res) =>{
    if(!req.session.usuarioLogado){
        return res.render('login', {logado:false});
    }
    let texto = req.body.texto;
    let usuario = req.session.usuarioLogado;
    let idUsuario = usuario.id;
    try{
        let mensagemDeletada = await mensagemSuporte.findOneAndDelete({
            texto: texto,
            idUsuario: idUsuario
        });
        if(!mensagemDeletada){
            return res.status(404).json({ erro: "Crítica não encontrada." });
        }
        let mensagensSuporte = await mensagemSuporte.find({});
        return res.render('suporte', {mensagensSuporte:mensagensSuporte, usuario:usuario});
    }catch(erro){
        console.error("Erro ao apagar crítica:", erro);
      logger.erro("erro ao apagar critica:", erro.message);
    return res.status(500).json({ erro: "erro ao apagar critica." });
    }
});
app.listen(8081, () => {
  console.log('Servidor rodando em http://localhost:8081');
});