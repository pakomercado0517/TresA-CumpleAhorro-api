"use strict";

const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Limpiar tabla primero (en orden inverso por foreign keys)
    await queryInterface.bulkDelete("Users", null, {});

    // Hash de contraseñas de ejemplo
    const passwordHash1 = await bcrypt.hash("Password123", SALT_ROUNDS);
    const passwordHash2 = await bcrypt.hash("Password123", SALT_ROUNDS);
    const passwordHash3 = await bcrypt.hash("Password123", SALT_ROUNDS);

    await queryInterface.bulkInsert(
      "Users",
      [
        {
          name: "Juan Pérez",
          email: "juan@example.com",
          passwordHash: passwordHash1,
          emailVerified: true,
          emailVerificationToken: null,
          passwordResetToken: null,
          passwordResetExpires: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "María García",
          email: "maria@example.com",
          passwordHash: passwordHash2,
          emailVerified: true,
          emailVerificationToken: null,
          passwordResetToken: null,
          passwordResetExpires: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Carlos López",
          email: "carlos@example.com",
          passwordHash: passwordHash3,
          emailVerified: false,
          emailVerificationToken: null,
          passwordResetToken: null,
          passwordResetExpires: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {});
  }
};

