module.exports = (sequelize, Sequelize) => {
  const Comentarios = sequelize.define('comentarios', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    texto: {
      type: Sequelize.TEXT,
      allowNull: false
    },
  });

  return Comentarios;
}