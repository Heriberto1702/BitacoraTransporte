// /src/app/componentes/Productividad/CarruselProductividad.jsx
import CardAgente from "../CardAgente/CardAgente";
import styles from "./CarruselProductividad.module.css";

export default function CarruselProductividad({ data }) {
  // Agrupamos las órdenes por agente
  const agentesMap = {};

  data.forEach((orden) => {
    const id = orden.id_agente;
    if (!agentesMap[id]) {
      agentesMap[id] = {
        nombre_agente: orden.nombre_agente,
        ordenes: [],
      };
    }
    agentesMap[id].ordenes.push(orden);
  });

  const agentes = Object.values(agentesMap);

  return (
    <div className={styles.carrusel}>
      {agentes.map((agente) => (
        <CardAgente key={agente.nombre_agente} agente={agente} />
      ))}
    </div>
  );
}
