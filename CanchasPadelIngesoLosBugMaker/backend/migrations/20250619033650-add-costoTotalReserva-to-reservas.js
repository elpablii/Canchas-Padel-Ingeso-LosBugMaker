'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Esta función le da la orden a la base de datos de AÑADIR la nueva columna.
    await queryInterface.addColumn('reservas', 'costoTotalReserva', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    });
  },

  async down(queryInterface, Sequelize) {
    // Esta función elimina la columna si alguna vez necesitas revertir la migración
    await queryInterface.removeColumn('reservas', 'costoTotalReserva');
  }
};