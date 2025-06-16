import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function AdminInventario() {
  const { token } = useAuth(); // Para autenticar las peticiones

  // Estados del componente
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  
  // Estado para el formulario de añadir/editar
  const [formData, setFormData] = useState({
    id: null, // Para saber si estamos editando o creando
    nombre: '',
    tipo: 'Pala de Padel', // Valor por defecto
    stock: 0,
    costo: 0,
  });

  // Función para cargar todo el inventario desde el backend
  const fetchInventario = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/equipamiento', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('No se pudo cargar el inventario.');
      const data = await response.json();
      setInventario(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar el inventario cuando el componente se monta por primera vez
  useEffect(() => {
    fetchInventario();
  }, [token]);

  // Manejador para los cambios en los inputs del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejador para enviar el formulario (crear o actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMensaje('');

    // Determina si es una petición POST (crear) o PUT (actualizar)
    const esEdicion = formData.id;
    const url = esEdicion ? `/api/admin/equipamiento/${formData.id}` : '/api/admin/equipamiento';
    const method = esEdicion ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          tipo: formData.tipo,
          stock: parseInt(formData.stock, 10),
          costo: parseFloat(formData.costo),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setMensaje(esEdicion ? 'Artículo actualizado exitosamente.' : 'Artículo añadido exitosamente.');
      resetFormulario();
      fetchInventario(); // Recargar la lista
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para eliminar un artículo del inventario
  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este artículo? Esta acción no se puede deshacer.")) {
        return;
    }
    try {
        const response = await fetch(`/api/admin/equipamiento/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        setMensaje("Artículo eliminado exitosamente.");
        fetchInventario(); // Recargar la lista
    } catch (err) {
        setError(err.message);
    }
  }

  // Carga los datos de un artículo en el formulario para editarlo
  const iniciarEdicion = (articulo) => {
    setFormData({
        id: articulo.id,
        nombre: articulo.nombre,
        tipo: articulo.tipo,
        stock: articulo.stock,
        costo: articulo.costo
    });
    window.scrollTo(0, 0); // Lleva al usuario arriba, al formulario
  };

  // Limpia el formulario
  const resetFormulario = () => {
    setFormData({ id: null, nombre: '', tipo: 'Pala de Padel', stock: 0, costo: 0 });
  };


  return (
    <div className="admin-inventario-container">
      <h2>Gestionar Inventario de Equipamiento</h2>

      {/* --- FORMULARIO PARA AÑADIR/EDITAR --- */}
      <form onSubmit={handleSubmit} className="inventario-form">
        <h3>{formData.id ? 'Editando Artículo' : 'Añadir Nuevo Artículo'}</h3>
        <input type="text" name="nombre" placeholder="Nombre del artículo" value={formData.nombre} onChange={handleChange} required />
        <select name="tipo" value={formData.tipo} onChange={handleChange}>
          <option value="Pala de Padel">Pala de Padel</option>
          <option value="Pelotas de Padel">Pelotas de Padel</option>
          <option value="Equipamento de Pista">Equipamento de Pista</option>
          <option value="Calzado">Calzado</option>
        </select>
        <input type="number" name="stock" placeholder="Stock" value={formData.stock} onChange={handleChange} required min="0" />
        <input type="number" name="costo" placeholder="Costo de arriendo" value={formData.costo} onChange={handleChange} required min="0" step="0.01" />
        <div className="form-actions">
            <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Artículo'}</button>
            {formData.id && <button type="button" onClick={resetFormulario}>Cancelar Edición</button>}
        </div>
      </form>

      {error && <p className="error-message">{error}</p>}
      {mensaje && <p className="success-message">{mensaje}</p>}

      {/* --- TABLA DE INVENTARIO --- */}
      <div className="inventario-table-container">
        <h3>Inventario Actual</h3>
        {loading && <p>Cargando inventario...</p>}
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Stock</th>
              <th>Costo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inventario.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.nombre}</td>
                <td>{item.tipo}</td>
                <td>{item.stock}</td>
                <td>{Number(item.costo).toLocaleString('es-CL', {style: 'currency', currency: 'CLP'})}</td>
                <td>
                  <button onClick={() => iniciarEdicion(item)}>Editar</button>
                  <button onClick={() => handleEliminar(item.id)} className="btn-delete">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminInventario;
