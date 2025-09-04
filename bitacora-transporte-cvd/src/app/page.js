"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import OrdenesManager from "./componentes/OrdenesManager/OrdenesManager";
import styles from "./Home.module.css";

export default function Home() {
  const { data: session, status } = useSession();

  useEffect(() => {
    document.title = "Bitácora de Transporte CVD - Home";
  }, []);

  if (status === "loading")
    return <p className={styles.loading}>Cargando...</p>;

  return (
    <>
      {/* Navbar */}
      <nav className={styles.navbar}>

        <div className={styles.userInfo}>
          {session?.user?.email && (
            <p>
                Sesión iniciada como:{" "}
                <strong>
                  {session.user.email} - {session.user.rol}
                </strong>
              </p>
                
          )}
        </div>
        <div className={styles.usertitle}>
              <p  className={styles.saludo}>
                Bienvenid@ {session.user.nombre_vendedor}{" "}
                {session.user.apellido_vendedor}{" "}
              </p>
        <button onClick={() => signOut()} className={styles.logoutButton}>
          Cerrar sesión
        </button>

            </div>
      </nav>

      {/* Contenido principal */}
      <div className={styles.content}>
        
        <section className={styles.ordersSection}>
          <div className={styles.contentMain}>
            <OrdenesManager session={session} />
          </div>
        </section>
      </div>
    </>
  );
}
