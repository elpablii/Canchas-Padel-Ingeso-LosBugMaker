// backend/migrations/YYYYMMDDHHMMSS-create-enum-users-rol.js
'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Primero verifica si el tipo ya existe antes de intentar crearlo
    const enumExists = await queryInterface.sequelize.query(
      `SELECT 1 FROM pg_type WHERE typname = 'enum_users_rol';`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!enumExists.length) {
      await queryInterface.sequelize.query("CREATE TYPE \"enum_users_rol\" AS ENUM('admin', 'socio');");
      console.log('Type enum_users_rol created.');
    } else {
      console.log('Type enum_users_rol already exists.');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_rol";');
    console.log('Type enum_users_rol dropped.');
  }
};
