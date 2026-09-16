                            error:
                                function(error) {
                                    console.error(
                                        `No se pudo cargar ${tipo}:`,
                                        error
                                    );

                                    resolve([]);
                                }
                        }
                    );
                }
            );
        }

        function escapeHtml(valor) {
            return (valor || "")
                .toString()
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function escapeAttribute(valor) {
            return escapeHtml(valor)
                .replace(/`/g, "&#096;");
        }

        Promise.all([
            cargarCSV(
                URL_SHEET,
                "CD"
            ),

            cargarCSV(
                URL_SHEET_COMICS,
                "COMIC"
            )

        ])
            .then(
                (
                    [cds, comics]
                ) => {

                    const catalogoCDs =
                        cds.filter(
                            item =>
                                (
                                    item.Artista ||
                                    ""
                                ).trim() &&
                                (
                                    item.Album ||
                                    ""
                                ).trim()
                        );

                    const catalogoComics =
                        comics.filter(
                            item =>
                                (
                                    item["Título"] ||
                                    ""
                                ).trim()
                        );

                    catalogo = [
                        ...catalogoCDs,
                        ...catalogoComics
                    ];

                    console.log(
                        "CDs cargados:",
                        catalogoCDs.length
                    );

                    console.log(
                        "Cómics cargados:",
                        catalogoComics.length
                    );

                    console.log(
                        "Catálogo total:",
                        catalogo.length
                    );

                    mostrarResultados(
                        obtenerDestacados()
                    );
                }
            );

        buscador.addEventListener(
            "input",
            () => {

                const texto =
                    normalizar(
                        buscador.value
                    );

                if (texto === "") {
                    mostrarResultados(
                        obtenerDestacados()
                    );

                    return;
                }

                const encontrados =
                    catalogo.filter(
                        item => {

                            let camposBusqueda;

                            if (
                                item.Tipo ===
                                "COMIC"
                            ) {

                                camposBusqueda = [
                                    item["Título"],
                                    item.Serie,
                                    item["Número"],
                                    item.Editorial,
                                    item.Origen,
                                    item["Código universal"],
                                    item["Año de lanzamiento"]
                                ];

                            } else {

                                camposBusqueda = [
                                    item.Artista,
                                    item.Album,
                                    item.Sello,
                                    item.Origen,
                                    item["Año de lanzamiento"]
                                ];
                            }

                            return camposBusqueda.some(
                                campo =>
                                    normalizar(
                                        campo
                                    ).includes(
                                        texto
                                    )
                            );
                        }
                    );

                mostrarResultados(
                    encontrados
                );
            }
        );
    }
);

async function buscarPortada(artista, album) {
    const clave =
        claveItem(artista, album);

    if (clave in cachePortadas) {
        return cachePortadas[clave];
    }

    let url =
        await buscarPortadaDiscogs(
            artista,
            album
        );

    if (!url) {
        url =
            await buscarPortadaItunes(
                artista,
                album
            );
    }

    cachePortadas[clave] = url;
    guardarCachePortadas();

    return url;
}

async function buscarPortadaComicWhakoom(isbn) {
    const codigo = limpiarISBN(isbn);

    if (!codigo) return null;

    if (codigo in cachePortadasComics) {
        return cachePortadasComics[codigo];
    }

    try {
        const resp = await fetch(
            `${URL_PROXY_COMICS}?isbn=${encodeURIComponent(codigo)}`
        );

        if (!resp.ok) {
            console.warn(
                "Whakoom proxy respondió:",
                resp.status,
                codigo
            );
            return null;
        }

        const data = await resp.json();
        const url = data.cover || null;

        cachePortadasComics[codigo] = url;
        guardarCachePortadasComics();

        return url;
    } catch (e) {
        console.warn(
            "Whakoom falló:",
            codigo,
            e
        );
        return null;
    }
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        const buscador =
            document.getElementById(
                "buscador"
            );

        const resultados =
            document.getElementById(
                "resultados"
            );

        let colaPendiente = [];

        function normalizar(texto) {
            return (texto || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                )
                .replace(
                    /[^a-z0-9]/g,
                    ""
                );
        }

        function obtenerDestacados(
            cantidad = 12
        ) {
            const copia =
                [...catalogo];

            for (
                let i = copia.length - 1;
                i > 0;
                i--
            ) {
                const j =
                    Math.floor(
                        Math.random() *
                        (i + 1)
                    );

                [
                    copia[i],
                    copia[j]
                ] = [
                    copia[j],
                    copia[i]
                ];
            }

            return copia.slice(
                0,
                cantidad
            );
        }

        function mostrarResultados(lista) {
            resultados.innerHTML = "";
            colaPendiente = [];

            if (lista.length === 0) {
                resultados.innerHTML = `
                    <div class="sin-resultados">
                        No se encontraron resultados.
                    </div>
                `;

                resultados.style.display =
                    "block";

                return;
            }

            resultados.style.display =
                "grid";

            lista.forEach(item => {
                const esComic =
                    item.Tipo === "COMIC";

                const titulo =
                    esComic
                        ? (
                            item["Título"] || ""
                        )
                        : (
                            item.Album || ""
                        );

                const subtitulo =
                    esComic
                        ? [
                            item.Serie,
                            item["Número"]
                                ? `Nº ${item["Número"]}`
                                : ""
                        ]
                            .filter(Boolean)
                            .join(" · ")
                        : (
                            item.Artista || ""
                        );

                const editorialOSello =
                    esComic
                        ? (
                            item.Editorial || ""
                        )
                        : (
                            item.Sello || ""
                        );    

                                          const anio =
                    item["Año de lanzamiento"] ||
                    "";

                const clave =
                    esComic
                        ? claveComic(item)
                        : claveItem(
                            item.Artista,
                            item.Album
                        );

                const imagen =
                    obtenerRutaImagen(
                        item.Imagen
                    );

                resultados.innerHTML += `
                <article class="card">
                    <img
                        data-key="${escapeAttribute(clave)}"
                        src="${escapeAttribute(imagen)}"
                        alt="${escapeHtml(titulo)}"
                        onerror="this.src='img/sin-portada.png'"
                    >
                    <div class="card-body">
                        <h3>${escapeHtml(subtitulo)}</h3>
                        <p><strong>${escapeHtml(titulo)}</strong></p>
                        <p>${escapeHtml(editorialOSello)}</p>
                        <p>${escapeHtml(item.Origen || "")}</p>
                        ${
                            anio
                                ? `<p>${escapeHtml(anio)}</p>`
                                : ""
                        }
                        <p>${escapeHtml(item.Estado || "")}</p>
                        <div class="precio">
                            ${escapeHtml(item.Precio || "")}
                        </div>
                        <a
                            class="btn-whatsapp"
                            href="${escapeAttribute(armarLinkWhatsApp(item))}"
                            target="_blank"
                            rel="noopener"
                        >
                            Consultar por WhatsApp
                        </a>
                    </div>
                </article>
                `;

                if (!tieneImagenValida(item.Imagen)) {
                    colaPendiente.push({
                        item,
                        clave
                    });
                }
            });

            procesarColaPortadas();
        }

        async function procesarColaPortadas() {
            for (
                const {
                    item,
                    clave
                }
                of colaPendiente
            ) {
                let url = null;

                if (item.Tipo === "COMIC") {
                    const isbn =
                        limpiarISBN(
                            item["Código universal"]
                        );

                    if (isbn) {
                        url =
                            await buscarPortadaComicWhakoom(
                                isbn
                            );
                    }
                } else {
                    url =
                        await buscarPortada(
                            item.Artista,
                            item.Album
                        );
                }

                if (url) {
                    document
                        .querySelectorAll(
                            `img[data-key="${CSS.escape(clave)}"]`
                        )
                        .forEach(img => {
                            img.src = url;
                        });
                }

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            item.Tipo === "COMIC"
                                ? 700
                                : 1100
                        )
                );
            }
        }

        function cargarCSV(
            url,
            tipo
        ) {
            return new Promise(
                resolve => {
                    Papa.parse(
                        url,
                        {
                            download: true,
                            header: true,
                            skipEmptyLines: true,

                            complete:
                                function(resultado) {
                                    const datos =
                                        resultado.data
                                            .map(
                                                item => ({
                                                    ...item,
                                                    Tipo: tipo
                                                })
                                            );

                                    resolve(
                                        datos
                                    );
                                },

                                                        error:
                                function(error) {
                                    console.error(
                                        `No se pudo cargar ${tipo}:`,
                                        error
                                    );

                                    resolve([]);
                                }
                        }
                    );
                }
            );
        }

        function escapeHtml(valor) {
            return (valor || "")
                .toString()
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function escapeAttribute(valor) {
            return escapeHtml(valor)
                .replace(/`/g, "&#096;");
        }

        Promise.all([
            cargarCSV(
                URL_SHEET,
                "CD"
            ),

            cargarCSV(
                URL_SHEET_COMICS,
                "COMIC"
            )

        ])
            .then(
                (
                    [cds, comics]
                ) => {

                    const catalogoCDs =
                        cds.filter(
                            item =>
                                (
                                    item.Artista ||
                                    ""
                                ).trim() &&
                                (
                                    item.Album ||
                                    ""
                                ).trim()
                        );

                    const catalogoComics =
                        comics.filter(
                            item =>
                                (
                                    item["Título"] ||
                                    ""
                                ).trim()
                        );

                    catalogo = [
                        ...catalogoCDs,
                        ...catalogoComics
                    ];

                    console.log(
                        "CDs cargados:",
                        catalogoCDs.length
                    );

                    console.log(
                        "Cómics cargados:",
                        catalogoComics.length
                    );

                    console.log(
                        "Catálogo total:",
                        catalogo.length
                    );

                    mostrarResultados(
                        obtenerDestacados()
                    );
                }
            );

        buscador.addEventListener(
            "input",
            () => {

                const texto =
                    normalizar(
                        buscador.value
                    );

                if (texto === "") {
                    mostrarResultados(
                        obtenerDestacados()
                    );

                    return;
                }

                const encontrados =
                    catalogo.filter(
                        item => {

                            let camposBusqueda;

                            if (
                                item.Tipo ===
                                "COMIC"
                            ) {

                                camposBusqueda = [
                                    item["Título"],
                                    item.Serie,
                                    item["Número"],
                                    item.Editorial,
                                    item.Origen,
                                    item["Código universal"],
                                    item["Año de lanzamiento"]
                                ];

                            } else {

                                camposBusqueda = [
                                    item.Artista,
                                    item.Album,
                                    item.Sello,
                                    item.Origen,
                                    item["Año de lanzamiento"]
                                ];
                            }

                            return camposBusqueda.some(
                                campo =>
                                    normalizar(
                                        campo
                                    ).includes(
                                        texto
                                    )
                            );
                        }
                    );

                mostrarResultados(
                    encontrados
                );
            }
        );
    }
);
