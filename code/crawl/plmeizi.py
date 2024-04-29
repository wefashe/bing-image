#!/usr/bin/env python
# -*- coding: UTF-8 -*-

import json
import requests
from bs4 import BeautifulSoup
from faker import Factory
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
import utils.date as date

# https://plmeizi.com 网站爬虫

fc = Factory.create()

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
        url = tag.img['data-src']
        url = 'https://plmeizi.com/resize/list_pic/bing/2024/MontBlancGlacier_ZH-CN2918240023_1920x1080.jpg'
        index = url.rfind('/OHR.')
        if index == -1:
           index = url.rfind('/')
        url = url[index + 1:]
        list.append({'date': date.str_format(tag.div.time.string,'%Y-%m-%d'),
                     'title': tag.div.span.string,
                     'url': '/th?id=' + url + '&rf=LaDigue_1920x1080.jpg',
                     'copyright': tag.img['alt']
                    })
    return list
        
if __name__ == '__main__':
    list = get_image_listByPage(1)
    print(json.dumps(list, ensure_ascii=False, indent=2))
