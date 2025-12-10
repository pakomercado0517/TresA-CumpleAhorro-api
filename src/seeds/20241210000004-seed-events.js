"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Limpiar tabla primero
    await queryInterface.bulkDelete("BirthdayEvents", null, {});

    // Obtener miembros con sus grupos
    const members = await queryInterface.sequelize.query(
      `SELECT m.id as "memberId", m."groupId", m.birthday, g."amountPerBirthday"
       FROM "Members" m
       INNER JOIN "Groups" g ON m."groupId" = g.id
       ORDER BY m.id;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (members.length === 0) {
      console.warn("⚠️ No se encontraron miembros. Ejecuta primero el seed de miembros.");
      return;
    }

    // Obtener el año actual
    const currentYear = new Date().getFullYear();

    const events = [];

    for (const member of members) {
      // Ajustar el cumpleaños al año actual
      const birthdayDate = new Date(member.birthday);
      const birthdayThisYear = new Date(currentYear, birthdayDate.getMonth(), birthdayDate.getDate());

      // Solo crear eventos para cumpleaños que aún no han pasado este año
      // o crear algunos eventos de ejemplo (puedes ajustar esta lógica)
      const eventDate = birthdayThisYear.toISOString().split("T")[0];

      events.push({
        memberId: member.memberId,
        groupId: member.groupId,
        birthdayDate: eventDate,
        expectedAmount: parseFloat(member.amountPerBirthday),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    if (events.length > 0) {
      await queryInterface.bulkInsert("BirthdayEvents", events, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("BirthdayEvents", null, {});
  }
};

