const URL_SHEET =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=0&single=true&output=csv";

let catalogo = [];

Papa.parse(URL_SHEET, {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function(resultado){
        catalogo = resultado.data;
        console.log("Catálogo cargado:", catalogo.length);
    }
});

document.addEventListener("DOMContentLoaded", () => {

    const buscador = document.getElementById("buscador");
    const resultados = document.getElementById("resultados");

    resultados.style.display = "none";

    buscador.addEventListener("input", () => {

        const texto = buscador.value.trim().toLowerCase();
const heroContenido = document.getElementById("hero-contenido");
        if (texto === "") {

            resultados.innerHTML = "";
            resultados.style.display = "none";
            return;

        }

        const encontrados = catalogo.filter(disco =>

            (disco.Artista || "").toLowerCase().includes(texto) ||
            (disco.Album || "").toLowerCase().includes(texto)

        );

        resultados.innerHTML = "";

        if (encontrados.length === 0) {

            resultados.style.display = "block";
            resultados.innerHTML = "<p>No se encontraron resultados.</p>";
            return;

        }

        resultados.style.display = "grid";

        encontrados.forEach(disco => {

            resultados.innerHTML += `
                <div class="tarjeta">
                    <h3>${disco.Artista}</h3>

                    <p><strong>${disco.Album}</strong></p>

                    <p>Sello: ${disco.Sello}</p>

                    <p>Origen: ${disco.Origen}</p>

                    <p>Estado: ${disco.Estado}</p>

                    <div class="precio">$${disco.Precio}</div>
                </div>
            `;

        });

    });

});
