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

module.exports = sequelize;