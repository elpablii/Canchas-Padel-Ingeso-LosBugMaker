// backend/migrations/YYYYMMDDHHMMSS-create-enum-reservas-estadoReserva.js
'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const enumExists = await queryInterface.sequelize.query(
      `SELECT 1 FROM pg_type WHERE typname = 'enum_reservas_estadoReserva';`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!enumExists.length) {
      await queryInterface.sequelize.query(
        "CREATE TYPE \"enum_reservas_estadoReserva\" AS ENUM('Pendiente', 'Confirmada', 'CanceladaPorUsuario', 'CanceladaPorAdmin', 'Completada', 'NoAsistio', 'Archivada');"
      );
      console.log('Type enum_reservas_estadoReserva created.');
    } else {
      console.log('Type enum_reservas_estadoReserva already exists.');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reservas_estadoReserva";');
    console.log('Type enum_reservas_estadoReserva dropped.');
  }
};
