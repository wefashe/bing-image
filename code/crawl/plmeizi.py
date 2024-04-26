#!/usr/bin/env python
# -*- coding: UTF-8 -*-

import json
import requests
from bs4 import BeautifulSoup
from faker import Factory
fc = Factory.create()

# https://plmeizi.com 网站爬虫

def get_image_listByPage(pageIndex=1):
    '''
      按分页爬取列表
      pageIndex 页码
      pageSize=30 每页个数
    '''
    headers = {
      'User-Agent': fc.user_agent(),
      'Referer': 'https://plmeizi.com'
    }
    # https://plmeizi.com/list/new/desc/classic.html?page=2
    url = f'https://plmeizi.com/list/new/desc/classic.html?page={pageIndex}'
    resp = requests.get(url, headers=headers)
    resp.encoding = resp.apparent_encoding
    soup = BeautifulSoup(resp.text, 'html.parser')
    tags = soup.select('div.list a')
    # 格式化显示输出
    # print(list.prettify())
    list = []
    for tag in tags:
        list.append({'date': tag.div.time.string,
                     'title': tag.div.span.string,
                     'url': tag.img['data-src'],
                     'copyright': tag.img['alt']
                    })
    return list
        
if __name__ == '__main__':
    list = get_image_listByPage(1)
    print(json.dumps(list, ensure_ascii=False, indent=2))
