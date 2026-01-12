import { useState } from "react";
import imageCompression from "browser-image-compression";
import Image from "next/image";


export default function CompressImage({ onCompress }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    const options = {
      maxSizeMB: 0.4, // pesa aprox 400kb
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      setPreview(URL.createObjectURL(compressedFile));
      onCompress(compressedFile); // pasamos la imagen comprimida al padre
    } catch (error) {
      console.error("Error al comprimir:", error);
    }

    setLoading(false);
  };

  return (
    <div>
      <label className="block mb-1 font-semibold">Foto de entrega (comprimida)</label>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
      />

      {loading && <p>Comprimiendo imagen...</p>}

        <Image
          src={preview}
          alt="preview"
          className="mt-2 rounded border"
          width={200}
          height={200}
          unoptimized
        />
        
      
    </div>
  );
}
