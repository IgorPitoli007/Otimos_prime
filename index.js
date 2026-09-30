const express = require('express');
const path = require('path');
const app = express();
const videos = require('./videos');

videos.sync({ force: false });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/publicar', (req, res) => {
    res.sendFile(path.join(__dirname, 'insVid.html'));
});
app.post('/tratarInsVid', (req, res) => {
    let titulo = req.body.titulo;
    let video = req.body.video;
    let descricao = req.body.descricao;
    let autor = req.body.autor;
    console.log(titulo, "\n", video, "\n", descricao, "\n", autor);
})
app.listen(8081, () => {
  console.log('Servidor rodando em http://localhost:8081');
});