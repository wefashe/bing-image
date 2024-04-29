import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
import utils.date as date
import crawl.plmeizi as plmeizi
import datal.sqllite as sqllite



images = sqllite.query_image_list(' and enddate=20240429 ')
for image in images:
    print(image['enddate'], image['url'], image['title'], image['copyright'])







