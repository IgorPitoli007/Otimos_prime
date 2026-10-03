const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  'otimosprime',
  'postgres',
  'ig121418',
  {
    host: 'localhost',
    dialect: 'postgres'
  }
);
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Usuarios = require('../models/usuarios.js')(sequelize, Sequelize);
db.Videos = require('../models/videos.js')(sequelize, Sequelize);
db.Comentarios = require('../models/comentarios.js')(sequelize, Sequelize);
db.Usuarios.hasMany(db.Videos,  { foreignKey: 'idUsuario' });
db.Videos.belongsTo(db.Usuarios, { foreignKey: 'idUsuario' }); 
db.Usuarios.hasMany(db.Comentarios,  { foreignKey: 'idUsuario' });
db.Comentarios.belongsTo(db.Usuarios, { foreignKey: 'idUsuario' }); 
db.Videos.hasMany(db.Comentarios,  { foreignKey: 'idVideo' });
db.Comentarios.belongsTo(db.Videos, { foreignKey: 'idVideo' }); 
module.exports = db;  