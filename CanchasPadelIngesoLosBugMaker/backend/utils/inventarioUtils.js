const { Reserva, Equipamiento } = require('../models');

async function devolverStockDeReserva(reservaId, transaction) {
  const reserva = await Reserva.findByPk(reservaId, {
    include: [{
      model: Equipamiento,
      as: 'equipamientosRentados',
      through: { attributes: ['cantidad'] }
    }],
    transaction
  });

  if (!reserva || !reserva.equipamientosRentados || reserva.equipamientosRentados.length === 0) {
    console.log(`Reserva ${reservaId} no tiene equipamiento para devolver.`);
    return;
  }

  console.log(`Devolviendo stock para la reserva ${reservaId}...`);

  for (const articulo of reserva.equipamientosRentados) {
    // --- LÍNEA CORREGIDA ---
    // ANTES: const cantidadDevuelta = articulo.EquipamientosRentados.cantidad;
    // AHORA: Accedemos a través del modelo de la tabla intermedia 'ReservaEquipamiento'
    const cantidadDevuelta = articulo.ReservaEquipamiento.cantidad;

    if (cantidadDevuelta > 0) {
      await Equipamiento.increment(
        { stock: cantidadDevuelta },
        { where: { id: articulo.id }, transaction }
      );
      console.log(`Devueltas ${cantidadDevuelta} unidades del artículo '${articulo.nombre}' (ID: ${articulo.id}) al stock.`);
    }
  }
}

module.exports = { devolverStockDeReserva };