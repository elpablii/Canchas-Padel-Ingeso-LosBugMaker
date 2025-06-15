'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jugadores', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      apellido: {
        type: Sequelize.STRING,
        allowNull: false
      },
      rut: {
        type: Sequelize.STRING,
        allowNull: false
      },
      edad: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      // --- Clave Foránea que conecta con la tabla 'reservas' ---
      reservaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'reservas', // El nombre de la tabla a la que se conecta
          key: 'id'        // La columna a la que se conecta en la tabla 'reservas'
        },
        onUpdate: 'CASCADE', // Si se actualiza el id de la reserva, se actualiza aquí
        onDelete: 'CASCADE'  // Si se elimina la reserva, se eliminan los jugadores asociados
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('jugadores');
  }
};