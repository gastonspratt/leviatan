const URL_SHEET =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=0&single=true&output=csv";

let catalogo = [];

document.addEventListener("DOMContentLoaded", () => {

    const buscador = document.getElementById("buscador");
    const resultados = document.getElementById("resultados");

    function normalizar(texto) {

        return (texto || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");

    }

    function obtenerDestacados(cantidad = 12) {

        const copia = [...catalogo];

        for (let i = copia.length - 1; i > 0; i--) {

            const j = Math.floor(Math.random() * (i + 1));

            [copia[i], copia[j]] = [copia[j], copia[i]];

        }

        return copia.slice(0, cantidad);

    }

    function mostrarResultados(lista) {

        resultados.innerHTML = "";

        if (lista.length === 0) {

            resultados.innerHTML = `
                <div class="sin-resultados">
                    No se encontraron resultados.
                </div>
            `;

            resultados.style.display = "block";

            return;

        }

        resultados.style.display = "grid";

        lista.forEach(item => {

            const precio = Number(item.Precio).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS"
});

            resultados.innerHTML += `

            <article class="card">

                <img
                    src="img/${item.Imagen || "sin-portada.png"}"
                    alt="${item.Album}"
                    onerror="this.src='img/sin-portada.png'">

                <div class="card-body">

                    <h3>${item.Artista}</h3>

                    <p><strong>${item.Album}</strong></p>

                    <p>${item.Sello || ""}</p>

                    <p>${item.Origen || ""}</p>

                    <p>${item.Estado || ""}</p>

                   <div class="precio">
    ${item.Precio || ""}
</div>

                </div>

            </article>

            `;

        });

    }

    Papa.parse(URL_SHEET, {

        download: true,
        header: true,
        skipEmptyLines: true,

        complete: function(resultado) {

       catalogo = resultado.data.filter(item =>
    (item.Artista || "").trim() &&
    (item.Album || "").trim()
);
            console.log("Catálogo cargado:", catalogo.length);

            mostrarResultados(obtenerDestacados());

        }

    });

    buscador.addEventListener("input", () => {

        const texto = normalizar(buscador.value);

        if (texto === "") {

            mostrarResultados(obtenerDestacados());

            return;

        }

        const encontrados = catalogo.filter(item =>

            normalizar(item.Artista).includes(texto) ||
            normalizar(item.Album).includes(texto)

        );

        mostrarResultados(encontrados);

    });

});
