// frontend/src/pages/ReportePagosPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // <-- 1. IMPORTA useAuth PARA ACCEDER AL TOKEN
import './reportePagosPage.css';

const formatCurrency = (value) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

function ReportePagosPage() {
    const { token } = useAuth(); // <-- 2. OBTÉN EL TOKEN DEL CONTEXTO
    const [resumen, setResumen] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    useEffect(() => {
        const fetchReportes = async () => {
            // Si no hay token, no tiene sentido hacer la petición
            if (!token) {
                setError('No estás autenticado. Por favor, inicia sesión.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                // --- 3. AÑADE LOS HEADERS DE AUTORIZACIÓN A AMBAS PETICIONES ---
                const headers = {
                    'Authorization': `Bearer ${token}`
                };

                const [resumenRes, historialRes] = await Promise.all([
                    fetch('/api/pagos/resumen', { headers }),
                    fetch('/api/pagos/historial', { headers })
                ]);
                // --- FIN DE LA MODIFICACIÓN ---

                if (!resumenRes.ok || !historialRes.ok) {
                    // Si el backend devuelve un 401 (token inválido) o 403 (no eres admin), este error se activará
                    throw new Error('No tienes permiso para ver esta información o tu sesión ha expirado.');
                }

                const resumenData = await resumenRes.json();
                const historialData = await historialRes.json();

                setResumen(resumenData);
                setHistorial(historialData);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReportes();
    }, [token]); // El efecto ahora depende del token

    if (loading) return <p>Cargando reporte de pagos...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="reporte-pagos-container">
            <h1>Reporte Financiero</h1>

            <div className="resumen-cards">
                <div className="card">
                    <h3>Ganancias del Mes</h3>
                    <p className="monto">{formatCurrency(resumen?.gananciasMesActual || 0)}</p>
                </div>
                <div className="card">
                    <h3>Ganancias del Año</h3>
                    <p className="monto">{formatCurrency(resumen?.gananciasAnioActual || 0)}</p>
                </div>
            </div>

            <div className="historial-container">
                <h2>Historial de Pagos</h2>
                <table className="historial-tabla">
                    <thead>
                        <tr>
                            <th>Fecha de Pago</th>
                            <th>Usuario</th>
                            <th>Monto</th>
                            <th>Reserva ID</th>
                            <th>Cancha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historial.length > 0 ? (
                            historial.map(pago => (
                                <tr key={pago.id}>
                                    <td>{new Date(pago.fechaPago).toLocaleString('es-CL')}</td>
                                    <td>{pago.usuario.nombre} ({pago.usuario.rut})</td>
                                    <td>{formatCurrency(pago.monto)}</td>
                                    <td>#{pago.id}</td>
                                    <td>{pago.cancha.nombre}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5">No hay pagos registrados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ReportePagosPage;