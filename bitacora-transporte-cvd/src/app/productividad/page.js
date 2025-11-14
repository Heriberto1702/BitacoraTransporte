"use client";
import Link from "next/link";
import Productividad from "../componentes/Productividad/Productividad";
import styles from "./Page.module.css"; // <-- import CSS module

export default function PageEjemplo() {
  return (
    <div className={styles.container}>
      <div className={styles.navLinks}>
        <Link href="/">Inicio</Link>
        <Link href="../dashboard">Dashboard</Link>
      </div>

      <h1>Productividad</h1>
      <p>Contenido de la página de Productividad.</p>

      <Productividad />
    </div>
  );
}
