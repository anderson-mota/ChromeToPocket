/**
 * Created by anderson.mota on 20/02/2015.
 */
function doit(e) {
    var files = e.target.files;
    var reader = new FileReader();
    reader.onload = function() {
        var parsed = new DOMParser().parseFromString(this.result, "text/xml");
        console.log(parsed);
    };
    reader.readAsText(files[0]);
}

document.getElementById("inputImporter").addEventListener("change", doit, false);