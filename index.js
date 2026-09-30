const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const videos = require('./videos');
const app = express();
// const videos = require('./videos');
// const pasVid = path.join(__dirname, 'videos');

videos.sync({ force: false });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/publicar', (req, res) => {
    res.sendFile(path.join(__dirname, 'insVid.html'));
});
app.post('/tratarInsVid', (req, res) => {
    let titulo = req.body.titulo;
    let descricao = req.body.descricao;
    let autor = req.body.autor;
    if (!req.files || !req.files.video) {
        return res.status(400).send('Nenhum arquivo enviado.');
    }
    let video = req.files.video;
    let caminhoDestino = path.join(__dirname, 'videos', video.name);
    let caminhoRelativo = path.join("videos", video.name);
    console.log(titulo, "\n", video, "\n", descricao, "\n", autor, "\n", caminhoRelativo);
    video.mv(caminhoDestino, async (err) => {
        if(err){
            return res.status(500).send(err);
        }
        try{
            await videos.create({
                autor: autor,
                titulo: titulo,
                descricao: descricao,
                url: caminhoRelativo
            });
            res.sendFile(path.join(__dirname, 'index.html'));
        } catch (dbError) {
            console.error("Erro ao salvar no banco:", dbError);
            res.status(500).send("Erro ao salvar as informações do vídeo no banco de dados.");
        }
    });
})
app.listen(8081, () => {
  console.log('Servidor rodando em http://localhost:8081');
});