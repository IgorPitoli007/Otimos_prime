module.exports = (sequelize, Sequelize) => {
  const Videos = sequelize.define('videos', {
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
    titulo: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    descricao: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    url: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    urlCapa: {
      type: Sequelize.TEXT,
      allowNull: false
    },
  });
  return Videos;
}