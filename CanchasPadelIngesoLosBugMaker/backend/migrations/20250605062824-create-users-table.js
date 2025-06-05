// backend/migrations/YYYYMMDDHHMMSS-create-users-table.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      rut: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
        comment: 'RUT del usuario, formato XXXXXXXX-X. Es la clave primaria.',
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Nombre completo del usuario.',
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // Asegúrate que la restricción de unicidad se llame 'unique_email' si es necesario
                      // o deja que Sequelize la nombre por defecto.
        comment: 'Email del usuario, debe ser único.',
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      rol: {
        type: Sequelize.ENUM('admin', 'socio'), // PostgreSQL creará/usará el tipo enum_users_rol
        allowNull: false,
        defaultValue: 'socio',
        comment: 'Rol del usuario (admin o socio)',
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
    // Si necesitas un nombre específico para la restricción unique de email, puedes añadirlo después:
    // await queryInterface.addConstraint('users', {
    //   fields: ['email'],
    //   type: 'unique',
    //   name: 'unique_email_constraint' // O el nombre que prefieras
    // });
    console.log('Table users created.');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
    console.log('Table users dropped.');
    // El tipo ENUM 'enum_users_rol' se eliminará en su propia migración 'down'
  }
};
