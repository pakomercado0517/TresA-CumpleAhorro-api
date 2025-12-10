"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Limpiar tabla primero
    await queryInterface.bulkDelete("Groups", null, {});

    // Obtener IDs de usuarios (asumiendo que los seeds de users se ejecutaron primero)
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM "Users" ORDER BY id LIMIT 3;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.warn("⚠️ No se encontraron usuarios. Ejecuta primero el seed de usuarios.");
      return;
    }

    await queryInterface.bulkInsert(
      "Groups",
      [
        {
          userId: users[0].id,
          name: "Tanda Familia 2024",
          amountPerBirthday: 500.0,
          description: "Tanda familiar para los cumpleaños de este año",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userId: users[0].id,
          name: "Tanda Amigos del Trabajo",
          amountPerBirthday: 1000.0,
          description: "Grupo de amigos del trabajo para celebrar cumpleaños",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userId: users[1].id,
          name: "Tanda Vecinos",
          amountPerBirthday: 300.0,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Groups", null, {});
  }
};

