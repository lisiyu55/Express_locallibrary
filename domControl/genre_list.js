function genredraw(list_genre){
    var content = document.getElementById("content");
    for(var i = 0; i < list_genre.length; i++){
        var node = document.createElement("li");
        node.value = list_genre[i].name;
        content.append(node);
    }


}
module.exports = genredraw;