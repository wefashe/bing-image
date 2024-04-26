#!/usr/bin/env python
# -*- coding: UTF-8 -*-
import sys
import sqlite3
import requests
import pytz
import time
import random
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from tqdm import tqdm
import json
import re
from faker import Factory

'''
    生成单个项目中的使用到的安装包文件 requirements.txt
    pip install pipreqs
    pipreqs ./ --encoding=utf8 --force
    使用安装 requirements.txt 文件
    pip install -r requirements.txt -i http://pypi.doubanio.com/simple --trusted-host pypi.doubanio.com

'''
fc = Factory.create()

# 国内北京时间
today = datetime.now(pytz.timezone('Asia/Shanghai'))
# 时间转字符串
def date_to_str(date, format='%Y%m%d'):
    return date.strftime(format)
# 字符串转时间
def str_to_date(str, format='%Y%m%d'):
    return datetime.strptime(str, format).replace(tzinfo=pytz.timezone('Asia/Shanghai'))

def get_bing_today_image():
    url = 'https://cn.bing.com'
    headers = {
        'User-Agent': fc.user_agent(),
    }
    res = requests.get(url, headers=headers)
    res.encoding = res.apparent_encoding

    ret = re.search("var _model =(\{.*?\});", res.text)
    if not ret:
        return

    data = json.loads(ret.group(1))
    image_content = data['MediaContents'][0]['ImageContent']

    return {
        'date': date_to_str(today), 
        'title': image_content['Headline'],
        'url': image_content['Image']['Wallpaper'],
        'Copyright': image_content['Title']+' ('+image_content['Copyright']+')',
        'quickfact': image_content['QuickFact']['MainText'],
        'description': image_content['Description'],
        'copyrightlink': image_content['BackstageUrl']
    }

def get_bing_images(begin_date, end_date):
    if begin_date > end_date: begin_date, end_date = end_date, begin_date
    begin = str_to_date(str(begin_date))
    end =  str_to_date(str(end_date))
    images = []
    if today - timedelta(days=15) >= end or begin > today:return images
    image_dates = []
    for i in range(7):
        headers = {
            'User-Agent': fc.user_agent(),
        }
        time.sleep(random.uniform(0.5, 1))
        bing_api = f'https://cn.bing.com/HPImageArchive.aspx?format=js&idx={i}0&n=8&mkt=zh-CN'
        resp = requests.get(url=bing_api, headers=headers)
        if resp and resp.status_code == requests.codes.ok:
            resp_json = resp.json()
            images_json = resp_json['images']
            for image_json in images_json:
                date_str = str(image_json['enddate'])
                date = str_to_date(date_str)
                if date >= begin and date <= end and date_str not in image_dates:
                    url = image_json['url']
                    index = url.find('&')
                    if index != -1 :
                        url = url[0:index]
                    url = url.replace('_UHD.jpg','_1920x1080.jpg')+'&rf=LaDigue_1920x1080.jpg'
                    images.append((image_json['startdate'],image_json['fullstartdate'],image_json['enddate'],url,
                                   image_json['urlbase'],image_json['copyright'],image_json['copyrightlink'],image_json['title'],
                                   image_json['quiz'],image_json['hsh']))
                    image_dates.append(date_str)
        else:
            try:
                resp.raise_for_status()
            except requests.exceptions.HTTPError as errh:
                print("HTTP错误:", errh)
            except requests.exceptions.ConnectionError as errc:
                print("连接错误:", errc)
            except requests.exceptions.Timeout as errt:
                print("超时错误:", errt)
            except requests.exceptions.RequestException as err:
                print("其他错误:", err)
            continue
    return images;

