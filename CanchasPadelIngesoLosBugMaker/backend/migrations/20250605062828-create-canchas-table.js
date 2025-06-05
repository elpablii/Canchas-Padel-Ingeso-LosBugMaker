// backend/migrations/YYYYMMDDHHMMSS-create-canchas-table.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('canchas', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // Similar al email, puedes definir el nombre de la constraint si es necesario
        comment: 'Nombre identificador de la cancha, ej: "Cancha 1"',
      },
      costo: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Costo de la reserva de la cancha',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    });
    console.log('Table canchas created.');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('canchas');
    console.log('Table canchas dropped.');
  }
};
