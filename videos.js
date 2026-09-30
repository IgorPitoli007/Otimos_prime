const Sequelize = require('sequelize');
const db = require('./db');

const Videos = db.define('videos', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  autor: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  descricao: {
    type: Sequelize.TEXT,
    allowNull: false
  },
});

module.exports = videos;