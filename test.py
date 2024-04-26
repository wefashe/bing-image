import sqlite3
import requests
import pytz
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta
from faker import Factory
from tqdm import tqdm

fc = Factory.create()

# 国内北京时间
today = datetime.now(pytz.timezone('Asia/Shanghai'))
# 时间转字符串
def date_to_str(date, format='%Y%m%d'):
    return date.strftime(format)
# 字符串转时间
def str_to_date(str, format='%Y%m%d'):
    return datetime.strptime(str, format).replace(tzinfo=pytz.timezone('Asia/Shanghai'))


conn = sqlite3.connect('docs/data/images.db')
cursor = conn.cursor()

date = today
while date>=str_to_date('20090713'):
  date_str = date_to_str(date)
  cursor.execute(f"select enddate from wallpaper w where enddate = '{date_str}'  order by enddate desc")
  image = cursor.fetchone()
  if not image or not image[0]:
    print(f"insert into wallpaper(enddate) values ('{date_str}');")
  date = date - timedelta(days=1)

conn.commit()
cursor.close()
conn.close()

