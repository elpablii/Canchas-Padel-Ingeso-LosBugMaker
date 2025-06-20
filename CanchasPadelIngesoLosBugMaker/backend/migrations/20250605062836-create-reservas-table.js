// backend/migrations/YYYYMMDDHHMMSS-create-reservas-table.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reservas', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userRut: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users', // Nombre de la tabla a la que referencia
          key: 'rut',     // Columna en la tabla 'users'
        },
        onUpdate: 'CASCADE', // Opcional: define comportamiento en update/delete
        onDelete: 'CASCADE', // Opcional: o SET NULL, RESTRICT, etc.
        comment: 'RUT del usuario que realiza la reserva (FK a users.rut)',
      },
      canchaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'canchas', // Nombre de la tabla a la que referencia
          key: 'id',        // Columna en la tabla 'canchas'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID de la cancha reservada (FK a canchas.id)',
      },
      fechaReserva: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      horaInicio: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      horaTermino: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      requiereEquipamiento: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      costoEquipamiento: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      estadoReserva: {
        type: Sequelize.ENUM('Pendiente', 'Confirmada', 'CanceladaPorUsuario', 'CanceladaPorAdmin', 'Completada', 'NoAsistio', 'Disponible'),
        allowNull: false,
        defaultValue: 'Pendiente',
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
    console.log('Table reservas created.');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reservas');
    console.log('Table reservas dropped.');
    // Los tipos ENUM se eliminarán en sus propias migraciones 'down'
  }
};
