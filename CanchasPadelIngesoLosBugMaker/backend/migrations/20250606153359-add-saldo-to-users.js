'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Esta función AÑADE una nueva columna 'saldo' a la tabla 'users'.
    // Es la forma correcta de registrar la creación de un nuevo campo.
    console.log('Añadiendo la columna "saldo" a la tabla "users"...');
    await queryInterface.addColumn('users', 'saldo', {
      type: Sequelize.DECIMAL(10, 2), // <-- El tipo de dato correcto para dinero
      allowNull: false,
      defaultValue: 0.00
    });
    console.log('¡Columna "saldo" creada exitosamente!');
  },

  async down(queryInterface, Sequelize) {
    // Esta función elimina la columna si alguna vez reviertes la migración
    console.log('Eliminando la columna "saldo" de la tabla "users"...');
    await queryInterface.removeColumn('users', 'saldo');
  }
};
