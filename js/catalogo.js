const URL_SHEET =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=0&single=true&output=csv";

let catalogo = [];

Papa.parse(URL_SHEET, {

    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function(resultado){

        catalogo = resultado.data;

        console.log("Cantidad de discos:", catalogo.length);

    }

});

document.addEventListener("DOMContentLoaded", () => {

    const buscador = document.getElementById("buscador");
    const contenedor = document.getElementById("resultados");

    buscador.addEventListener("input", () => {

        const texto = buscador.value.toLowerCase();

        const resultados = catalogo.filter(disco => {

            return (
                (disco.Artista || "").toLowerCase().includes(texto) ||
                (disco.Album || "").toLowerCase().includes(texto)
            );

        });

        contenedor.innerHTML = "";

        resultados.forEach(disco => {

            contenedor.innerHTML += `
                <div class="tarjeta">
                    <h3>${disco.Artista}</h3>
                    <p><strong>${disco.Album}</strong></p>
                    <p>${disco.Sello}</p>
                    <p>${disco.Origen}</p>
                    <p>${disco.Estado}</p>
                    <div class="precio">$${disco.Precio}</div>
                </div>
            `;

        });

    });

});        });

        console.clear();
        console.table(resultados);

    });

});
