#!/usr/bin/env python
# -*- coding: UTF-8 -*-

import sqlite3

def get_sqllite_cursor(path=r'docs/data/images.db'):
    '''
        dict true 字典形式,取值image['enddate']; false 元组形式 取值image[3]
    '''
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()
    '''
        create table if not exists bing_image                                         /* 必应美图表 */
        (
            date          varchar(8)   not null default ' ' primary key,              /* 日期      */
            title         varchar(150) not null default ' ',                          /* 标题      */
            url           varchar(200) not null default ' ',                          /* 图片地址   */
            keyword       varchar(100) not null default ' ',                          /* 关键词     */
            copyright     varchar(150) not null default ' ',                          /* 版权      */
            quickfact     varchar(200) not null default ' ',                          /* 速览      */
            description   text         not null default ' ',                          /* 描述      */
            updatetime    timestamp    not null default (datetime('now', '+8 hour'))  /* 修改时间   */
        );
    '''
    # 新增表
    cursor.execute('''
        create table if not exists wallpaper -- 壁纸表
        (
            startdate     varchar(8)   not null default ' ',
            fullstartdate varchar(50)  not null default ' ',
            enddate       varchar(8)   not null default ' ', -- 日期
            url           varchar(150) not null default ' ', -- 地址
            urlbase       varchar(100) not null default ' ',
            copyright     varchar(150) not null default ' ', -- 版权
            copyrightlink varchar(150) not null default ' ',
            title         varchar(100) not null default ' ', -- 标题
            quiz          varchar(150) not null default ' ',
            hsh           varchar(50)  not null default ' ',
            createtime    timestamp    not null default (datetime('now', '+8 hour')), -- 创建时间
            updatetime    timestamp    not null default (datetime('now', '+8 hour')), -- 修改时间
            primary key (enddate)
        );         ''')
    # 新增触发器
    cursor.execute('''
        create trigger if not exists update_timestamp before update on wallpaper for each row -- 修改时间修改时自动更新触发器
        begin
            update wallpaper 
            set updatetime = datetime('now', '+8 hour')
            where enddate = new.enddate;
        end;
                ''')
    # 新增索引
    cursor.execute('''
        create index if not exists idx_title on wallpaper (title);
                ''')
    cursor.execute('''
        create index if not exists idx_url on wallpaper (url);
                ''')
    cursor.execute('''
        create index if not exists idx_copyright on wallpaper (copyright); 
                ''')
    connection.commit()
    return connection, cursor

def query_image_list(condition=''):
    connection, cursor = get_sqllite_cursor()
    cursor.execute(f"SELECT * FROM wallpaper where 1=1 {condition} order by enddate desc")
    images = cursor.fetchall()
    close_sqllite_cursor(connection, cursor)
    return images
      

def update_image_list(images):
    if len(images) == 0:
        return 0
    image_list = []
    for image in images:
        startdate = image.get('startdate', ' ')
        fullstartdate = image.get('fullstartdate', ' ')
        enddate = image.get('enddate', ' ')
        url = image.get('url', ' ')
        urlbase = image.get('urlbase', ' ')
        copyright = image.get('copyright', ' ')
        copyrightlink = image.get('copyrightlink', ' ')
        title = image.get('title', ' ')
        quiz = image.get('quiz', ' ')
        hsh = image.get('hsh', ' ')
        image_list.append((startdate, fullstartdate, enddate, url, urlbase, copyright, copyrightlink, title, quiz, hsh,
                           startdate, fullstartdate, enddate, url, urlbase, copyright, copyrightlink, title, quiz, hsh))
    connection, cursor = get_sqllite_cursor()
    try:
        # 执行批量操作
        cursor.executemany('''
            insert into wallpaper (startdate, fullstartdate, enddate, url, urlbase, copyright, copyrightlink, title, quiz, hsh) 
            values( ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
            on conflict (enddate)
            do update set startdate=?, fullstartdate=?, enddate=?, url=?, urlbase=?, copyright=?, copyrightlink=?, title=?, quiz=?, hsh=?
                           ''', image_list)
        # 提交事务
        connection.commit()
        return cursor.rowcount
    except sqlite3.Error as e:
        # 发生错误，回滚事务
        connection.rollback()
        print("SQLite error:", e)
        return 0
    finally:
        close_sqllite_cursor(connection, cursor)

def close_sqllite_cursor(connection, cursor):
    cursor.close()
    connection.close()
