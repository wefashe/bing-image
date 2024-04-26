import requests
from faker import Factory
import time
import random
import sqlite3

fc = Factory.create()
from datetime import datetime, timedelta
import pytz


https://api.wilii.cn/api/Bing/Timeline?year=2014&month=5

# 国内北京时间
today = datetime.now(pytz.timezone('Asia/Shanghai'))
# 时间转字符串
def date_to_str(date, format="%Y%m%d"):
    return date.strftime(format)
# 字符串转时间
def str_to_date(str, format="%Y%m%d"):
    return datetime.strptime(str, format).replace(tzinfo=pytz.timezone('Asia/Shanghai'))

conn = sqlite3.connect('docs/data/images.db')
cursor = conn.cursor()
f = open("update_sql.txt", "a+",encoding="utf-8")
with open('result.txt', 'a+',encoding="utf-8") as file:
  # for i in range(1, 339):
  page = pageCount = 228
  while(page <= pageCount):
    time.sleep(random.uniform(1, 3))
    url = f'https://api.wilii.cn/api/bing?page={page}&pageSize=16'
    headers = {
      'User-Agent': fc.user_agent(),
      'Referer': 'https://bing.wilii.cn'
    }
    list_resp = requests.get(url, headers=headers)
    list_resp.encoding = list_resp.apparent_encoding
    if not list_resp or list_resp.status_code != requests.codes.ok:
      print(f'第{page}页失败')
      continue
    list_resp_json = list_resp.json()
    if list_resp_json['status'] != 200 or not list_resp_json['response'] or not list_resp_json['response']['data']:
      print(f'第{page}页失败')
      continue
    data_list = list_resp_json['response']['data']
    for img_obj in data_list:
      time.sleep(random.uniform(1, 3))
      url = f'https://api.wilii.cn/api/Bing/{img_obj["guid"]}'
      # print(url)
      headers = {
        'User-Agent': fc.user_agent(),
        'Referer': f'https://bing.wilii.cn/gallery?p={page}'
      }
      dtl_resp = requests.get(url, headers=headers)
      dtl_resp.encoding = dtl_resp.apparent_encoding
      if not dtl_resp or dtl_resp.status_code != requests.codes.ok:
        print(f'{url}查询失败')
        continue
      dtl_resp_json = dtl_resp.json()
      if dtl_resp_json['status'] != 200 or not dtl_resp_json['response']:
        print(f'{url}查询失败')
        continue
      dtl_obj = dtl_resp_json['response']
      date = date_to_str(str_to_date(dtl_obj['date'],'%Y-%m-%d'))
      cursor.execute(f"select * from wallpaper where enddate = '{date}'")
      image = cursor.fetchone();
      # print(image[2]+' '+ image[3])
      if image and image[3].strip(): continue
      title = dtl_obj['headline']
      if not title: 
        title = ' '
      else:
        title = dtl_obj['title']
      urlpic = dtl_obj['urlpic']
      if urlpic:
        url = '/th?id=OHR.' + urlpic[1:] +'_1920x1080.jpg&rf=LaDigue_1920x1080.jpg'
      else:
        url = ' '
      
      copyright = dtl_obj['copyright']
      if title.strip() and copyright:
        copyright = title+' ('+copyright+')'
      else:
        copyright = ' '
      print(f"UPDATE wallpaper SET title='{title}', url='{url}', copyright='{copyright}' WHERE enddate='{date}';")
      # print(f"REPLACE INTO wallpaper (enddate, title, url, copyright) VALUES ('{date}', '{title}', '{url}', '{copyright}');")
      f.write(f"UPDATE wallpaper SET title='{title}', url='{url}', copyright='{copyright}' WHERE enddate='{date}';\n")
      f.flush()
      print(date+'日完成')
      file.write(date+'日完成'+'\n')
      file.flush()
    print('第'+str(page)+'页完成')
    file.write('第'+str(page)+'页完成'+'\n')
    page = list_resp_json['response']['page'] + 1
    pageCount = list_resp_json['response']['pageCount']


#     https://www.todaybing.com/web/api
# year: 2017
# month: 12
# area: cn
# action: ajax_get_all
# post


