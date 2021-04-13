function sortByValue(jsObj){
    var sortedArray = [];
    for(var i in jsObj)
    {
        console.log(i)
        console.log(jsObj[i])
        // Push each JSON Object entry in array by [value, key]
        sortedArray.push([Number(jsObj[i]), i]);
    }
    return sortedArray.sort();
}

function search(text) {
    console.log(text)
    $.post("/search", {text: text}, function(data) {
        console.log(data)
        var sortedArray = sortByValue(JSON.parse(data))
        console.log(sortedArray)
        ul = $("<ul>")
        for (let x of sortedArray) {
            
                ul.append("<li><a href='" + x[1] + "'>" + x[1] + "</a></li>")
                console.log("X = " + x[1])
            
        }
        $('#results').empty()
        $('#results').append(ul)
        // alert(JSON.stringify(sortedArray));
    })
}

function crawl(url) {
    console.log(url)
    $.post("/crawl", {url: url}, function(data) {
        alert(data)
    })
}