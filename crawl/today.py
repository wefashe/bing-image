import json
import requests
from faker import Factory
fc = Factory.create()

# https://www.todaybing.com 网站爬虫

def get_image_listByDate(year=2024, month=1, area='cn'):
    '''
      按年月国家爬取列表
      year 年份
      month 月份
    '''
    headers = {
      'User-Agent': fc.user_agent(),
      'Referer': 'https://www.todaybing.com'
    }
    data = {
      'year': year,
      'month': month,
      'area': area,
      'action': 'ajax_get_all'
    }
    url = f'https://www.todaybing.com/web/api'
    resp = requests.post(url, headers=headers, data=data)
    resp.encoding = resp.apparent_encoding
    return resp.json()

if __name__ == '__main__':
    list = get_image_listByDate(2023, 12)
    print(json.dumps(list, ensure_ascii=False, indent=2))


  