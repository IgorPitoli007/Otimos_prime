module.exports = (sequelize, Sequelize) => {
  const Usuarios = sequelize.define('usuarios', {
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

  return Usuarios;
}