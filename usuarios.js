const Sequelize = require('sequelize');
const db = require('./db');

const Usuarios = db.define('usuarios', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  nome: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  email: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  senha: {
    type: Sequelize.TEXT,
    allowNull: false
  },
});

module.exports = Usuarios;