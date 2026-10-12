/** Process the image locally. SVG and remote URLs are deliberately not accepted. */
export async function prepareLogo(file: File): Promise<string> {
  if (!['image/png','image/jpeg','image/webp'].includes(file.type)) throw Error('Scegli un’immagine PNG, JPEG o WebP.');
  if (file.size > 2 * 1024 * 1024) throw Error('Il logo deve essere inferiore a 2 MB.');
  const bytes = new Uint8Array(await file.slice(0,12).arrayBuffer());
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const jpeg = bytes[0] === 255 && bytes[1] === 216;
  const webp = String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
  if (!(png || jpeg || webp)) throw Error('Il file non è un’immagine supportata.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > 4096 || image.naturalHeight > 4096) throw Error('Usa un logo con dimensioni massime di 4096 × 4096 pixel.');
    const scale = Math.min(1,320 / Math.max(image.naturalWidth,image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1,Math.round(image.naturalWidth*scale));
    canvas.height = Math.max(1,Math.round(image.naturalHeight*scale));
    const context = canvas.getContext('2d');
    if (!context) throw Error('Elaborazione logo non disponibile.');
    context.drawImage(image,0,0,canvas.width,canvas.height);
    const result = canvas.toDataURL('image/png');
    if (result.length > 350000) throw Error('Il logo elaborato è troppo grande. Scegli un’immagine più semplice.');
    return result;
  } finally {URL.revokeObjectURL(url);}
}
