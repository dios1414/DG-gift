function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Crear un regalo
    if (url.pathname === "/api/gifts" && request.method === "POST") {
      if (!env.GIFTS) return json({ error: "Falta conectar KV." }, 500);

      try {
        const gift = await request.json();

        if (!gift || typeof gift !== "object") {
          return json({ error: "Datos inválidos." }, 400);
        }

        const id = crypto.randomUUID().replaceAll("-", "").slice(0, 12);

        await env.GIFTS.put(id, JSON.stringify(gift));

        return json({
          success: true,
          id,
          url: `${url.origin}/g/${id}`
        });
      } catch {
        return json({ error: "No se pudo guardar el regalo." }, 400);
      }
    }

    // Abrir un regalo
    if (url.pathname.startsWith("/g/") && request.method === "GET") {
      if (!env.GIFTS) return new Response("Falta conectar KV.", { status: 500 });

      const id = url.pathname.slice(3);
      const saved = await env.GIFTS.get(id);

      if (!saved) return new Response("Este regalo no existe.", { status: 404 });

      let gift;
      try {
        gift = JSON.parse(saved);
      } catch {
        return new Response("No se pudo leer el regalo.", { status: 500 });
      }

      const photos = Array.isArray(gift.photos)
        ? gift.photos.slice(0, 8).map(src =>
            `<img src="${escapeHtml(src)}" alt="Un recuerdo">`
          ).join("")
        : "";

      const message = escapeHtml(gift.message).replace(/\n/g, "<br>");
      const surprise = escapeHtml(gift.surprise).replace(/\n/g, "<br>");
      const recipient = escapeHtml(gift.recipient);
      const title = escapeHtml(gift.title);
      const occasion = escapeHtml(gift.occasion);

      return new Response(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:linear-gradient(140deg,#241323,#593047);color:#4b2a40;font-family:Georgia,serif;display:grid;place-items:center;padding:24px}
.card{width:min(680px,100%);background:#fff4f0;border-radius:14px;padding:36px 25px;text-align:center}
.heart{font-size:48px;color:#b65f7c}
.tag{font:10px Arial;letter-spacing:3px;color:#a45e79}
.title{font-size:clamp(30px,7vw,46px)}
.to{font:14px Arial;color:#80576c}
.photos{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:25px 0}
.photos img{width:min(42%,180px);height:170px;object-fit:cover;border-radius:6px}
.message{font-size:17px;line-height:1.8;margin:25px auto;max-width:520px}
.btn{border:0;background:#713f5d;color:white;padding:13px 20px;border-radius:5px}
.surprise{display:none;margin:22px auto;color:#9a4f6d;font-style:italic}
</style>
</head>
<body>
<main class="card">
<div class="heart">♡</div>
<p class="tag">${occasion}</p>
<h1 class="title">${title}</h1>
<p class="to">Para <b>${recipient}</b></p>
<div class="photos">${photos}</div>
<p class="message">${message}</p>
<button class="btn" id="reveal">✉ Abrir sobre sorpresa</button>
<p class="surprise" id="surprise">${surprise}</p>
<p>CREADO CON ♥ EN DG GIFT</p>
</main>
<script>
document.getElementById("reveal").addEventListener("click",()=>{
 const s=document.getElementById("surprise");
 s.style.display=s.style.display==="block"?"none":"block";
});
</script>
</body>
</html>`, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // Servir los archivos de la página
    if (env.ASSETS) return env.ASSETS.fetch(request);

    return new Response("DG Gift está funcionando.", { status: 200 });
  }
};
