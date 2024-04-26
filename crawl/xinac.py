import json
import requests
from bs4 import BeautifulSoup
from faker import Factory
fc = Factory.create()

# https://bing.xinac.net 网站爬虫

def get_image_listByPage(pageIndex=1):
    '''
      按分页爬取列表
      pageIndex 页码
      pageSize=16 每页个数
    '''
    headers = {
      'User-Agent': fc.user_agent(),
      'Referer': 'https://plmeizi.com'
    }
    # https://bing.xinac.net/?page=2
    url =f'https://bing.xinac.net/?page={pageIndex}'
    resp = requests.get(url, headers=headers)
    resp.encoding = resp.apparent_encoding
    soup = BeautifulSoup(resp.text, 'html.parser')
    tags = soup.select('article.card')
    # 格式化显示输出
    # print(list.prettify())
    list = []
    for tag in tags:
        a_tag = tag.find('a',class_='show')
        list.append({'date': tag.find('span',class_='u-time').string,
                     'title': tag.select('.title h2 a')[0].string,
                     'url': a_tag['href'],
                     'copyright': a_tag['title']
                    })
    return list

if __name__ == '__main__':
    list = get_image_listByPage(2)
    print(json.dumps(list, ensure_ascii=False, indent=2))