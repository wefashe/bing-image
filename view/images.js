let config = {
    locateFile: () => "/view/sqljs/sql-wasm-debug.wasm",
};
initSqlJs(config).then(function (SQL) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', "../data/images.db", true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = e => {
        const uInt8Array = new Uint8Array(xhr.response);
        const db = new SQL.Database(uInt8Array);
        var stmt = db.prepare("select * from wallpaper w  order by enddate desc limit ($pageIndex * $pageSize), $pageSize");
        stmt.bind({ $pageIndex: 1, $pageSize: 90 });
        var imageList = '<div>'
        while (stmt.step()) {
            var row = stmt.getAsObject();
            imageList += `<div> 
                                <a href = "https://cn.bing.com${row.copyrightlink}" target="_blank"> 
                                    <img src="https://cn.bing.com${row.url}" title="${row.copyright}" alt="https://cn.bing.com${row.urlbase}" width = 200 height = 100> 
                                </a>
                                <div class="img-title">${row.title}</div> 
                         </div>`
        }
        imageList += '</div>'
        var imageId = document.getElementById('img-list')
        imageId.innerHTML = imageList
    };
    xhr.send(); 
});