#!/usr/bin/env python
# -*- coding: UTF-8 -*-

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
