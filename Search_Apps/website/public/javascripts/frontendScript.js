function search(text) {
    console.log(text)
    $.post("/search", {text: text}, function(data) {
        alert(JSON.stringify(data));
    })
}

function crawl(url) {
    console.log(url)
    $.post("/crawl", {url: url}, function(data) {
        alert(data)
    })
}