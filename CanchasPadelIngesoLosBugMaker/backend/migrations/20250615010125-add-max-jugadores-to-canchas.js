// en migrations/xxxx-add-max-jugadores-to-canchas.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('canchas', 'maxJugadores', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 4 // Por defecto, 4 jugadores
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('canchas', 'maxJugadores');
  }
};
