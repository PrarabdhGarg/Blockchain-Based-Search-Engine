function search(text) {
    console.log(text)
    $.post("/search", {text: text}, function(data) {
        console.log(data)
        var finalData = JSON.parse(data.toString())
        if(finalData.hasOwnProperty('error')) {
            alert(finalData['error'])
        } else {
            var keys = Object.keys(finalData)
            ul = $("<ul>")
            for (var i = 0; i < keys.length; i++) {
                ul.append("<h1><li><a target='_blank' href='" + keys[i] + "'>" + finalData[keys[i]]["title"] + "</a></li></h1>")
                // console.log("X = " + x[1])
            }
            $('#results').empty()
            if(keys.length == 0) {
                alert('No Results Found. Make sure that you have crawled atleast one website containing the word')
            }
            $('#results').append(ul)
        }
        // alert(JSON.stringify(sortedArray));
    })
}

function crawl(url) {
    
    console.log(url)
    $.post("/crawl", {url: url}, function(data) {
        alert(data)
    })
    alert('Starting to crawl website ' + url.toString())
}