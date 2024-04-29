#!/usr/bin/env python
# -*- coding: UTF-8 -*-

import pytz
from datetime import datetime, timedelta

def str_format(str, format='%Y%m%d'):
  # 国内北京时间
  return date_to_str(str_to_date(str, format))

def date_now():
  # 国内北京时间
  return datetime.now(pytz.timezone('Asia/Shanghai'))

def str_date_now(format='%Y%m%d'):
  # 国内北京时间
  return date_to_str(date_now(), format)

def date_to_str(date, format='%Y%m%d'):
    # 时间转字符串
    return date.strftime(format)

def str_to_date(str, format='%Y%m%d'):
    # 字符串转时间
    return datetime.strptime(str, format).replace(tzinfo=pytz.timezone('Asia/Shanghai'))

def check_str_date(str, format='%Y%m%d'):
    # 检查日期格式是否合法
    try:
        str_to_date(str, format)
        return True
    except Exception as e:
        print("check_str_date error:", e)
        return False

def date_add(date, days):
  return date + timedelta(days=days) 

def str_date_add(date, days, format='%Y%m%d'):
  return date_to_str(date_add(str_to_date(date, format), days))


if __name__ == '__main__':
  now = date_now()
  print(str_date_add('20210101',-1))
   