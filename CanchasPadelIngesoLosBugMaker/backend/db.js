const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json'); // o la ruta que prefieras
const db = low(adapter);

// Inicializar la DB con estructura si no existe
db.defaults({ users: [] }).write();

module.exports = db;