#!/usr/bin/env python
# -*- coding: UTF-8 -*-
import sys
import sqlite3
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from tqdm import tqdm
import json
import re

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
    '''
    create table if not exists bing_image                                         /* 必应美图表 */
    (
        date          varchar(8)   not null default ' ' primary key,              /* 日期    */
        title         varchar(150) not null default ' ',                          /* 标题    */
        url           varchar(200) not null default ' ' unique,                   /* 图片地址 */
        copyright     varchar(150) not null default ' ',                          /* 版权    */
        quickfact     varchar(200) not null default ' ',                          /* 速览    */
        description   text         not null default ' ',                          /* 描述    */
        updatetime    timestamp    not null default (datetime('now', '+8 hour')), /* 修改时间 */
        copyrightlink varchar(200) not null default ' '                           /* 版权链接 */
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

def get_bing_image():
    url = 'https://cn.bing.com'

    headers = {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'
    }

    res = requests.get(url, headers=headers)
    res.encoding = res.apparent_encoding

    ret = re.search("var _model =(\{.*?\});", res.text)
    if not ret:
        return

    data = json.loads(ret.group(1))
    image_content = data['MediaContents'][0]['ImageContent']

    return {
        'headline': image_content['Headline'],
        'title': image_content['Title'],
        'description': image_content['Description'],
        'Copyright': image_content['Copyright'],
        'Url': image_content['Image']['Url'],
        'Wallpaper': image_content['Image']['Wallpaper'],
        'main_text': image_content['QuickFact']['MainText'],
        'BackstageUrl': image_content['BackstageUrl']
    }

if __name__ == '__main__':
    begin_date =  datetime.now().strftime('%Y%m%d')
    end_date =  datetime.now().strftime('%Y%m%d')
    if len(sys.argv) > 1:
        if sys.argv[1]:
            begin_date = sys.argv[1]
    if len(sys.argv) > 2:
        if sys.argv[2]:
            end_date = sys.argv[2]
    if begin_date > end_date: begin_date, end_date = end_date, begin_date
    print(f'爬取的时间范围: {begin_date} - {end_date}')
    images = get_images(begin_date, end_date)

    # res = get_bing_image()
    # print(json.dumps(res, ensure_ascii=False, indent=2))