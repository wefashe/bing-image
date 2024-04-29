#!/usr/bin/env python
# -*- coding: UTF-8 -*-

import re
import sys
import crawl.bing as bing
import crawl.plmeizi as plmei
import crawl.todbi as todbi
import crawl.wilii as wilii
import crawl.xinac as xinac
import datal.sqllite as sqllite
import utils.date as date

'''
    生成单个项目中的使用到的安装包文件 requirements.txt
    pip install pipreqs
    pipreqs ./ --encoding=utf8 --force
    使用安装 requirements.txt 文件
    pip install -r requirements.txt -i http://pypi.doubanio.com/simple --trusted-host pypi.doubanio.com

'''

def daily_update():
    '''
    每天定时晚上 2:00 执行
    '''
    # 获取今天的壁纸数据
    images = bing.get_image_listByDays(1)
    today = date.str_date_now()
    if len(images) == 0:
        raise Exception(f'{today}日未获取到壁纸数据，请检查')
    image_date = images[0]['enddate']
    if  image_date != today:
        raise Exception(f'{today}日获取到的壁纸数据日期为{image_date}，请检查')
    count = sqllite.update_image_list(images)
    print(f'每日定时更新: {today} 日成功更新了 {count} 条数据')

def batch_update(begin_date, end_date):
    '''
    按日期范围 批量 执行
    '''
    if not date.check_str_date(begin_date):
        raise Exception(f'begin_date 输入日期 {begin_date} 不合法，请检查')
    if not date.check_str_date(end_date):
        raise Exception(f'end_date 输入日期 {end_date} 不合法，请检查')
    if begin_date > end_date: begin_date, end_date = end_date, begin_date
    count = 0
    today = date.str_date_now()
    print(f'手动批量更新: {today} 日批量更新了 {begin_date}-{end_date} 的 {count} 条数据')

if __name__ == '__main__':
    argv_len = len(sys.argv)
    if argv_len > 1:
        begin_date = sys.argv[1]
        if argv_len > 2:
            end_date = sys.argv[2]
        else:
            end_date = date.str_date_now()
        batch_update(begin_date, end_date)
    else:
        daily_update()