def get_xinac_images(begin_date, end_date):
    if begin_date > end_date: begin_date, end_date = end_date, begin_date
    begin = str_to_date(str(begin_date))
    end = str_to_date(str(end_date))
    images = []
    if begin > today:return images
    if end > today: end = today
    pageSize = 16
    days = (today - end).days + 1 
    from_pageIndex = -(-days//pageSize)
    days = (today - begin).days + 1 
    to_pageIndex = -(-days//pageSize)
    image_dates = []
    for i in range(from_pageIndex, to_pageIndex + 1):
        headers = {
            'User-Agent': fc.user_agent(),
        }
        time.sleep(random.uniform(0.5, 1))
        xinac_api = f'https://bing.xinac.net/?page={i}'
        resp = requests.get(url=xinac_api, headers=headers)
        if resp and resp.status_code == requests.codes.ok:
            soup = BeautifulSoup(resp.text, 'html.parser')
            articles = soup.find_all('article', class_='card')
            for article in articles:
                a_tag = article.find_all('a',class_='show')[0]
                url = a_tag['href']
                url = url[url.find("/th?id="):]
                copyright = a_tag['title']
                span_tag = article.find_all('span',class_='u-time')[0]
                a_tag = article.select('.title h2 a')[0]
                title = a_tag.string
                enddate = datetime.strptime(str(span_tag.string), '%b %d, %Y')
                enddate_str =date_to_str(enddate)
                if enddate >= begin and enddate <= end and enddate_str not in image_dates:
                    images.append(('','',enddate_str.strip(), url.strip(),'',copyright.strip(),'',title.strip(),'',''))
                    image_dates.append(enddate_str)
        else:
            try:
                resp.raise_for_status()
            except requests.exceptions.HTTPError as errh:
                print("HTTP错误:", errh)
            except requests.exceptions.ConnectionError as errc:
                print("连接错误:", errc)
            except requests.exceptions.Timeout as errt:
                print("超时错误:", errt)
            except requests.exceptions.RequestException as err:
                print("其他错误:", err)
            continue
    return images

def get_images(begin_date, end_date):
    if begin_date > end_date: begin_date, end_date = end_date, begin_date
    begin = str_to_date(str(begin_date))
    end = str_to_date(str(end_date))
    days = (end - begin).days + 1 
    # 1、按日期范围进行数据库查
    conn = sqlite3.connect('docs/data/images.db')
    cursor = conn.cursor()
    cursor.execute('''  create table if not exists wallpaper
                        (
                            startdate     varchar(8)   not null default ' ',
                            fullstartdate varchar(50)  not null default ' ',
                            enddate       varchar(8)   not null default ' ' primary key,
                            url           varchar(150) not null default ' ' unique,
                            urlbase       varchar(100) not null default ' ',
                            copyright     varchar(150) not null default ' ',
                            copyrightlink varchar(150) not null default ' ',
                            title         varchar(100) not null default ' ',
                            quiz          varchar(150) not null default ' ',
                            hsh           varchar(50)  not null default ' ',
                            createtime    timestamp not null default current_timestamp,
                            updatetime    timestamp not null default current_timestamp
                        ); ''')
    '''
    create table if not exists bing_image                                         /* 必应美图表 */
    (
        date          varchar(8)   not null default ' ' primary key,              /* 日期      */
        title         varchar(150) not null default ' ',                          /* 标题      */
        url           varchar(200) not null default ' ',                          /* 图片地址   */
        keyword       varchar(100) not null default ' ',                          /* 关键词     */
        copyright     varchar(150) not null default ' ',                          /* 版权      */
        quickfact     varchar(200) not null default ' ',                          /* 速览      */
        description   text         not null default ' ',                          /* 描述      */
        updatetime    timestamp    not null default (datetime('now', '+8 hour'))  /* 修改时间   */
    );
    '''
    cursor.execute('select startdate,fullstartdate,enddate,url,urlbase,copyright,copyrightlink,title,quiz,hsh \
                      from wallpaper where enddate between ? and ?  order by enddate desc',(begin_date, end_date))
    images = cursor.fetchall();
    image_dates = []
    for image in images:
        end_date = image[2]
        url = image[3]
        copyright = image[5]
        title = image[7]
        if end_date and end_date.strip() and url and url.strip() \
           and copyright and copyright.strip() and title and title.strip():
            image_dates.append(image[2])
    image_list = []
    for i in tqdm(range(days)):
        date = begin + timedelta(days=i)
        date_str = date_to_str(date)
        if date_str in image_dates:
            continue
        # 官方api最多可获取前15天的壁纸
        if today - timedelta(days=15) < date:
            # 官方api获取壁纸
            bing_images = get_bing_images(date_str, date_str)
            image_list.extend(bing_images)
        else:
            # 其他网站获取壁纸
            xinac_images = get_xinac_images(date_str, date_str)
            image_list.extend(xinac_images)
    # 数据存在时先删后插
    cursor.executemany('replace into wallpaper(startdate,fullstartdate,enddate,url,urlbase,copyright,copyrightlink,title,quiz,hsh,updatetime) \
                        values (?,?,?,?,?,?,?,?,?,?,current_timestamp)', image_list)
    print(f'共更新 {cursor.rowcount} 日数据')
    # 数据放入images数组中
    # 对images按日期排序
    # 提交改动
    conn.commit()
    # 关闭游标
    cursor.close()
    # 关闭连接
    conn.close()
    return images

if __name__ == '__main__':
    begin_date =  date_to_str(today)
    end_date =  date_to_str(today)
    if len(sys.argv) > 1:
        if sys.argv[1]:
            begin_date = sys.argv[1]
    if len(sys.argv) > 2:
        if sys.argv[2]:
            end_date = sys.argv[2]
    if begin_date > end_date: begin_date, end_date = end_date, begin_date
    print(f'爬取的时间范围: {begin_date} - {end_date}')
    images = get_images(begin_date, end_date)

    # res = get_bing_today_image()
    # print(json.dumps(res, ensure_ascii=False, indent=2))