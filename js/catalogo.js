const URL_SHEET =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=0&single=true&output=csv";

let catalogo = [];

function normalizar(texto) {
    return (texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

const texto = normalizar(buscador.value);

const encontrados = catalogo.filter(item =>
    normalizar(item.Artista).includes(texto) ||
    normalizar(item.Album).includes(texto)
);

Papa.parse(URL_SHEET, {
    download: true,
    header: true,
    skipEmptyLines: true,

  complete: function(resultado) {

    catalogo = resultado.data;

    console.log("Catálogo cargado:", catalogo.length);

    mostrarResultados(catalogo.slice(0, 12));

}

});

document.addEventListener("DOMContentLoaded", () => {

    const buscador = document.getElementById("buscador");
    const resultados = document.getElementById("resultados");

    buscador.addEventListener("input", buscar);

    function buscar() {

        const texto = buscador.value.trim().toLowerCase();

        if (texto === "") {

         mostrarResultados(catalogo.slice(0, 12));
return;

        }

        const encontrados = catalogo.filter(item => {

            return (
                (item.Artista || "").toLowerCase().includes(texto) ||
                (item.Album || "").toLowerCase().includes(texto)
            );

        });

        mostrarResultados(encontrados);

    }

    function mostrarResultados(lista) {

        resultados.innerHTML = "";

        if (lista.length === 0) {

            resultados.style.display = "block";
            resultados.innerHTML =
                `<div class="sin-resultados">
                    No se encontraron resultados.
                </div>`;

            return;

        }

        resultados.style.display = "grid";

        lista.forEach(item => {

            resultados.innerHTML += `

            <article class="card">

            <img
src="img/${item.Imagen || 'sin-portada.png'}"
alt="${item.Album}"
onerror="this.src='img/sin-portada.png'">

                <div class="card-body">

                    <h3>${item.Artista}</h3>

                    <p><strong>${item.Album}</strong></p>

                    <p>${item.Sello}</p>

                    <p>${item.Origen}</p>

                    <p>${item.Estado}</p>

                    <div class="precio">
                        $${item.Precio}
                    </div>

                </div>

            </article>

            `;

        });

    }

});
