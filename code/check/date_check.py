import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
import datal.sqllite as sqllite
import utils.date as date_utils

'''
  检查壁纸的日期是否连续
'''

connection, cursor = sqllite.get_sqllite_cursor()
cursor.execute('select min(enddate) min_date,max(enddate) max_date,group_concat(enddate) all_date from wallpaper')
date_data = cursor.fetchone()

begin_date = date_utils.str_to_date(date_data[0])
end_date = date_utils.str_to_date(date_data[1])
interval=int((end_date-begin_date).days) +1
for i in range(0,interval,1):
  curr_date = date_utils.date_to_str(date_utils.date_add(begin_date, i))
  if curr_date not in date_data[2]:
    print(curr_date + ' 不存在')

sqllite.close_sqllite_cursor(connection, cursor)