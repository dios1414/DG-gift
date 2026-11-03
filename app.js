const $ = (id) => document.getElementById(id);
let photoData = [];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function updatePreview() {
  $("pRecipient").textContent = $("recipient").value || "Alguien especial";
  $("pOccasion").textContent = $("occasion").value.toUpperCase();
  $("pTitle").textContent = $("title").value || "Un regalo para vos";
  $("pMessage").textContent = $("message").value;
  $("pSurprise").textContent = $("surprise").value;
  $("pSurprise").hidden = true;
  const holder = $("photoPreview");
  holder.innerHTML = "";
  if (!photoData.length) {
    holder.innerHTML = "<span>♡</span><span>♡</span><span>♡</span>";
  } else {
    photoData.slice(0, 4).forEach(src => {
      const img = document.createElement("img");
      img.src = src; img.alt = "Foto del regalo"; holder.appendChild(img);
    });
  }
}
$("photos").addEventListener("change", async (event) => {
  const files = [...event.target.files].slice(0, 8);
  photoData = await Promise.all(files.map(file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })));
  updatePreview();
});
$("giftForm").addEventListener("submit", event => { event.preventDefault(); updatePreview(); });
$("openSurprise").addEventListener("click", () => { $("pSurprise").hidden = !$("pSurprise").hidden; });

function buildGiftPage() {
  const recipient = escapeHtml($("recipient").value || "Alguien especial");
  const occasion = escapeHtml($("occasion").value);
  const title = escapeHtml($("title").value || "Un regalo para vos");
  const message = escapeHtml($("message").value).replace(/\n/g, "<br>");
  const surprise = escapeHtml($("surprise").value).replace(/\n/g, "<br>");
  const music = $("music").value.trim();
  const safeMusic = /^https:\/\/(open\.spotify\.com|music\.youtube\.com|www\.youtube\.com)\//i.test(music) ? music : "";
  const photos = photoData.map(src => `<img src="${src}" alt="Un recuerdo">`).join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>
  *{box-sizing:border-box}body{margin:0;min-height:100vh;background:linear-gradient(140deg,#241323,#593047);color:#4b2a40;font-family:Georgia,serif;display:grid;place-items:center;padding:24px}.card{width:min(680px,100%);background:#fff4f0;border-radius:14px;padding:36px 25px;text-align:center;box-shadow:0 25px 80px #0006}.heart{font-size:48px;color:#b65f7c}.tag{font:10px Arial;letter-spacing:3px;color:#a45e79}.title{font-size:clamp(30px,7vw,46px);margin:14px 0}.to{font:14px Arial;color:#80576c}.photos{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:25px 0}.photos img{width:min(42%,180px);height:170px;object-fit:cover;border-radius:6px}.message{font-size:17px;line-height:1.8;white-space:normal;margin:25px auto;max-width:520px}.btn{border:0;background:#713f5d;color:white;padding:13px 20px;border-radius:5px;font-size:14px;cursor:pointer}.surprise{display:none;margin:22px auto 0;line-height:1.7;color:#9a4f6d;font-style:italic}.music{display:inline-block;margin:0 0 18px;color:#874d68;font:13px Arial}.foot{margin-top:35px;font:9px Arial;letter-spacing:2px;color:#a77b8f}
  </style></head><body><main class="card"><div class="heart">♡</div><p class="tag">${occasion.toUpperCase()}</p><h1 class="title">${title}</h1><p class="to">Para <b>${recipient}</b></p><div class="photos">${photos}</div><p class="message">${message}</p>${safeMusic ? `<p><a class="music" href="${escapeHtml(safeMusic)}" target="_blank" rel="noopener">♫ Escuchar la música elegida</a></p>` : ""}<button class="btn" id="reveal">✉ Abrir sobre sorpresa</button><p class="surprise" id="surprise">${surprise}</p><p class="foot">CREADO CON ♥ EN DG GIFT</p></main><script>document.getElementById('reveal').addEventListener('click',()=>{const s=document.getElementById('surprise');s.style.display=s.style.display==='block'?'none':'block'});</script></body></html>`;
}
$("downloadGift").addEventListener("click", () => {
  const blob = new Blob([buildGiftPage()], {type:"text/html;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "mi-regalo-dg-gift.html"; a.click();
  URL.revokeObjectURL(url);
});
updatePreview();
