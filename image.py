#!/usr/bin/env python
# -*- coding: UTF-8 -*-
import sys
import sqlite3
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from tqdm import tqdm

def get_bing_images(begin_date, end_date):
    if begin_date > end_date: begin_date, end_date = end_date, begin_date
    begin = datetime.strptime(str(begin_date), '%Y%m%d')
    end = datetime.strptime(str(end_date), '%Y%m%d')
    images = []
    if datetime.now() - timedelta(days=15) >= end or begin > datetime.now():return images
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
    }
    image_dates = []
    for i in range(7):
        bing_api = f'https://cn.bing.com/HPImageArchive.aspx?format=js&idx={i}0&n=8&mkt=zh-CN'
        resp = requests.get(url=bing_api, headers=headers)
        if resp and resp.status_code == requests.codes.ok:
            resp_json = resp.json()
            images_json = resp_json['images']
            for image_json in images_json:
                date_str = str(image_json['enddate'])
                date = datetime.strptime(date_str, '%Y%m%d')
                if date >= begin and date <= end and date_str not in image_dates:
                    images.append((image_json['startdate'],image_json['fullstartdate'],image_json['enddate'],image_json['url'],
                                   image_json['urlbase'],image_json['copyright'],image_json['copyrightlink'],image_json['title'],
                                   image_json['quiz'],image_json['hsh']))
                    image_dates.append(date_str)
        else:
            print(resp.raise_for_status())
    return images;

def get_xinac_images(begin_date, end_date):
    if begin_date > end_date: begin_date, end_date = end_date, begin_date
    begin = datetime.strptime(str(begin_date), '%Y%m%d')
    end = datetime.strptime(str(end_date), '%Y%m%d')
    images = []
    if begin > datetime.now():return images
    if end > datetime.now(): end = datetime.now()
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
    }
    pageSize = 16
    days = (datetime.now() - end).days + 1 
    from_pageIndex = -(-days//pageSize)
    days = (datetime.now() - begin).days + 1 
    to_pageIndex = -(-days//pageSize)
    image_dates = []
    for i in range(from_pageIndex, to_pageIndex + 1):
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
                enddate_str = enddate.strftime("%Y%m%d")
                if enddate >= begin and enddate <= end and enddate_str not in image_dates:
                    images.append(('','',enddate_str, url,'',copyright,'',title,'',''))
                    image_dates.append(enddate_str)
        else:
            print(resp.raise_for_status())
    return images

def get_images(begin_date, end_date):
    # 天数
    if begin_date > end_date: begin_date, end_date = end_date, begin_date
    begin = datetime.strptime(str(begin_date), '%Y%m%d')
    end = datetime.strptime(str(end_date), '%Y%m%d')
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
    cursor.execute('select startdate,fullstartdate,enddate,url,urlbase,copyright,copyrightlink,title,quiz,hsh \
                      from wallpaper where enddate between ? and ?  order by enddate desc',(begin_date, end_date))
    images = cursor.fetchall();
    image_dates = []
    for image in images:
        if image[3] and image[5] and image[7]:
            image_dates.append(image[2])
    image_list = []
    for i in tqdm(range(days)):
        date = begin + timedelta(days=i)
        date_str = date.strftime('%Y%m%d')  
        if date_str in image_dates:
            continue
        # 官方api最多可获取前15天的壁纸
        if datetime.now() - timedelta(days=15) < date:
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
    print(f'影响了 {cursor.rowcount} 行')
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
    print(len(sys.argv))
    begin_date =  datetime.now().strftime('%Y%m%d')
    end_date =  datetime.now().strftime('%Y%m%d')
    if len(sys.argv) == 2:
        if sys.argv[1]:
            begin_date = sys.argv[1]
    if len(sys.argv) == 3:
        if sys.argv[2]:
            end_date = sys.argv[2]
    if begin_date > end_date: begin_date, end_date = end_date, begin_date
    print(f'爬取的时间范围: {begin_date} - {end_date}')
    images = get_images(begin_date, end_date)