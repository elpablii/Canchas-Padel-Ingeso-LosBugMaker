'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notificaciones', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      tipo: {
        type: Sequelize.ENUM('NUEVA_CANCHA', 'ELIMINACION_CANCHA', 'RESERVA', 'OTRO'),
        allowNull: false,
        comment: 'Tipo de notificación',
      },
      mensaje: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Mensaje de la notificación',
      },
      leida: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si la notificación ha sido leída',
      },
      userRut: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'RUT del usuario al que va dirigida la notificación',
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notificaciones');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_notificaciones_tipo\";");
  }
}; 