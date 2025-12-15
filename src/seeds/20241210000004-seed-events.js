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

    // Contar miembros por grupo para calcular expectedAmount correctamente
    const memberCountByGroup = {};
    for (const member of members) {
      if (!memberCountByGroup[member.groupId]) {
        memberCountByGroup[member.groupId] = 0;
      }
      memberCountByGroup[member.groupId]++;
    }

    // Obtener el año actual
    const currentYear = new Date().getFullYear();

    const events = [];

    for (const member of members) {
      // Ajustar el cumpleaños al año actual
      // IMPORTANTE: Para DATEONLY, NO usar conversión de timezone
      // Extraer mes y día del birthday y crear fecha UTC
      const birthdayString = String(member.birthday);
      const [, month, day] = birthdayString.split(/[-T]/); // Soporta "YYYY-MM-DD" o "YYYY-MM-DDTHH:MM:SS"
      
      // Crear fecha directamente en formato UTC sin conversión de timezone
      const eventDate = `${currentYear}-${month}-${day}`;

      // Calcular expectedAmount: número de miembros × amountPerBirthday
      // Todos los miembros pagan, incluyendo el cumpleañero
      const membersInGroup = memberCountByGroup[member.groupId] || 1;
      const expectedAmount = membersInGroup * parseFloat(member.amountPerBirthday);

      events.push({
        memberId: member.memberId,
        groupId: member.groupId,
        birthdayDate: eventDate,
        expectedAmount,
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

