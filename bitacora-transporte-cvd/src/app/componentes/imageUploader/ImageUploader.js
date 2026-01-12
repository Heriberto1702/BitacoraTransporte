// /src/componentes/imagenes/ImageUploader.js
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ImageUploader({ files, onUploaded }) {
  const [uploading, setUploading] = useState(false);

  const uploadImages = async () => {
    if (!files || files.length === 0) return;

    setUploading(true);

    const urls = [];

    for (let file of files) {
      const fileName = `${Date.now()}-${file.name}`;

      const { error } = await supabase.storage
        .from("ordenes") // bucket
        .upload(fileName, file);

      if (error) {
        console.error("Error subiendo imagen:", error);
        continue;
      }

      const { data } = supabase.storage.from("ordenes").getPublicUrl(fileName);

      urls.push(data.publicUrl);
    }

    setUploading(false);
    onUploaded(urls); // enviamos URLs al componente padre
  };

  return (
    <div>
      {files && files.length > 0 && (
        <button
          type="button"
          onClick={uploadImages}
          disabled={uploading}
          style={{ marginTop: 10 }}
        >
          {uploading ? "Subiendo..." : "Subir imágenes"}
        </button>
      )}
    </div>
  );
}
