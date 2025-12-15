// Script para probar el comportamiento real de expectedAmount
// Este script se conecta a la base de datos y simula el flujo completo

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Configurar conexión de prueba (usando las mismas variables de entorno)
const sequelize = new Sequelize(
  process.env.DB_DATABASE || 'tanda_cumpleanera',
  process.env.DB_USERNAME || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: false // Silenciar logs de SQL para este test
  }
);

// Función principal de prueba
async function testExpectedAmountBehavior() {
  try {
    console.log('=== INICIANDO PRUEBA DE expectedAmount ===\n');
    
    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida\n');
    
    // Consulta para obtener información de un grupo existente
    const [groups] = await sequelize.query(`
      SELECT g.*, COUNT(m.id) as member_count 
      FROM Groups g 
      LEFT JOIN Members m ON g.id = m.groupId 
      GROUP BY g.id 
      LIMIT 1
    `);
    
    if (groups.length === 0) {
      console.log('⚠️  No se encontraron grupos en la base de datos');
      console.log('   Crea un grupo primero para poder hacer la prueba');
      return;
    }
    
    const group = groups[0];
    console.log(`📊 GRUPO DE PRUEBA:`)
    console.log(`   ID: ${group.id}`)
    console.log(`   Nombre: ${group.name}`)
    console.log(`   Monto por cumpleaños: $${parseFloat(group.amountPerBirthday).toLocaleString()}`)
    console.log(`   Miembros actuales: ${group.member_count}`)
    console.log('');
    
    // Consultar eventos del grupo
    const [events] = await sequelize.query(`
      SELECT be.*, m.name as member_name 
      FROM BirthdayEvents be 
      LEFT JOIN Members m ON be.memberId = m.id 
      WHERE be.groupId = ?
      ORDER BY be.birthdayDate
    `, { 
      replacements: [group.id] 
    });
    
    console.log(`🎂 EVENTOS DEL GRUPO (${events.length} eventos):`)
    if (events.length === 0) {
      console.log('   No hay eventos para este grupo')
      console.log('   Genera eventos primero usando el endpoint correspondiente')
      console.log('');
    } else {
      events.forEach(event => {
        const expectedAmount = parseFloat(event.expectedAmount);
        const calculatedExpected = (group.member_count - 1) * parseFloat(group.amountPerBirthday);
        const isCorrect = Math.abs(expectedAmount - calculatedExpected) < 0.01;
        
        console.log(`   Evento ${event.id} (${event.member_name || 'Miembro eliminado'}):`)
        console.log(`     - Fecha: ${event.birthdayDate}`)
        console.log(`     - Expected Amount: $${expectedAmount.toLocaleString()}`)
        console.log(`     - Cálculo esperado: (${group.member_count} - 1) × $${parseFloat(group.amountPerBirthday).toLocaleString()} = $${calculatedExpected.toLocaleString()}`)
        console.log(`     - ✅ ${isCorrect ? 'CORRECTO' : '❌ INCORRECTO'}`)
        console.log('');
      });
    }
    
    // Simular el cálculo que debería hacer la función
    const expectedCalculation = (group.member_count - 1) * parseFloat(group.amountPerBirthday);
    console.log(`🧮 CÁLCULO ESPERADO:`)
    console.log(`   (${group.member_count} miembros - 1) × $${parseFloat(group.amountPerBirthday).toLocaleString()} = $${expectedCalculation.toLocaleString()}`)
    console.log('');
    
    // Verificar si todos los eventos tienen el expectedAmount correcto
    const incorrectEvents = events.filter(event => {
      const expectedAmount = parseFloat(event.expectedAmount);
      const calculatedExpected = (group.member_count - 1) * parseFloat(group.amountPerBirthday);
      return Math.abs(expectedAmount - calculatedExpected) >= 0.01;
    });
    
    if (incorrectEvents.length === 0) {
      console.log('🎉 RESULTADO: Todos los eventos tienen el expectedAmount correcto');
    } else {
      console.log(`⚠️  RESULTADO: ${incorrectEvents.length} de ${events.length} eventos tienen expectedAmount incorrecto`);
      console.log('   Esto indica que puede haber un problema con la sincronización');
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n✅ Conexión cerrada');
  }
}

// Función para mostrar información de diagnóstico
async function showDiagnosticInfo() {
  try {
    await sequelize.authenticate();
    
    console.log('\n=== INFORMACIÓN DE DIAGNÓSTICO ===\n');
    
    // Contar registros por tabla
    const [groupCount] = await sequelize.query('SELECT COUNT(*) as count FROM Groups');
    const [memberCount] = await sequelize.query('SELECT COUNT(*) as count FROM Members');  
    const [eventCount] = await sequelize.query('SELECT COUNT(*) as count FROM BirthdayEvents');
    const [paymentCount] = await sequelize.query('SELECT COUNT(*) as count FROM Payments');
    
    console.log(`📊 ESTADÍSTICAS DE BASE DE DATOS:`);
    console.log(`   - Grupos: ${groupCount[0].count}`);
    console.log(`   - Miembros: ${memberCount[0].count}`);
    console.log(`   - Eventos: ${eventCount[0].count}`);
    console.log(`   - Pagos: ${paymentCount[0].count}`);
    console.log('');
    
    // Mostrar grupos con conteo de miembros y eventos
    const [groupsInfo] = await sequelize.query(`
      SELECT 
        g.id,
        g.name,
        g.amountPerBirthday,
        COUNT(DISTINCT m.id) as member_count,
        COUNT(DISTINCT be.id) as event_count
      FROM Groups g 
      LEFT JOIN Members m ON g.id = m.groupId 
      LEFT JOIN BirthdayEvents be ON g.id = be.groupId
      GROUP BY g.id
      ORDER BY g.id
    `);
    
    console.log(`👥 RESUMEN POR GRUPO:`);
    if (groupsInfo.length === 0) {
      console.log('   No hay grupos registrados');
    } else {
      groupsInfo.forEach(group => {
        console.log(`   Grupo ${group.id}: "${group.name}"`);
        console.log(`     - Miembros: ${group.member_count}`);
        console.log(`     - Eventos: ${group.event_count}`);
        console.log(`     - Monto por cumpleaños: $${parseFloat(group.amountPerBirthday).toLocaleString()}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo información de diagnóstico:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar las pruebas
async function runTests() {
  const args = process.argv.slice(2);
  
  if (args.includes('--diagnostic') || args.includes('-d')) {
    await showDiagnosticInfo();
  } else {
    await testExpectedAmountBehavior();
  }
}

// Mostrar ayuda
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Uso: node test_db_expectedAmount.js [opciones]

Opciones:
  --diagnostic, -d    Mostrar información de diagnóstico
  --help, -h          Mostrar esta ayuda

Ejemplos:
  node test_db_expectedAmount.js                 # Ejecutar prueba principal
  node test_db_expectedAmount.js --diagnostic    # Mostrar información de diagnóstico
  `);
} else {
  runTests();
}