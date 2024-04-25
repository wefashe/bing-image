> 已知分辨率
- 1920x1200
- 1920x1080
- 1366x768
- 1280x768
- 1024x768
- 800x600
- 800x480
- 768x1280
- 720x1280
- 640x480
- 480x800
- 400x240
- 320x240
- 240x320

标清：480x320, 640x480 分辨率在1280ⅹ720P以下

高清：1024x720

全高清：1920x1080

2K： 2048*1080

超(高)清或称4K：3840x2160,7680x4320 4096*2160

8K：7680*4320

> 已知国家地区
- pt-BR 巴西
- en-CA 加拿大
- en-US 美国
- ja-JP 日本
- zh-CN 中国
- it-IT 意大利
- fr-FR 法国
- de-DE 德国
- en-GB 英国
- en-IN 印度
- es-ES 西班牙
- ROW






- https://bing.com 
- https://cn.bing.com 
- https://s.cn.bing.net  
- https://global.bing.com 
- https://www.bing.com
- https://s1.cn.bing.net
- https://s2.cn.bing.net
- https://s3.cn.bing.net
- https://s4.cn.bing.net 


https://cn.bing.com/cnhp/coverstory?d=20181212


[20140501,至今]


format	返回的数据格式。hp为html格式；js为json格式；其他值为xml格式。
idx	获取特定时间点的数据。如idx=1表示前一天（昨天），依此类推。经过测试最大值为7。
n	获取数据的条数。经测试，配合上idx最大可以获取到13天前的数据，即idx=7&n=7。
pid	未知。pid为hp时，copyrightlink返回的是相对地址。pid不为hp时，没有看到og信息。
ensearch	指定获取必应【国际版/国内版】的每日一图。当ensearch=1时，获取到的是必应国际版的每日一图数据。默认情况和其他值情况下，获取到的是必应国内版的每日一图数据。
quiz	当quiz=1时，返回必应小测验所需的相关数据。
og	水印图相关的信息。包含了title、img、desc和hash等信息。
uhd	当uhd=1时，可以自定义图片的宽高。当uhd=0时，返回的是固定宽高（1920x1080）的图片数据。
uhdwidth	图片宽度。当uhd=1时生效。最大值为3840，超过这个值当作3840处理。
uhdheight	图片高度。当uhd=1时生效。最大值为2592，超过这个值当作2592处理。
setmkt	指定图片相关的区域信息。如图片名中包含的EN-CN、EN-US或者ZH-CN等。当域名为global.bing.com时才会有相应变化。值的格式：en-us、zh-cn等。
setlang	指定返回数据所使用的语言。值的格式：en-us、zh-cn等。