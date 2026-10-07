const mongoose = require('mongoose');

const campus = mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true },
  texto: { type: String, required: true },
});

module.exports = mongoose.model("Campus", campus);