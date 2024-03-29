#!/usr/bin/env python
# -*- coding: UTF-8 -*-

'''
爬取必应壁纸
'''

import requests
import ctypes
from tqdm import tqdm
import os
import time
import sqlite3
import shutil
import h2

# TODO 获取每天的必应壁纸
bing_api_prefixs = ['https://cn.bing.com',
                    'https://s.cn.bing.net',
                    'https://global.bing.com',
                    'https://www.bing.com']

bing_api_prefix = bing_api_prefixs[0]
bing_api_suffix = '/HPImageArchive.aspx'
headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
}
params = {
    'format': 'js',
    'idx': 0,
    'n': 7,
    'mkt': 'zh-CN'
}
for prefix in bing_api_prefixs:
    bing_api_prefix = prefix
    bing_api = bing_api_prefix + bing_api_suffix
    resp = requests.get(url=bing_api, headers=headers, params=params)
    if resp and resp.status_code == requests.codes.ok:
        break
    else:
        print(resp.raise_for_status())

# ! 上面可能所有都存在问题，导致resp没有值，这里先进行判断
        
resp_json = resp.json()
images = resp_json['images']
print(bing_api_prefix)

# ! images可能没有值
for image in images:
    image_url = bing_api_prefix +  image['url']
    print(image_url)
    resp = requests.get(image_url,  headers=headers, stream=True)
    image_path = os.path.join(os.getcwd(),'images',image['hsh'] + ".jpg")
    if not os.path.exists(os.path.dirname(image_path)):
        os.makedirs(os.path.dirname(image_path))
    with open(image_path, "wb+") as image_file:
        for chunk in resp.iter_content(chunk_size=1024):
            if chunk:
                image_file.write(chunk)

# TODO 同步保存到数据库中


conn = sqlite3.connect('data/images.db')
cursor = conn.cursor()
try:
    # 判断表是否存在，不存在则执行schema.sql脚本
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{'test'}';")
    if not cursor.fetchone():
        script_path = 'db/schema.sql'
        if os.path.getsize(script_path):
            script_file = open(file=script_path, mode='r',encoding='UTF-8')
            script = script_file.read()
            cursor.executescript(script)
            conn.commit()
        
    
    # conn.commit()
except sqlite3.Error as e:
    print(e)
    # 发生错误，回滚事务
    conn.rollback()
finally:
    cursor.close()
    conn.close()

# TODO 壁纸在README.md文件展示

# TODO 同步展示到年月份文件中

# TODO 同步展示到对应的html文件中

# TODO 按时间进行下载必应壁纸

# TODO 预览壁纸，把壁纸设为电脑桌面壁纸

# TODO 展示的html进行完善，加上故事和地图定位
 


# try:
#     cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{'test'}';")
#     result = cursor.fetchone()
#     if not result:
#         cursor.execute('''CREATE TABLE test
#         (ID INT PRIMARY KEY     NOT NULL,
#         NAME           TEXT    NOT NULL,
#         AGE            INT     NOT NULL,
#         ADDRESS        CHAR(50),
#         SALARY         REAL);''')
    # cursor.execute("INSERT INTO test (ID,NAME,AGE,ADDRESS,SALARY) \
    #       VALUES (1, 'Paul', 32, 'California', 20000.00 )")
        
    # data = [('B', '一班', '女', 78, 87, 85),
    #         ('C', '一班', '男', 98, 84, 90),
    #         ]
    # cursor.executemany('INSERT INTO scores VALUES (?,?,?,?,?,?)', data)
        

    # 查询数学成绩大于90分的学生
    # sql_text_3 = "SELECT * FROM scores WHERE 数学>90"
    # cursor.execute(sql_text_3)
    # # 获取查询结果
    # results  =cursor.fetchall()
        
#     # 受影响行数
#     cursor.rowcount

#     conn.commit()
# except sqlite3.Error:
#     # 发生错误，回滚事务
#     conn.rollback()
# finally:
#     cursor.close()
#     conn.close()

# # 创建数据库备份
# shutil.copy2('mydatabase.db', 'mydatabase_backup.db')

# bing_api = f'https://cn.bing.com/HPImageArchive.aspx'
# headers = {
#     'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
# }
# params = {
#     'format': 'js',
#     'idx': 0,
#     'n': 7,
#     'mkt': 'zh-CN'
# }
# for i in tqdm(range(1000)): 
#     time.sleep(0.001)
# resp = requests.get(bing_api,  params=params, headers=headers)
# if resp and resp.status_code != requests.codes.ok:
#     print(resp.raise_for_status())
#     exit()
# resp_json = resp.json()
# images = resp_json['images']
# for image in tqdm(images):
# # for i in tqdm(range(len(images))):
#     # image = images[i]
#     # print(image['url'])
#     resp = requests.get('https://cn.bing.com/'+image['url'],  headers=headers)
#     filepath = os.path.join(os.getcwd(),image['hsh'] + ".jpg")
#     with open(filepath,"wb+")as img_write:
#         img_write.write(resp.content)
#     # ctypes.windll.user32.SystemParametersInfoW(20, 0, filepath, 0)
