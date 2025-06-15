'use strict';
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('reservas', 'recordatorio3dEnviado', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('reservas', 'recordatorio1dEnviado', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('reservas', 'recordatorio3dEnviado');
    await queryInterface.removeColumn('reservas', 'recordatorio1dEnviado');
  }
};

