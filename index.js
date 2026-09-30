const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const videos = require('./videos');
const app = express();
const fs = require('fs');
// const videos = require('./videos');
// const pasVid = path.join(__dirname, 'videos');

// videos.sync({ force: true });
videos.sync({ force: false });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.use('/videos', express.static(path.join(__dirname, 'videos')));
app.get('/', async (req, res) => {
    try{
        const listaVideos = await videos.findAll({ raw: true });
        res.render('index', {listaVideos});
    }catch(error){
        console.error("Erro ao buscar vídeos:", error);
        res.status(500).send("Erro ao carregar a página inicial.");
    }
});
app.get('/publicar', (req, res) => {
    res.render('insVid');
});
app.get('/:id', async (req, res) =>{
    let id = req.params.id;
    try {
        const video = await videos.findByPk(id, { raw: true });
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
        const video = await videos.findByPk(id);
        if (!video) {
            return res.status(404).send("Vídeo não encontrado.");
        }
        fs.unlinkSync(video.url);
        fs.unlinkSync(video.urlCapa);
        await video.destroy();
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao excluir o vídeo.");
    }
});
app.get('/editar/:id', async (req, res) =>{
    let id = req.params.id;
    const video = await videos.findByPk(id);
    if (!video) {
        return res.status(404).send("Vídeo não encontrado.");
    }
    res.render('updVid', {video});
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
    let caminhoDestinoVideo = path.join(__dirname, 'videos', video.name);
    let caminhoRelativoVideo = path.join("videos", video.name);
    let caminhoDestinoCapa = path.join(__dirname, 'videos', capa.name);
    let caminhoRelativoCapa = path.join("videos", capa.name);
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
                await videos.create({
                    autor: autor,
                    titulo: titulo,
                    descricao: descricao,
                    url: caminhoRelativoVideo,
                    urlCapa: caminhoRelativoCapa
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
    let capa, video;
    let id = req.body.id;
    if (req.files) {
        if(req.files.video){
            video = req.files.video;
        }
        if(req.files.capa){
            capa = req.files.capa;
        }
    }
    try{
        let videoAtualizado = await videos.findByPk(id);
        if (!videoAtualizado) {
            return res.status(404).send("Vídeo não encontrado.");
        }
        if(req.files){
            if(req.files.video){
                let caminhoDestinoVideo = path.join(__dirname, 'videos', video.name);
                let caminhoRelativoVideo = path.join("videos", video.name);
                fs.unlinkSync(videoAtualizado.url);
                await video.mv(caminhoDestinoVideo, async (err) => {
                    if(err){
                        return res.status(500).send(err);
                    }
                });
                videoAtualizado.url = caminhoRelativoVideo;
            }
            if(req.files.capa){
                let caminhoDestinoCapa = path.join(__dirname, 'videos', capa.name);
                let caminhoRelativoCapa = path.join("videos", capa.name);
                fs.unlinkSync(videoAtualizado.urlCapa);
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
app.listen(8081, () => {
  console.log('Servidor rodando em http://localhost:8081');
});