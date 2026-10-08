const mongoose = require('mongoose');

const mensagemSuporte = mongoose.Schema({
  texto: { type: String, required: true },
  idUsuario: { type: Number, required: true },
});

module.exports = mongoose.model("mensagemSuporte", mensagemSuporte);