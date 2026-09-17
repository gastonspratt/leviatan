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
                                    item[
                                        "Año de lanzamiento"
                                    ]
                                ];

                            } else {

                                camposBusqueda = [
                                    item.Artista,
                                    item.Album,
                                    item.Sello,
                                    item.Origen,
                                    item[
                                        "Año de lanzamiento"
                                    ]
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

            `${limpiarParaBusqueda(artista)} ${limpiarParaBusqueda(album)}`
        );

        const resp = await fetch(
            `https://itunes.apple.com/search?term=${termino}&entity=album&limit=1`
        );

        const data = await resp.json();

        if (
            data.results &&
            data.results.length > 0
        ) {
            return data.results[0]
                .artworkUrl100
                .replace(
                    "100x100bb",
                    "600x600bb"
                );
        }

        return null;
    } catch (e) {
        console.warn(
            "iTunes falló:",
            artista,
            album,
            e
        );
        return null;
    }
}

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
                        ? claveItem(
                            item.Serie,
                            titulo
                        )
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
                        data-key="${clave}"
                        src="${imagen}"
                        alt="${titulo}"
                        onerror="this.src='img/sin-portada.png'"
                    >
                    <div class="card-body">
                        <h3>${subtitulo}</h3>
                        <p><strong>${titulo}</strong></p>
                        <p>${editorialOSello}</p>
                        <p>${item.Origen || ""}</p>
                        ${
                            anio
                                ? `<p>${anio}</p>`
                                : ""
                        }
                        <p>${item.Estado || ""}</p>
                        <div class="precio">
                            ${item.Precio || ""}
                        </div>
                        <a
                            class="btn-whatsapp"
                            href="${armarLinkWhatsApp(item)}"
                            target="_blank"
                            rel="noopener"
                        >
                            Consultar por WhatsApp
                        </a>
                    </div>
                </article>
                `;

                if (
                    !esComic &&
                    !tieneImagenValida(
                        item.Imagen
                    )
                ) {
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
                const url =
                    await buscarPortada(
                        item.Artista,
                        item.Album
                    );

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
                            1100
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

                          
