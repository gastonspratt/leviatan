const URL_SHEET =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LPxA_j_r4zr2_LJAlf03uqkXrW2uj1dZE-diFxU8TD0ta0uh5_CFFoZdmbPVdCAJfg6dOfyjWVgt/pub?gid=0&single=true&output=csv";

Papa.parse(URL_SHEET, {

    download: true,

    header: true,

    skipEmptyLines: true,

    complete: function(resultado){

        console.clear();

        console.log("Catálogo cargado");

        console.table(resultado.data);

        console.log("Cantidad de discos:", resultado.data.length);

    }

});
