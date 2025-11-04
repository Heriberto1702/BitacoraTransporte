import Link from "next/link";
export default function PageEjemplo() {
  return (
    <div>
     <Link href="/">Inicio</Link>
      <Link href="../dashboard">Dashboard</Link>
    </div>
  );
}