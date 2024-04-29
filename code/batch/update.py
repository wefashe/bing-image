import sys
import os
import time
import random
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
import utils.date as date
import crawl.plmeizi as plmeizi
import datal.sqllite as sqllite



for i in range(1,96):
    print(f'第 {i} 页开始')
    images = plmeizi.get_image_listByPage(i)
    for p_image in images:
        p_date = p_image['date']
        p_title = p_image['title']
        p_url = p_image['url']
        p_copyright = p_image['copyright']
        query_images = sqllite.query_image_list('and enddate=' + p_date)
        q_image = query_images[0]
        q_title = q_image['title']
        q_url = q_image['url']
        q_copyright = q_image['copyright']
        if p_title == q_title and p_url == q_url and p_copyright == q_copyright:
            continue
        print(p_date)
        if q_title != p_title:
            print(q_title+' -----> '+p_title)
        if q_url != p_url:
            print(q_url+' -----> '+p_url)
        if q_copyright != p_copyright:
            print(q_copyright+' -----> '+p_copyright)
    time.sleep(random.uniform(0.5,1.5))








