#!/usr/bin/env python
# -*- coding: UTF-8 -*-
import os
import re
import json
import requests
from faker import Factory
from bs4 import BeautifulSoup
import sys
from datetime import datetime, timedelta
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
import utils.date as date_utils

# https://cn.bing.com 网站爬虫

fc = Factory.create()

def get_image_listByDays(days):
    '''
      按天数获取列表
      days 获取前几天的列表, 等于1为今天, 最大15天,必须大于0
    '''
    if days > 15:
        days = 15
    first_days = days
    second_days = 0
    if days > 8:
        first_days = 8
        second_days = days - 8
    headers = {
      'User-Agent': fc.user_agent(),
      'Referer': 'https://cn.bing.com'
    }
    url = f'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n={first_days}&mkt=zh-CN'
    resp = requests.get(url=url, headers=headers)
    resp.encoding = resp.apparent_encoding
    first_list = resp.json()
    if second_days == 0:
        return first_list
    headers = {
      'User-Agent': fc.user_agent(),
      'Referer': 'https://cn.bing.com'
    }
    url = f'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=7&n={second_days + 1}&mkt=zh-CN'
    resp = requests.get(url=url, headers=headers)
    resp.encoding = resp.apparent_encoding
    second_list = resp.json()
    first_list['images'] = first_list['images'] + second_list['images'][1:]
    return first_list

def get_image_coverstory(date='20240101'):
    headers = {
      'User-Agent': fc.user_agent(),
      'Referer': 'https://cn.bing.com'
    }
    # https://cn.bing.com/cnhp/coverstory?d=20181212
    # https://cn.bing.com/search?q=1&filters=HpDate:"20240425_1600"
    url =f'https://cn.bing.com/search?q=1&filters=HpDate:"{date_utils.str_date_add(date, -1)}_1600"'
    resp = requests.get(url=url, headers=headers)
    resp.encoding = resp.apparent_encoding
    soup = BeautifulSoup(resp.text, 'html.parser')
     # 格式化显示输出
    print(soup.prettify())
    tags = soup.select('#encycloCanvas.encycloCanvas_Medium')
    print(tags)

def get_today_image():
    '''
      获取当天的信息
    '''
    headers = {
      'User-Agent': fc.user_agent(),
      'Referer': 'https://cn.bing.com'
    }
    url = 'https://cn.bing.com'
    res = requests.get(url, headers=headers)
    res.encoding = res.apparent_encoding
    ret = re.search("var _model =(\{.*?\});", res.text)
    if not ret:
        return
    data = json.loads(ret.group(1))
    media_Content = data['MediaContents'][0]
    image_content = media_Content['ImageContent']
    return {
        'date': media_Content['FullDateString'], 
        'title': image_content['Headline'],
        'url': image_content['Image']['Wallpaper'],
        'Copyright': image_content['Title']+' ('+image_content['Copyright']+')',
        'quickfact': image_content['QuickFact']['MainText'],
        'description': image_content['Description'],
        'copyrightlink': image_content['BackstageUrl'],
        'quiz': image_content['TriviaUrl'],
    }

if __name__ == '__main__':
    list = get_image_listByDays(15)
    print(json.dumps(list, ensure_ascii=False, indent=2))
    get_image_coverstory('20240426')
    detail = get_today_image()
    print(json.dumps(detail, ensure_ascii=False, indent=2))