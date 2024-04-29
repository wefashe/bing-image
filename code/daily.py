#!/usr/bin/env python
# -*- coding: UTF-8 -*-

import crawl.bing as bing
import datal.sqllite as sqllite
import utils.date as date

'''
  每天定时晚上 2:00 执行
'''

# 获取今天的壁纸数据
today = date.date_to_str(date.date_now())
images = bing.get_image_listByDays(1)
if len(images) == 0:
  raise Exception(f'{today}日未获取到壁纸数据，请检查')
image_date = images[0]['enddate']
if  image_date != today:
  raise Exception(f'{today}日获取到的壁纸数据日期为{image_date}，请检查')
count = sqllite.update_image_list(images)
print(f'{today} 日成功更新 {count} 条数据')



