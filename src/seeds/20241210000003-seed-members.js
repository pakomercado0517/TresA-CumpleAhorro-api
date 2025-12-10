"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Limpiar tabla primero
    await queryInterface.bulkDelete("Members", null, {});

    // Obtener IDs de grupos
    const groups = await queryInterface.sequelize.query(
      'SELECT id FROM "Groups" ORDER BY id LIMIT 3;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (groups.length === 0) {
      console.warn("⚠️ No se encontraron grupos. Ejecuta primero el seed de grupos.");
      return;
    }

    await queryInterface.bulkInsert(
      "Members",
      [
        // Miembros del Grupo 1
        {
          groupId: groups[0].id,
          name: "Ana Martínez",
          phone: "2281234567",
          birthday: "1990-03-15",
          photoUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          groupId: groups[0].id,
          name: "Pedro Sánchez",
          phone: "2282345678",
          birthday: "1985-07-22",
          photoUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          groupId: groups[0].id,
          name: "Laura Rodríguez",
          phone: "2283456789",
          birthday: "1992-11-08",
          photoUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          groupId: groups[0].id,
          name: "Roberto Hernández",
          phone: null,
          birthday: "1988-05-30",
          photoUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        // Miembros del Grupo 2
        {
          groupId: groups[1].id,
          name: "Sofía Torres",
          phone: "2284567890",
          birthday: "1995-01-10",
          photoUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          groupId: groups[1].id,
          name: "Diego Morales",
          phone: "2285678901",
          birthday: "1993-09-25",
          photoUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        // Miembros del Grupo 3
        {
          groupId: groups[2].id,
          name: "Elena Jiménez",
          phone: "2286789012",
          birthday: "1991-12-05",
          photoUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          groupId: groups[2].id,
          name: "Fernando Castro",
          phone: null,
          birthday: "1987-04-18",
          photoUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Members", null, {});
  }
};

