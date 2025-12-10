"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Limpiar tabla primero
    await queryInterface.bulkDelete("Payments", null, {});

    // Obtener eventos con información de miembros
    const events = await queryInterface.sequelize.query(
      `SELECT e.id as "eventId", e."memberId", e."expectedAmount", e."groupId"
       FROM "BirthdayEvents" e
       ORDER BY e.id
       LIMIT 5;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (events.length === 0) {
      console.warn("⚠️ No se encontraron eventos. Ejecuta primero el seed de eventos.");
      return;
    }

    // Obtener todos los miembros de los grupos para crear pagos
    const eventIds = events.map((e) => e.eventId).join(",");
    const allMembers = await queryInterface.sequelize.query(
      `SELECT m.id as "memberId", m."groupId"
       FROM "Members" m
       WHERE m."groupId" IN (SELECT DISTINCT "groupId" FROM "BirthdayEvents" WHERE id IN (${eventIds}))
       ORDER BY m.id;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (allMembers.length === 0) {
      console.warn("⚠️ No se encontraron miembros para los eventos.");
      return;
    }

    const payments = [];
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    // Crear algunos pagos de ejemplo
    // Para cada evento, crear pagos de algunos miembros (no todos)
    for (const event of events.slice(0, 3)) {
      // Obtener miembros del mismo grupo que no sean el cumpleañero
      const groupMembers = allMembers.filter(
        (m) => m.groupId === event.groupId && m.memberId !== event.memberId
      );

      // Crear pagos de algunos miembros (máximo 3 por evento)
      const membersToPay = groupMembers.slice(0, Math.min(3, groupMembers.length));

      for (const member of membersToPay) {
        // Fecha de pago: algunos días antes del evento
        const paymentDate = new Date(today);
        paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 30));
        const paymentDateString = paymentDate.toISOString().split("T")[0];

        payments.push({
          birthdayEventId: event.eventId,
          memberId: member.memberId,
          amount: parseFloat(event.expectedAmount),
          datePaid: paymentDateString,
          proofUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    if (payments.length > 0) {
      await queryInterface.bulkInsert("Payments", payments, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Payments", null, {});
  }
};

