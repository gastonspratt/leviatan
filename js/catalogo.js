export default {
  async fetch(request, env) {

    // ============================
    // CORS
    // ============================

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    const url = new URL(request.url);

    // ============================
    // RUTA: PORTADAS DE CÓMICS
    // ============================

    if (url.pathname === "/comic") {
      const isbn = limpiarISBN(
        url.searchParams.get("isbn") || ""
      );

      if (!isbn) {
        return jsonResponse({
          cover: null,
          error: "Falta el parámetro isbn"
        });
      }

      try {
        const resultado =
          await buscarComicWhakoom(isbn);

        return jsonResponse(resultado);

      } catch (error) {
        return jsonResponse({
          cover: null,
          error: String(error),
          isbn
        });
      }
    }

    // ============================
    // RUTA PRINCIPAL: DISCOGS
    // ============================

    const artist =
      url.searchParams.get("artist") || "";

    const album =
      url.searchParams.get("album") || "";

    if (!artist && !album) {
      return jsonResponse({
        cover: null,
        error: "Faltan parámetros artist/album"
      });
    }

    const discogsUrl =
      `https://api.discogs.com/database/search` +
      `?artist=${encodeURIComponent(artist)}` +
      `&release_title=${encodeURIComponent(album)}` +
      `&type=release` +
      `&token=${env.DISCOGS_TOKEN}`;

    try {
      const resp = await fetch(
        discogsUrl,
        {
          headers: {
            "User-Agent":
              "TiendaLeviatanApp/1.0 +https://tiendaleviatan.com"
          }
        }
      );

      if (!resp.ok) {
        return jsonResponse({
          cover: null,
          error:
            `Discogs respondió ${resp.status}`
        });
      }

      const data =
        await resp.json();

      let cover = null;

      if (
        data.results &&
        data.results.length > 0
      ) {
        cover =
          data.results[0].cover_image ||
          data.results[0].thumb ||
          null;
      }

      return jsonResponse({
        cover
      });

    } catch (err) {
      return jsonResponse({
        cover: null,
        error: String(err)
      });
    }
  }
};

function limpiarISBN(valor) {
  return (valor || "")
    .toString()
    .replace(/[^0-9Xx]/g, "")
    .trim();
}

async function buscarComicWhakoom(isbn) {

  const codigo = limpiarISBN(isbn);

  if (!codigo) {
    return {
      cover: null,
      error: "ISBN inválido"
    };
  }

  try {

    // ==========================================
    // 1. BUSCAR EL CÓMIC POR ISBN EN WHAKOOM
    // ==========================================

    const searchUrl =
      `https://www.whakoom.com/search?s=${encodeURIComponent(codigo)}`;

    const searchResp =
      await fetch(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
          "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });

    if (!searchResp.ok) {
      return {
        cover: null,
        error:
          `Whakoom búsqueda respondió ${searchResp.status}`,
        isbn: codigo
      };
    }

    const html =
      await searchResp.text();

    // ==========================================
    // 2. EXTRAER EL ID DEL CÓMIC
    // ==========================================

    const patrones = [
      /href=["']\/comic\/([^"'\/]+)(?:\/[^"']*)?["']/i,
      /href=["']https?:\/\/www\.whakoom\.com\/comic\/([^"'\/]+)(?:\/[^"']*)?["']/i
    ];

    let comicId = null;

    for (const patron of patrones) {
      const encontrado =
        html.match(patron);

      if (encontrado && encontrado[1]) {
        comicId =
          encontrado[1];

        break;
      }
    }

    if (!comicId) {
      return {
        cover: null,
        error:
          "No se encontró un cómic asociado al ISBN en Whakoom",
        isbn: codigo
      };
    }

    // ==========================================
    // 3. OBTENER DETALLE MEDIANTE QUICKVIEW
    // ==========================================

    const quickViewResp =
      await fetch(
        "https://www.whakoom.com/pwkws.asmx/QuickView",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            "Accept":
              "application/json, text/plain, */*",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36"
          },
          body: JSON.stringify({
            cid: `comic${comicId}`
          })
        }
      );

    if (!quickViewResp.ok) {
      return {
        cover: null,
        error:
          `QuickView respondió ${quickViewResp.status}`,
        isbn: codigo,
        comicId
      };
    }

    const quickViewData =
      await quickViewResp.text();

    // ==========================================
    // 4. OBTENER HTML DEVUELTO POR QUICKVIEW
    // ==========================================

    let quickViewHtml =
      quickViewData;

    try {
      const json =
        JSON.parse(quickViewData);

      if (typeof json === "string") {
        quickViewHtml = json;
      } else if (
        json &&
        typeof json.d === "string"
      ) {
        quickViewHtml = json.d;
      }
    } catch (e) {
      // La respuesta puede venir como HTML directo.
    }

    // ==========================================
    // 5. EXTRAER URL DE LA PORTADA
    // ==========================================

    const portadaPatrones = [

      /<a[^>]+class=["'][^"']*fancybox[^"']*["'][^>]+href=["']([^"']+)["']/i,

      /<a[^>]+href=["']([^"']+)["'][^>]+class=["'][^"']*fancybox[^"']*["']/i,

      /<img[^>]+src=["']([^"']+)["']/i
    ];

    let cover = null;

    for (
      const patron
      of portadaPatrones
    ) {

      const encontrado =
        quickViewHtml.match(patron);

      if (
        encontrado &&
        encontrado[1]
      ) {
        cover =
          encontrado[1];

        break;
      }
    }

    if (!cover) {
      return {
        cover: null,
        error:
          "Whakoom encontró el cómic, pero no se pudo extraer la portada",
        isbn: codigo,
        comicId
      };
    }

    // ==========================================
    // 6. CONVERTIR URL RELATIVA EN ABSOLUTA
    // ==========================================

    if (
      cover.startsWith("/")
    ) {
      cover =
        `https://www.whakoom.com${cover}`;
    }

    return {
      cover,
      source: "whakoom",
      isbn: codigo,
      comicId
    };

  } catch (error) {

    return {
      cover: null,
      error: String(error),
      isbn: codigo
    };
  }
}

function convertirUrlPortada(cover) {

  if (!cover) {
    return null;
  }

  let url = cover.trim();

  // URL absoluta
  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  // URL protocol-relative
  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  // URL relativa a Whakoom
  if (url.startsWith("/")) {
    return `https://www.whakoom.com${url}`;
  }

  // Algunas respuestas pueden devolver
  // una ruta relativa sin "/" inicial.
  return `https://www.whakoom.com/${url}`;
}

function jsonResponse(obj) {

  return new Response(
    JSON.stringify(obj),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type"
      }
    }
  );
}

// ==========================================
// FIN DEL WORKER LEVIATÁN
// ==========================================
