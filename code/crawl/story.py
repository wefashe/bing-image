#!/usr/bin/env python
# -*- coding: UTF-8 -*-
import os
import json
import requests
from faker import Factory
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))

fc = Factory.create()

STORIES_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))), 'docs', 'data', 'stories.json')

def get_stories_from_api():
    '''
    从 cn.bing.com/hp/api/model 获取壁纸故事
    返回 dict: { 'Ssd日期': '故事文本', ... }
    '''
    headers = {
        'User-Agent': fc.user_agent(),
        'Referer': 'https://cn.bing.com'
    }
    url = 'https://cn.bing.com/hp/api/model'
    resp = requests.get(url, headers=headers, timeout=10)
    resp.encoding = resp.apparent_encoding
    if resp.status_code != 200:
        raise Exception(f'请求失败: status={resp.status_code}')

    data = resp.json()
    stories = {}
    for media in data.get('MediaContents', []):
        ssd = media.get('Ssd', '')
        if not ssd:
            continue
        image_content = media.get('ImageContent', {})
        quick_fact = image_content.get('QuickFact', {})
        main_text = quick_fact.get('MainText', '')
        description = image_content.get('Description', '')
        if main_text and description:
            story = f'{main_text}\n{description}'
        else:
            story = description or main_text or ''
        if story:
            stories[ssd] = story
    return stories

def load_stories():
    '''
    从 stories.json 加载已有的故事
    '''
    if os.path.exists(STORIES_PATH):
        try:
            with open(STORIES_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {}

def save_stories(stories):
    '''
    保存故事到 stories.json
    '''
    os.makedirs(os.path.dirname(STORIES_PATH), exist_ok=True)
    with open(STORIES_PATH, 'w', encoding='utf-8') as f:
        json.dump(stories, f, ensure_ascii=False, indent=2)

def update_today_story():
    '''
    获取今天的故事并更新到 stories.json
    返回: (日期, 故事) 或 None
    '''
    import utils.date as date_utils
    today = date_utils.str_date_now()
    api_stories = get_stories_from_api()
    story = api_stories.get(today, '')
    if not story:
        print(f'未从 API 中找到 {today} 的故事')
        return None
    # 合并到已有数据
    all_stories = load_stories()
    all_stories[today] = story
    save_stories(all_stories)
    print(f'成功更新 {today} 的故事')
    return (today, story)

if __name__ == '__main__':
    result = update_today_story()
    if result:
        print(f'日期: {result[0]}')
        print(f'故事: {result[1][:100]}...')
