#!/usr/bin/env python
# -*- coding: UTF-8 -*-
import os
import json
import requests
from faker import Factory
from bs4 import BeautifulSoup
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
import utils.date as date

# https://www.todaybing.com 网站爬虫

fc = Factory.create()

def get_image_listByDate(year=2024, month=1, area='cn'):
    '''
      按年月国家爬取列表
      year 年份
      month 月份
    '''
    headers = {
      'User-Agent': fc.user_agent(),
      'Referer': 'https://www.todaybing.com'
    }
    data = {
      'year': year,
      'month': month,
      'area': area,
      'action': 'ajax_get_all'
    }
    url = f'https://www.todaybing.com/web/api'
    resp = requests.post(url, headers=headers, data=data)
    resp.encoding = resp.apparent_encoding
    resp_json = resp.json()
    html_text = resp_json['data']
    html_text = html_text.strip('"')
    html_text = html_text.replace('\\n', '')
    html_text = html_text.replace('\\t', '')
    html_text = html_text.replace('\\"', '"')
    html_text = html_text.replace('\\n', '')
    html_text = html_text.replace('\\/', '/')
    soup = BeautifulSoup(html_text, 'html.parser')
     # 格式化显示输出
    # print(soup.prettify())
    tags = soup.select('div.list-item.block')
    list = []
    for tag in tags:
        list.append({'date':date.date_to_str(date.str_to_date(tag.div['data-date'],'%Y-%m-%d')),
                     'title': tag.div['data-title'].strip(),
                     'url': tag.div['data-bg'],
                    })
    return list

if __name__ == '__main__':
    list = get_image_listByDate(2023, 12)
    print(json.dumps(list, ensure_ascii=False, indent=2))


  